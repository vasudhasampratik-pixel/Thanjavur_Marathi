import * as fs from 'node:fs';
import * as path from 'node:path';

interface TrainingRow {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  target_tm_romanized: string;
  quality_score: number;
  source_id: string;
}

interface FeedbackRow {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  model_target_tm_romanized: string;
  corrected_target_tm_romanized: string;
  source_id: string;
  reviewer_id?: string;
  timestamp: string;
}

interface HfRow {
  input_text: string;
  target_text: string;
  weight: number;
  source_id: string;
  source_type: 'training' | 'feedback_gold';
}

const ROOT = process.cwd();
const PROCESSED_DIR = path.join(ROOT, 'src', 'data', 'processed');

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function readJsonl<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const body = fs.readFileSync(filePath, 'utf-8').trim();
  if (!body) return [];
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as T);
}

function writeJsonl(filePath: string, rows: unknown[]): void {
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, body ? `${body}\n` : '', 'utf-8');
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function toInputText(sourceEnglish: string, speakerProfile: string, sentenceFamily: string): string {
  return `[PROFILE=${speakerProfile}] [FAMILY=${sentenceFamily}] ${sourceEnglish}`;
}

function hashToBucket(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % 10;
}

function main(): void {
  const trainingPath = path.join(PROCESSED_DIR, 'training_rows.json');
  const feedbackPath = path.join(PROCESSED_DIR, 'feedback_gold.jsonl');

  if (!fs.existsSync(trainingPath)) {
    console.error('Missing training_rows.json. Run: npm run data:prepare');
    process.exit(1);
  }

  const trainingRows = readJson<TrainingRow[]>(trainingPath);
  const feedbackRows = readJsonl<FeedbackRow>(feedbackPath);

  const hfRows: HfRow[] = [];

  for (const row of trainingRows) {
    if (!row.source_english || !row.target_tm_romanized) continue;
    hfRows.push({
      input_text: toInputText(
        normalize(row.source_english),
        normalize(row.speaker_profile),
        normalize(row.sentence_family),
      ),
      target_text: normalize(row.target_tm_romanized),
      weight: row.quality_score,
      source_id: normalize(row.source_id),
      source_type: 'training',
    });
  }

  for (const row of feedbackRows) {
    if (!row.source_english || !row.corrected_target_tm_romanized) continue;
    hfRows.push({
      input_text: toInputText(
        normalize(row.source_english),
        normalize(row.speaker_profile),
        normalize(row.sentence_family),
      ),
      target_text: normalize(row.corrected_target_tm_romanized),
      weight: 1.25,
      source_id: normalize(row.source_id),
      source_type: 'feedback_gold',
    });
  }

  const deduped = new Map<string, HfRow>();
  for (const row of hfRows) {
    const key = `${row.input_text}|||${row.target_text}`;
    const existing = deduped.get(key);
    if (!existing || row.weight > existing.weight) {
      deduped.set(key, row);
    }
  }

  const allRows = [...deduped.values()];
  const train: HfRow[] = [];
  const evalRows: HfRow[] = [];

  for (const row of allRows) {
    const bucket = hashToBucket(`${row.source_id}|${row.input_text}|${row.target_text}`);
    if (bucket === 0) {
      evalRows.push(row);
    } else {
      train.push(row);
    }
  }

  const allPath = path.join(PROCESSED_DIR, 'hf_dataset_all.jsonl');
  const trainPath = path.join(PROCESSED_DIR, 'hf_dataset_train.jsonl');
  const evalPath = path.join(PROCESSED_DIR, 'hf_dataset_eval.jsonl');
  const summaryPath = path.join(PROCESSED_DIR, 'hf_dataset_summary.json');

  writeJsonl(allPath, allRows);
  writeJsonl(trainPath, train);
  writeJsonl(evalPath, evalRows);

  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        rows_all: allRows.length,
        rows_train: train.length,
        rows_eval: evalRows.length,
        training_source_rows: trainingRows.length,
        feedback_source_rows: feedbackRows.length,
      },
      null,
      2,
    ) + '\n',
    'utf-8',
  );

  console.log('Hugging Face dataset export complete.');
  console.log(`- all rows: ${allRows.length}`);
  console.log(`- train rows: ${train.length}`);
  console.log(`- eval rows: ${evalRows.length}`);
  console.log(`- from feedback_gold rows: ${feedbackRows.length}`);
}

main();
