import { loadFigmaToken } from './figma-token.mjs';

const DEFAULT_FILE_KEY = process.env.FIGMA_FILE_KEY;

/**
 * Figma Images API — 벡터 기반 네이티브 PNG 렌더 (MCP 1x 스크린샷 업스케일보다 선명)
 * @returns {Promise<Buffer | null>} 토큰 없거나 실패 시 null
 */
export async function fetchFigmaNodePng(nodeId, scale, fileKey = DEFAULT_FILE_KEY) {
  if (!fileKey) throw new Error('fileKey 가 없습니다. 인자나 FIGMA_FILE_KEY 로 넘기세요.');
  const token = loadFigmaToken();
  if (!token) return null;

  const imagesUrl = new URL(`https://api.figma.com/v1/images/${fileKey}`);
  imagesUrl.searchParams.set('ids', nodeId);
  imagesUrl.searchParams.set('format', 'png');
  imagesUrl.searchParams.set('scale', String(scale));

  const imagesRes = await fetch(imagesUrl, {
    headers: { 'X-FIGMA-TOKEN': token },
  });

  if (!imagesRes.ok) {
    throw new Error(`Figma Images API ${imagesRes.status}: ${await imagesRes.text()}`);
  }

  const { images, err } = await imagesRes.json();
  if (err) {
    throw new Error(`Figma Images API 오류: ${err}`);
  }

  const renderUrl = images[nodeId];
  if (!renderUrl) return null;

  const pngRes = await fetch(renderUrl);
  if (!pngRes.ok) {
    throw new Error(`PNG 다운로드 실패 ${pngRes.status}`);
  }

  return Buffer.from(await pngRes.arrayBuffer());
}
