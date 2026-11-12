import { loadFigmaToken } from './figma-token.mjs';

const FIGMA_API = 'https://api.figma.com/v1';
const DEFAULT_FILE_KEY = process.env.FIGMA_FILE_KEY;

/** URL 의 `node-id=12-345` (인스턴스 `I12-345;67-89`) 를 API 형식 `12:345` 로 */
export function normalizeNodeId(nodeId) {
  return nodeId.replaceAll('-', ':');
}

function requireToken() {
  const token = loadFigmaToken();
  if (!token) {
    throw new Error(
      'FIGMA_TOKEN 이 없습니다. Figma → Settings → Personal access tokens 에서 발급 후 ' +
        '환경변수나 .env.local 에 FIGMA_TOKEN=... 으로 넣으세요.',
    );
  }
  return token;
}

function requireFileKey(fileKey) {
  if (!fileKey) throw new Error('fileKey 가 없습니다. 인자나 FIGMA_FILE_KEY 로 넘기세요.');
  return fileKey;
}

async function figmaGet(pathname, params, token) {
  const url = new URL(`${FIGMA_API}${pathname}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const res = await fetch(url, { headers: { 'X-FIGMA-TOKEN': token } });
  if (!res.ok) {
    throw new Error(`Figma API ${pathname} ${res.status}: ${await res.text()}`);
  }

  const body = await res.json();
  if (body.err) throw new Error(`Figma API 오류: ${body.err}`);
  return body;
}

/**
 * Figma Images API — 여러 노드를 한 번에 렌더해 Buffer 로 받는다.
 * @param {string[]} nodeIds
 * @param {{ format?: 'png' | 'svg' | 'jpg' | 'pdf', scale?: number, fileKey?: string }} options
 * @returns {Promise<Map<string, Buffer>>} 렌더 URL 이 없는 노드는 빠진다
 */
export async function fetchFigmaNodeImages(nodeIds, options = {}) {
  const { format = 'png', scale = 2, fileKey = DEFAULT_FILE_KEY } = options;
  const token = requireToken();

  const params = { ids: nodeIds.join(','), format };
  if (format !== 'svg') params.scale = scale;

  const { images } = await figmaGet(`/images/${requireFileKey(fileKey)}`, params, token);
  const result = new Map();

  for (const nodeId of nodeIds) {
    const renderUrl = images[nodeId];
    if (!renderUrl) continue;

    const res = await fetch(renderUrl);
    if (!res.ok) throw new Error(`${nodeId} 다운로드 실패 ${res.status}`);
    result.set(nodeId, Buffer.from(await res.arrayBuffer()));
  }

  return result;
}

/** 노드 하나를 PNG 로 (벡터 기반 네이티브 렌더 — MCP 1x 스크린샷 업스케일보다 선명) */
export async function fetchFigmaNodePng(nodeId, scale, fileKey = DEFAULT_FILE_KEY) {
  const images = await fetchFigmaNodeImages([nodeId], { format: 'png', scale, fileKey });
  return images.get(nodeId) ?? null;
}

/**
 * Figma REST nodes API — 레이아웃·수치의 정본(SSOT).
 * @returns {Promise<Record<string, { document: object }>>}
 */
export async function fetchFigmaNodes(nodeIds, fileKey = DEFAULT_FILE_KEY) {
  const token = requireToken();
  const { nodes } = await figmaGet(
    `/files/${requireFileKey(fileKey)}/nodes`,
    { ids: nodeIds.join(',') },
    token,
  );
  return nodes;
}
