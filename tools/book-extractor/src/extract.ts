/**
 * Extracts the legacy opening book (legacy/js/book.js) into
 * packages/ai/src/book.json so the AI package has no runtime dependency
 * on legacy JS.
 *
 * Output format (compact, one line per entry):
 * {
 *   "generatedAt": "2026-04-30T12:34:56.789Z",
 *   "sourceSha256": "…",
 *   "entries": [[key, mv, weight], …]
 * }
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const HERE = (import.meta as { dir?: string }).dir ?? new URL('.', import.meta.url).pathname;
const REPO_ROOT = resolve(HERE, '../../..');
const SOURCE = resolve(REPO_ROOT, 'legacy/js/book.js');
const DEST = resolve(REPO_ROOT, 'packages/ai/src/book.json');

async function main(): Promise<void> {
  const sourceText = await readFile(SOURCE, 'utf8');
  const sourceSha256 = createHash('sha256').update(sourceText).digest('hex');

  const mod = await import(SOURCE);
  const raw = mod.BOOK_DAT as unknown;
  if (!Array.isArray(raw)) {
    throw new Error(`BOOK_DAT is not an array: ${typeof raw}`);
  }

  const entries: Array<[number, number, number]> = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length !== 3) {
      throw new Error(`bad row: ${JSON.stringify(row)}`);
    }
    const [k, m, w] = row as [unknown, unknown, unknown];
    if (typeof k !== 'number' || typeof m !== 'number' || typeof w !== 'number') {
      throw new Error(`bad row types: ${JSON.stringify(row)}`);
    }
    entries.push([k | 0, m | 0, w | 0]);
  }

  // Sort by (key, mv) to give a deterministic output ordering. The runtime
  // loader sorts entries per key anyway, so this does not affect behaviour.
  entries.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));

  const out = {
    generatedAt: new Date().toISOString(),
    sourceSha256,
    entries,
  };

  await writeFile(DEST, JSON.stringify(out) + '\n', 'utf8');
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${entries.length} entries to ${DEST} (source sha256 ${sourceSha256})`,
  );
}

void main();
