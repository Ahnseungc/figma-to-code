import { randomUUID } from 'node:crypto';

const WS_URL = process.env.TALK_TO_FIGMA_WS_URL ?? 'ws://127.0.0.1:3055';
const CHANNEL = process.env.TALK_TO_FIGMA_CHANNEL ?? 'cursor';
const EXPORT_TIMEOUT_MS = Number(process.env.TALK_TO_FIGMA_TIMEOUT_MS ?? 60_000);

let sharedSocket;
let sharedChannelJoined = false;
let connectPromise;

function parseMessage(raw) {
  return JSON.parse(typeof raw === 'string' ? raw : raw.toString());
}

function connectTalkToFigmaSocket() {
  if (sharedSocket?.readyState === WebSocket.OPEN && sharedChannelJoined) {
    return Promise.resolve(sharedSocket);
  }

  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const joinId = randomUUID();
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      connectPromise = undefined;
      sharedSocket = undefined;
      sharedChannelJoined = false;
      reject(error);
    };

    const timeout = setTimeout(() => {
      ws.close();
      fail(new Error('TalkToFigma WebSocket 연결 시간 초과'));
    }, EXPORT_TIMEOUT_MS);

    ws.addEventListener('open', () => {
      ws.send(
        JSON.stringify({
          id: joinId,
          type: 'join',
          channel: CHANNEL,
        }),
      );
    });

    ws.addEventListener('message', (event) => {
      const payload = parseMessage(event.data);
      const joined =
        payload.id === joinId &&
        payload.type === 'system' &&
        typeof payload.message?.result === 'string' &&
        payload.message.result.includes('Connected to channel');

      if (!joined) return;

      clearTimeout(timeout);
      settled = true;
      connectPromise = undefined;
      sharedSocket = ws;
      sharedChannelJoined = true;
      resolve(ws);
    });

    ws.addEventListener('error', () => {
      clearTimeout(timeout);
      fail(
        new Error(
          `TalkToFigma relay(${WS_URL})에 연결할 수 없습니다. bun socket 실행 및 Figma 플러그인 연결을 확인하세요.`,
        ),
      );
    });

    ws.addEventListener('close', () => {
      sharedSocket = undefined;
      sharedChannelJoined = false;
      if (!settled) {
        clearTimeout(timeout);
        fail(new Error('TalkToFigma WebSocket 연결이 종료되었습니다.'));
      }
    });
  });

  return connectPromise;
}

/**
 * TalkToFigma 플러그인 — Figma exportAsync 기반 네이티브 PNG (FIGMA_TOKEN 불필요)
 * 사전 조건: relay(3055) + Figma Cursor MCP Plugin 같은 채널(기본 cursor) 연결
 */
export async function fetchTalkToFigmaNodePng(nodeId, scale = 4) {
  const ws = await connectTalkToFigmaSocket();
  const requestId = randomUUID();

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`TalkToFigma export timeout (${nodeId})`));
    }, EXPORT_TIMEOUT_MS);

    const onMessage = (event) => {
      const payload = parseMessage(event.data);
      const response = payload.message;

      if (!response?.id || response.id !== requestId || !response.result) {
        return;
      }

      const result = response.result;
      const imageData = result.imageData ?? result.data;
      if (!imageData) {
        cleanup();
        reject(new Error(`TalkToFigma export 데이터 없음 (${nodeId})`));
        return;
      }

      cleanup();
      resolve(Buffer.from(imageData, 'base64'));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      ws.removeEventListener('message', onMessage);
    };

    ws.addEventListener('message', onMessage);

    ws.send(
      JSON.stringify({
        id: requestId,
        type: 'message',
        channel: CHANNEL,
        message: {
          id: requestId,
          command: 'export_node_as_image',
          params: {
            nodeId,
            format: 'PNG',
            scale,
            commandId: requestId,
          },
        },
      }),
    );
  });
}
