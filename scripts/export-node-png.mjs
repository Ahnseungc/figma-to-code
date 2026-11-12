#!/usr/bin/env node
// Figma 노드를 고해상도 PNG로 저장한다. 시각 QA 기준 이미지나 일러스트 에셋 추출용.
//
//   FIGMA_TOKEN=... node scripts/export-node-png.mjs <fileKey> <nodeId> <out.png> [scale]
//   node scripts/export-node-png.mjs --plugin <nodeId> <out.png> [scale]   # TalkToFigma relay, 토큰 불필요
import fs from 'node:fs';
import path from 'node:path';

import { fetchFigmaNodePng, normalizeNodeId } from './lib/figma-rest-export.mjs';
import { fetchTalkToFigmaNodePng } from './lib/figma-talk-to-figma-export.mjs';

const DEFAULT_SCALE = 4;

function usage() {
  console.error(
    'usage: export-node-png.mjs <fileKey> <nodeId> <out.png> [scale]\n' +
      '       export-node-png.mjs --plugin <nodeId> <out.png> [scale]',
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const usePlugin = args[0] === '--plugin';
  if (usePlugin) args.shift();

  const [fileKey, rawNodeId, out, scaleArg] = usePlugin ? [undefined, ...args] : args;
  if (!rawNodeId || !out || (!usePlugin && !fileKey)) usage();

  const nodeId = normalizeNodeId(rawNodeId);
  const scale = Number(scaleArg ?? DEFAULT_SCALE);
  const png = usePlugin
    ? await fetchTalkToFigmaNodePng(nodeId, scale)
    : await fetchFigmaNodePng(nodeId, scale, fileKey);

  if (!png) {
    throw new Error('PNG를 받지 못했습니다. FIGMA_TOKEN 또는 nodeId를 확인하세요.');
  }

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, png);
  console.log(`${nodeId} → ${out} (${png.length} bytes)`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
