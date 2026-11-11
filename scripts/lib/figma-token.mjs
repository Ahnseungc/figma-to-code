import fs from 'node:fs';
import path from 'node:path';

/** `.env.local` 또는 `FIGMA_TOKEN` 환경변수에서 토큰 로드 */
export function loadFigmaToken() {
  const fromEnv = process.env.FIGMA_TOKEN?.trim();
  if (fromEnv) return fromEnv.replace(/^['"]|['"]$/g, '');

  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return undefined;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^FIGMA_TOKEN=(.*)$/);
    if (!match) continue;
    return match[1].trim().replace(/^['"]|['"]$/g, '');
  }

  return undefined;
}
