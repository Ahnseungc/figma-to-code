#!/usr/bin/env node
// Figma 노드를 고해상도 PNG로 저장한다. 시각 QA 기준 이미지나 일러스트 에셋 추출용.
//
//   FIGMA_TOKEN=... node scripts/export-node-png.mjs <fileKey> <nodeId> <out.png> [scale]
import fs from 'node:fs';
import path from 'node:path';

import { fetchFigmaNodePng, normalizeNodeId } from './lib/figma-rest-export.mjs';

const DEFAULT_SCALE = 4;

async function main() {
  const [fileKey, rawNodeId, out, scaleArg] = process.argv.slice(2);
  if (!fileKey || !rawNodeId || !out) {
    console.error('usage: export-node-png.mjs <fileKey> <nodeId> <out.png> [scale]');
    process.exit(1);
  }

  const nodeId = normalizeNodeId(rawNodeId);
  const png = await fetchFigmaNodePng(nodeId, Number(scaleArg ?? DEFAULT_SCALE), fileKey);
  if (!png) {
    throw new Error('PNG를 받지 못했습니다. FIGMA_TOKEN 또는 nodeId를 확인하세요.');
  }

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, png);
  console.log(`${nodeId} → ${out} (${png.length} bytes)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
