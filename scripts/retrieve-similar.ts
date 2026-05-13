import * as fs from 'node:fs';
import * as path from 'node:path';

interface RetrievalRow {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  target_tm_romanized: string;
  quality_score: number;
  source_id: string;
  normalized_source: string;
}

function normalizeEnglish(value: string): string {
  return value
    .toLowerCase()
    .replace(/[!?.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeEnglish(value)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function jaccardScore(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  return intersection / union.size;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run retrieve -- "your english query" [k]');
    process.exit(1);
  }

  const maybeK = Number(args[args.length - 1]);
  const k = Number.isFinite(maybeK) && maybeK > 0 ? Math.floor(maybeK) : 5;
  const queryParts = Number.isFinite(maybeK) ? args.slice(0, -1) : args;
  const query = queryParts.join(' ').trim();
  if (!query) {
    console.error('Usage: npm run retrieve -- "your english query" [k]');
    process.exit(1);
  }

  const corpusPath = path.join(process.cwd(), 'src', 'data', 'processed', 'retrieval_corpus.json');
  if (!fs.existsSync(corpusPath)) {
    console.error('Missing retrieval corpus. Run: npm run data:prepare');
    process.exit(1);
  }

  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf-8')) as RetrievalRow[];
  const queryTokens = new Set(tokenize(query));

  const ranked = corpus
    .map((row) => {
      const rowTokens = new Set(tokenize(row.normalized_source));
      const score = jaccardScore(queryTokens, rowTokens);
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.row.quality_score - a.row.quality_score)
    .slice(0, k);

  console.log(JSON.stringify({ query, top_k: k, matches: ranked }, null, 2));
}

main();
