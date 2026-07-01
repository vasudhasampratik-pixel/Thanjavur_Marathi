import * as fs from 'node:fs';
import * as path from 'node:path';

type AnyRecord = Record<string, unknown>;

interface LegacySentence {
  promptEnglish: string;
  translation: string;
  sourceFile: string;
}

interface FirebaseSentenceRecord {
  audioUrl: null;
  category: string;
  confidence: 'confident';
  contributorEmail: 'vasoosk@gmail.com';
  contributorName: 'Vasudha';
  promptEnglish: string;
  promptId: string;
  promptType: 'sentence';
  reviewedAt: null;
  reviewerComment: null;
  reviewerUid: null;
  status: 'pending';
  submittedAt: 'June 28, 2026 at 1:55:06 PM UTC+5:30';
  translation: string;
  uid: 'xnpeIsRZLeYvPByYwV8bTCcUo463';
}

const ROOT = process.cwd();
const PROCESSED_DIR = path.join(ROOT, 'src', 'data', 'processed');

const REQUIRED_FILES = [
  'hf_dataset_all.jsonl',
  'hf_dataset_eval.jsonl',
  'hf_dataset_train.jsonl',
  'retrieval_corpus.json',
  'sentences_expanded_all.json',
  'training_rows.json',
  'training_rows.jsonl',
];

const RETRIEVAL_FILE_FALLBACK = ['retrieval_corpus.json', 'retreival_corpus.json'];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function cleanPrompt(promptEnglish: string): string {
  const withoutTags = promptEnglish.replace(/\[[^\]]+\]/g, ' ');
  return normalizeText(withoutTags);
}

function readJsonArray(filePath: string): AnyRecord[] {
  const body = fs.readFileSync(filePath, 'utf-8').trim();
  if (!body) return [];
  const parsed = JSON.parse(body);
  return Array.isArray(parsed) ? (parsed as AnyRecord[]) : [];
}

function readJsonlArray(filePath: string): AnyRecord[] {
  const body = fs.readFileSync(filePath, 'utf-8').trim();
  if (!body) return [];
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as AnyRecord);
}

function inferCategory(promptEnglish: string): string {
  const text = promptEnglish.toLowerCase();

  if (/\b(hello|hi|good morning|good evening|thank you|thanks|sorry|please|welcome|bye|good night)\b/.test(text)) {
    return 'greetings';
  }
  if (/\b(mother|father|mom|dad|brother|sister|family|son|daughter|wife|husband|uncle|aunt|grandmother|grandfather|child|children)\b/.test(text)) {
    return 'family';
  }
  if (/\b(food|eat|drink|water|tea|coffee|rice|bread|lunch|dinner|breakfast|hungry|cook|kitchen)\b/.test(text)) {
    return 'food';
  }
  if (/\b(bus|train|station|ticket|road|left|right|airport|travel|journey|go to|come from|hotel|map)\b/.test(text)) {
    return 'travel';
  }
  if (/\?$|\b(what|why|when|where|who|which|how|can|could|would|do|does|did|is|are|am)\b/.test(text)) {
    return 'questions';
  }
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|first|second|third|number|count)\b/.test(text)) {
    return 'numbers';
  }
  if (/\b(run|walk|sit|stand|open|close|write|read|speak|listen|work|play|sleep|stop|start|bring|take)\b/.test(text)) {
    return 'actions';
  }
  if (/\b(happy|sad|angry|afraid|fear|worried|excited|tired|calm|love|hate|feel|emotion)\b/.test(text)) {
    return 'emotions';
  }
  if (/\b(today|tomorrow|yesterday|home|school|office|market|friend|time|day|night|weather|daily)\b/.test(text)) {
    return 'daily_conversation';
  }

  return 'general';
}

function resolveInputFiles(): string[] {
  const resolved: string[] = [];

  for (const file of REQUIRED_FILES) {
    if (file === 'retrieval_corpus.json') {
      const existing = RETRIEVAL_FILE_FALLBACK.find((name) =>
        fs.existsSync(path.join(PROCESSED_DIR, name)),
      );
      if (!existing) {
        throw new Error('Missing retrieval corpus file. Expected retrieval_corpus.json or retreival_corpus.json');
      }
      resolved.push(existing);
      continue;
    }

    if (!fs.existsSync(path.join(PROCESSED_DIR, file))) {
      throw new Error(`Missing required input file: ${file}`);
    }
    resolved.push(file);
  }

  return resolved;
}

