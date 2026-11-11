#!/usr/bin/env node
// Figma REST nodes API 로 노드 스펙 스냅샷을 저장한다. figma-spec-qa 스킬의 정본 입력.
//
//   FIGMA_TOKEN=... node scripts/fetch-node-spec.mjs <fileKey> <nodeId> [out.json]
//
// out 을 생략하면 stdout 으로 출력한다.
import fs from 'node:fs';
import path from 'node:path';

import { flattenNodeSpec } from './lib/figma-node-spec.mjs';
import { fetchFigmaNodes } from './lib/figma-rest-export.mjs';

async function main() {
  const [fileKey, rawNodeId, out] = process.argv.slice(2);
  if (!fileKey || !rawNodeId) {
    console.error('usage: fetch-node-spec.mjs <fileKey> <nodeId> [out.json]');
    process.exit(1);
  }

  const nodeId = rawNodeId.replace('-', ':');
  const nodes = await fetchFigmaNodes([nodeId], fileKey);
  const document = nodes[nodeId]?.document;
  if (!document) throw new Error(`노드를 찾지 못했습니다: ${nodeId}`);

  const snapshot = {
    fileKey,
    nodeId,
    name: document.name,
    fetchedAt: new Date().toISOString(),
    nodes: flattenNodeSpec(document),
  };
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;

  if (!out) {
    process.stdout.write(json);
    return;
  }

  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, json);
  console.log(`${nodeId} (${document.name}) → ${out} · ${snapshot.nodes.length} nodes`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
