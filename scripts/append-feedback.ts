import * as fs from 'node:fs';
import * as path from 'node:path';

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

function usageAndExit(): never {
  console.error(
    'Usage: npm run feedback:add -- "<english>" "<profile>" "<family>" "<model_output>" "<corrected_output>" "<source_id>" [reviewer_id]',
  );
  process.exit(1);
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 6) usageAndExit();

  const [sourceEnglish, speakerProfile, sentenceFamily, modelOutput, correctedOutput, sourceId, reviewerId] = args;

  const row: FeedbackRow = {
    source_english: normalize(sourceEnglish),
    speaker_profile: normalize(speakerProfile),
    sentence_family: normalize(sentenceFamily),
    model_target_tm_romanized: normalize(modelOutput),
    corrected_target_tm_romanized: normalize(correctedOutput),
    source_id: normalize(sourceId),
    ...(reviewerId ? { reviewer_id: normalize(reviewerId) } : {}),
    timestamp: new Date().toISOString(),
  };

  if (
    !row.source_english ||
    !row.speaker_profile ||
    !row.sentence_family ||
    !row.model_target_tm_romanized ||
    !row.corrected_target_tm_romanized ||
    !row.source_id
  ) {
    usageAndExit();
  }

  const filePath = path.join(process.cwd(), 'src', 'data', 'processed', 'feedback_gold.jsonl');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(row) + '\n', 'utf-8');

  console.log('Feedback row appended to feedback_gold.jsonl');
}

main();