function extractLegacySentences(files: string[]): LegacySentence[] {
  const rows: LegacySentence[] = [];

  for (const file of files) {
    const filePath = path.join(PROCESSED_DIR, file);
    const rawRows = file.endsWith('.jsonl') ? readJsonlArray(filePath) : readJsonArray(filePath);

    for (const row of rawRows) {
      const rawPrompt = typeof row.promptEnglish === 'string' ? row.promptEnglish : '';
      const rawTranslation = typeof row.translation === 'string' ? row.translation : '';
      const promptEnglish = cleanPrompt(rawPrompt);
      const translation = normalizeText(rawTranslation);

      if (!promptEnglish || !translation) continue;

      rows.push({
        promptEnglish,
        translation,
        sourceFile: file,
      });
    }
  }

  return rows;
}

function dedupeByPair(rows: LegacySentence[]): LegacySentence[] {
  const unique = new Map<string, LegacySentence>();

  for (const row of rows) {
    const key = `${row.promptEnglish}|||${row.translation}`;
    if (!unique.has(key)) {
      unique.set(key, row);
    }
  }

  return [...unique.values()];
}

function buildConflictReport(rows: LegacySentence[]): Record<string, string[]> {
  const byPrompt = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!byPrompt.has(row.promptEnglish)) {
      byPrompt.set(row.promptEnglish, new Set<string>());
    }
    byPrompt.get(row.promptEnglish)?.add(row.translation);
  }

  const conflicts: Record<string, string[]> = {};
  for (const [promptEnglish, translations] of byPrompt.entries()) {
    if (translations.size > 1) {
      conflicts[promptEnglish] = [...translations.values()].sort();
    }
  }

  return conflicts;
}

function toFirebaseRecord(row: LegacySentence, index: number): FirebaseSentenceRecord {
  return {
    audioUrl: null,
    category: inferCategory(row.promptEnglish),
    confidence: 'confident',
    contributorEmail: 'vasoosk@gmail.com',
    contributorName: 'Vasudha',
    promptEnglish: row.promptEnglish,
    promptId: `legacy_sentence_${String(index + 1).padStart(6, '0')}`,
    promptType: 'sentence',
    reviewedAt: null,
    reviewerComment: null,
    reviewerUid: null,
    status: 'pending',
    submittedAt: 'June 28, 2026 at 1:55:06 PM UTC+5:30',
    translation: row.translation,
    uid: 'xnpeIsRZLeYvPByYwV8bTCcUo463',
  };
}

function writeJsonl(filePath: string, rows: unknown[]): void {
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, body ? `${body}\n` : '', 'utf-8');
}

function main(): void {
  const inputFiles = resolveInputFiles();
  const extracted = extractLegacySentences(inputFiles);
  const uniquePairs = dedupeByPair(extracted);

  uniquePairs.sort((a, b) => {
    const promptCmp = a.promptEnglish.localeCompare(b.promptEnglish);
    if (promptCmp !== 0) return promptCmp;
    return a.translation.localeCompare(b.translation);
  });

  const firebaseRows = uniquePairs.map((row, index) => toFirebaseRecord(row, index));
  const conflicts = buildConflictReport(uniquePairs);

  const outputPath = path.join(PROCESSED_DIR, 'translated_sentences.jsonl');
  const conflictsPath = path.join(PROCESSED_DIR, 'translated_sentences_conflicts.json');
  const summaryPath = path.join(PROCESSED_DIR, 'translated_sentences_summary.json');

  writeJsonl(outputPath, firebaseRows);
  fs.writeFileSync(conflictsPath, `${JSON.stringify(conflicts, null, 2)}\n`, 'utf-8');
  fs.writeFileSync(
    summaryPath,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        input_files_processed: inputFiles,
        extracted_rows: extracted.length,
        unique_prompt_translation_pairs: uniquePairs.length,
        conflicting_prompts_count: Object.keys(conflicts).length,
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );

  console.log('Firebase legacy sentence export complete.');
  console.log(`- input files processed: ${inputFiles.length}`);
  console.log(`- extracted rows (with valid promptEnglish+translation): ${extracted.length}`);
  console.log(`- unique prompt+translation pairs: ${uniquePairs.length}`);
  console.log(`- conflicting prompts (multiple translations): ${Object.keys(conflicts).length}`);
  console.log(`- output: ${path.relative(ROOT, outputPath)}`);
  console.log(`- conflicts: ${path.relative(ROOT, conflictsPath)}`);
  console.log(`- summary: ${path.relative(ROOT, summaryPath)}`);
}

main();