#!/usr/bin/env node
// 매니페스트에 적은 Figma 노드들을 한 번에 PNG/SVG 에셋으로 저장한다.
// 화면마다 export 스크립트를 새로 쓰지 않고 매니페스트 JSON 만 추가한다.
//
//   FIGMA_TOKEN=... node scripts/export-assets.mjs <manifest.json>
//
// manifest.json 예시: examples/assets.manifest.json
import fs from 'node:fs';
import path from 'node:path';

import { fetchFigmaNodeImages } from './lib/figma-rest-export.mjs';

const DEFAULT_SCALE = 3;

function readManifest(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest.fileKey || !manifest.outDir || !Array.isArray(manifest.assets)) {
    throw new Error('manifest 에 fileKey, outDir, assets[] 가 필요합니다.');
  }
  return manifest;
}

function groupByFormat(manifest) {
  const groups = new Map();
  for (const asset of manifest.assets) {
    const format = asset.format ?? manifest.format ?? 'png';
    const scale = asset.scale ?? manifest.scale ?? DEFAULT_SCALE;
    const key = `${format}@${scale}`;
    if (!groups.has(key)) groups.set(key, { format, scale, assets: [] });
    groups.get(key).assets.push(asset);
  }
  return [...groups.values()];
}

async function exportGroup(manifest, { format, scale, assets }) {
  const images = await fetchFigmaNodeImages(
    assets.map((asset) => asset.nodeId),
    { format, scale, fileKey: manifest.fileKey },
  );

  let failed = 0;
  for (const asset of assets) {
    const buffer = images.get(asset.nodeId);
    if (!buffer) {
      console.error(`[fail] ${asset.file} (${asset.nodeId}): 렌더 URL 없음`);
      failed += 1;
      continue;
    }
    const outPath = path.join(manifest.outDir, asset.file);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, buffer);
    console.log(`[ok] ${asset.nodeId} → ${outPath} (${buffer.length} bytes)`);
  }
  return failed;
}

async function main() {
  const [manifestPath] = process.argv.slice(2);
  if (!manifestPath) {
    console.error('usage: export-assets.mjs <manifest.json>');
    process.exit(1);
  }

  const manifest = readManifest(manifestPath);
  let failed = 0;
  for (const group of groupByFormat(manifest)) failed += await exportGroup(manifest, group);

  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
