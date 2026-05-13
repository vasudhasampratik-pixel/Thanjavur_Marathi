import * as fs from 'node:fs';
import * as path from 'node:path';

type Quality = 'gold' | 'ok' | 'quarantine';

interface RawDictionaryEntry {
  id?: string;
  english?: string;
  english_variants?: string[];
  tm_romanized?: string;
  tm_devanagari?: string;
  category?: string;
}

interface RawDictionary {
  entries: RawDictionaryEntry[];
}

interface RawSentenceVariant {
  tm_romanized?: string;
}

interface RawSentence {
  sentence_id?: string;
  english?: string;
  variants?: Record<string, RawSentenceVariant>;
}

interface CleanLexiconRow {
  id: string;
  meaning_english: string;
  canonical_tm_romanized: string;
  alternate_tm_romanized: string[];
  category: string;
  quality: Quality;
  source_ids: string[];
}

interface ExplodedSentenceRow {
  source_id: string;
  sentence_id: string;
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  target_tm_romanized: string;
  alternate_tm_romanized: string[];
  quality: Quality;
  quality_score: number;
  quarantine_reason?: string;
}

interface MissingSentenceRow {
  sentence_id: string;
  source_english: string;
  reason: string;
}

interface TrainingRow {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  target_tm_romanized: string;
  quality_score: number;
  source_id: string;
}

const ROOT = process.cwd();
const DICTIONARY_PATH = path.join(ROOT, 'src', 'data', 'dictionary.json');
const SENTENCES_PATH = path.join(ROOT, 'src', 'data', 'app_dictionary.json');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'processed');

const QUALITY_SCORE: Record<Quality, number> = {
  gold: 1,
  ok: 0.75,
  quarantine: 0.1,
};

const KNOWN_PROFILES = new Set(['young_female', 'young_male', 'elder_respectful']);

const FIXED_FORMULA_ENGLISH = new Set([
  'how are you',
  'i am fine',
  'nice to meet you',
  'thank you',
  'you are welcome',
  'sorry',
  'excuse me',
  'goodbye',
  'see you tomorrow',
  'come again',
]);

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function writeJsonl(filePath: string, rows: unknown[]): void {
  const body = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, body.length > 0 ? body + '\n' : '', 'utf-8');
}

function ensureOutDir(): void {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeEnglish(value: string): string {
  return normalizeWhitespace(
    value
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[!?.,;:()]/g, ' '),
  );
}

function normalizeTm(value: string): string {
  return normalizeWhitespace(value.toLowerCase());
}

function splitVariants(value: string): string[] {
  return value
    .split(/[\/|]/g)
    .map((part) => normalizeTm(part))
    .filter((part) => part.length > 0);
}

function hasDevanagari(value: string): boolean {
  return /[\u0900-\u097F]/.test(value);
}

function hasClearlyBadSymbols(value: string): boolean {
  return /[=~@#$%^*<>\[\]{}]/.test(value);
}

function inferLexiconQuality(args: {
  meaning: string;
  canonicalTm: string;
  hasPackedAlternates: boolean;
  hadDuplicateMeaning: boolean;
}): Quality {
  if (
    !args.meaning ||
    !args.canonicalTm ||
    hasDevanagari(args.canonicalTm) ||
    hasClearlyBadSymbols(args.canonicalTm)
  ) {
    return 'quarantine';
  }

  const tokenCount = args.canonicalTm.split(' ').length;
  if (tokenCount > 5) {
    return 'quarantine';
  }

  if (args.hasPackedAlternates || args.hadDuplicateMeaning) {
    return 'ok';
  }

  return 'gold';
}

function inferSentenceFamily(sourceEnglishRaw: string): string {
  const sourceEnglish = normalizeEnglish(sourceEnglishRaw);

  if (FIXED_FORMULA_ENGLISH.has(sourceEnglish)) {
    return 'fixed_formula';
  }

  const isQuestion = /\?$/.test(sourceEnglishRaw.trim());
  const isWh = /^(what|where|when|why|how|who|which)\b/.test(sourceEnglish);

  if (isQuestion && isWh) return 'wh_question';
  if (isQuestion) return 'yes_no_question';

  if (/^(please\s+)?(do not|don't|open|close|bring|keep|sit|stand|listen|speak|tell|show|call|write|read|wait|walk|turn|go|come|take|wash|cut|fill|repair|charge|feed|help|give|add|stop|start|ask)\b/.test(sourceEnglish)) {
    return 'imperative';
  }

  if (/\b(am|is|are)\s+\w+ing\b/.test(sourceEnglish)) {
    return 'progressive';
  }

  if (/\b(yesterday|last|went|came|did|was|were|finished|arrived|stayed|missed)\b/.test(sourceEnglish)) {
    return 'past';
  }

  if (/\b(will|tomorrow|next|going to)\b/.test(sourceEnglish)) {
    return 'future';
  }

  if (/\b(in|on|at|inside|outside|near|here|there|home|village|school|hall|kitchen)\b/.test(sourceEnglish)) {
    return 'location';
  }

  if (/\b(hungry|thirsty|feel|feeling|want|need|like|afraid|happy|sad|worried|tired|pain|hurts|headache|fever)\b/.test(sourceEnglish)) {
    return 'experiencer';
  }

  if (/\b(i am|my name is|this is|he is|she is|they are|we are)\b/.test(sourceEnglish)) {
    return 'identity';
  }

  return 'description';
}

function cleanLexicon(rawDictionary: RawDictionary): {
  cleanRows: CleanLexiconRow[];
  quarantineRows: CleanLexiconRow[];
} {
  const byMeaning = new Map<
    string,
    {
      meaning: string;
      category: string;
      sourceIds: Set<string>;
      tmCandidates: string[];
      hasPackedAlternates: boolean;
      count: number;
    }
  >();

  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  for (const entry of rawDictionary.entries ?? []) {
    const entryId = normalizeWhitespace(entry.id ?? '');
    if (entryId.length > 0) {
      if (seenIds.has(entryId)) duplicateIds.add(entryId);
      seenIds.add(entryId);
    }

    const meaning = normalizeEnglish(entry.english ?? '');
    if (!meaning) continue;

    const category = normalizeWhitespace((entry.category ?? 'misc').toLowerCase()) || 'misc';
    const packed = splitVariants(entry.tm_romanized ?? '');
    if (packed.length === 0) continue;

    const bucket = byMeaning.get(meaning) ?? {
      meaning,
      category,
      sourceIds: new Set<string>(),
      tmCandidates: [],
      hasPackedAlternates: false,
      count: 0,
    };

    if ((entry.tm_romanized ?? '').includes('/') || (entry.tm_romanized ?? '').includes('|')) {
      bucket.hasPackedAlternates = true;
    }

    for (const candidate of packed) {
      bucket.tmCandidates.push(candidate);
    }

    if (entryId) bucket.sourceIds.add(entryId);
    bucket.count += 1;
    byMeaning.set(meaning, bucket);
  }

  const rows: CleanLexiconRow[] = [];
  let index = 1;

  for (const bucket of byMeaning.values()) {
    const uniqueCandidates = [...new Set(bucket.tmCandidates)].filter((x) => x.length > 0);
    if (uniqueCandidates.length === 0) continue;

    const canonical = uniqueCandidates[0];
    const alternates = uniqueCandidates.slice(1);

    const quality = inferLexiconQuality({
      meaning: bucket.meaning,
      canonicalTm: canonical,
      hasPackedAlternates: bucket.hasPackedAlternates,
      hadDuplicateMeaning: bucket.count > 1,
    });

    const sourceIds = [...bucket.sourceIds];
    if (sourceIds.some((sourceId) => duplicateIds.has(sourceId))) {
      if (quality === 'gold') {
        // downgrade only when the source ID itself had duplication.
      }
    }

    rows.push({
      id: `LEX${String(index).padStart(4, '0')}`,
      meaning_english: bucket.meaning,
      canonical_tm_romanized: canonical,
      alternate_tm_romanized: alternates,
      category: bucket.category,
      quality,
      source_ids: sourceIds,
    });

    index += 1;
  }

  const cleanRows = rows.filter((row) => row.quality !== 'quarantine');
  const quarantineRows = rows.filter((row) => row.quality === 'quarantine');

  return { cleanRows, quarantineRows };
}

function inferSentenceQuality(sourceEnglish: string, canonicalTm: string, hadAlternates: boolean): { quality: Quality; reason?: string } {
  if (!sourceEnglish || !canonicalTm) {
    return { quality: 'quarantine', reason: 'missing_text' };
  }

  if (hasDevanagari(canonicalTm)) {
    return { quality: 'quarantine', reason: 'contains_devanagari' };
  }

  if (hasClearlyBadSymbols(canonicalTm)) {
    return { quality: 'quarantine', reason: 'contains_bad_symbols' };
  }

  if (canonicalTm.split(' ').length > 14) {
    return { quality: 'quarantine', reason: 'too_long' };
  }

  if (hadAlternates) {
    return { quality: 'ok', reason: 'alternate_spellings_present' };
  }

  return { quality: 'gold' };
}

function cleanSentences(rawSentences: RawSentence[]): {
  explodedRows: ExplodedSentenceRow[];
  quarantineRows: ExplodedSentenceRow[];
  missingRows: MissingSentenceRow[];
  trainingRows: TrainingRow[];
} {
  const explodedRows: ExplodedSentenceRow[] = [];
  const quarantineRows: ExplodedSentenceRow[] = [];
  const missingRows: MissingSentenceRow[] = [];
  const trainingRows: TrainingRow[] = [];

  for (const sentence of rawSentences) {
    const sentenceId = normalizeWhitespace(sentence.sentence_id ?? 'UNKNOWN');
    const sourceEnglish = normalizeWhitespace(sentence.english ?? '');
    const variants = sentence.variants ?? {};
    const profiles = Object.keys(variants);

    if (!sourceEnglish || profiles.length === 0) {
      missingRows.push({
        sentence_id: sentenceId,
        source_english: sourceEnglish,
        reason: !sourceEnglish ? 'missing_english' : 'missing_variants',
      });
      continue;
    }

    const sentenceFamily = inferSentenceFamily(sourceEnglish);

    for (const speakerProfile of profiles) {
      const rawTm = normalizeWhitespace(variants[speakerProfile]?.tm_romanized ?? '');
      const split = splitVariants(rawTm);
      const canonical = split[0] ?? '';
      const alternates = split.slice(1);

      const q = inferSentenceQuality(sourceEnglish, canonical, alternates.length > 0 || rawTm.includes('/'));
      const quality = q.quality;
      const sourceId = `${sentenceId}::${speakerProfile}`;
      const normalizedProfile = KNOWN_PROFILES.has(speakerProfile) ? speakerProfile : `other:${speakerProfile}`;

      const row: ExplodedSentenceRow = {
        source_id: sourceId,
        sentence_id: sentenceId,
        source_english: sourceEnglish,
        speaker_profile: normalizedProfile,
        sentence_family: sentenceFamily,
        target_tm_romanized: canonical,
        alternate_tm_romanized: alternates,
        quality,
        quality_score: QUALITY_SCORE[quality],
        ...(q.reason ? { quarantine_reason: q.reason } : {}),
      };

      explodedRows.push(row);

      if (quality === 'quarantine') {
        quarantineRows.push(row);
        continue;
      }

      trainingRows.push({
        source_english: row.source_english,
        speaker_profile: row.speaker_profile,
        sentence_family: row.sentence_family,
        target_tm_romanized: row.target_tm_romanized,
        quality_score: row.quality_score,
        source_id: row.source_id,
      });
    }
  }

  return { explodedRows, quarantineRows, missingRows, trainingRows };
}

function buildRetrievalCorpus(trainingRows: TrainingRow[]): Array<TrainingRow & { normalized_source: string }> {
  return trainingRows.map((row) => ({
    ...row,
    normalized_source: normalizeEnglish(row.source_english),
  }));
}

function main(): void {
  ensureOutDir();

  const rawDictionary = readJson<RawDictionary>(DICTIONARY_PATH);
  const rawSentences = readJson<RawSentence[]>(SENTENCES_PATH);

  const lexicon = cleanLexicon(rawDictionary);
  const sentenceData = cleanSentences(rawSentences);
  const retrievalCorpus = buildRetrievalCorpus(sentenceData.trainingRows);

  writeJson(path.join(OUT_DIR, 'cleaned_lexicon.json'), lexicon.cleanRows);
  writeJson(path.join(OUT_DIR, 'cleaned_lexicon_quarantine.json'), lexicon.quarantineRows);

  writeJson(path.join(OUT_DIR, 'sentences_expanded_all.json'), sentenceData.explodedRows);
  writeJson(path.join(OUT_DIR, 'sentences_quarantine.json'), sentenceData.quarantineRows);
  writeJson(path.join(OUT_DIR, 'sentences_missing_for_training.json'), sentenceData.missingRows);

  writeJson(path.join(OUT_DIR, 'training_rows.json'), sentenceData.trainingRows);
  writeJsonl(path.join(OUT_DIR, 'training_rows.jsonl'), sentenceData.trainingRows);

  writeJson(path.join(OUT_DIR, 'retrieval_corpus.json'), retrievalCorpus);

  const feedbackGoldPath = path.join(OUT_DIR, 'feedback_gold.jsonl');
  if (!fs.existsSync(feedbackGoldPath)) {
    fs.writeFileSync(feedbackGoldPath, '', 'utf-8');
  }

  writeJson(path.join(OUT_DIR, 'prep_summary.json'), {
    generated_at: new Date().toISOString(),
    lexicon_rows: lexicon.cleanRows.length,
    lexicon_quarantine_rows: lexicon.quarantineRows.length,
    sentence_rows_all: sentenceData.explodedRows.length,
    sentence_rows_quarantine: sentenceData.quarantineRows.length,
    sentence_rows_missing: sentenceData.missingRows.length,
    training_rows: sentenceData.trainingRows.length,
  });

  console.log('Data prep complete.');
  console.log(`- cleaned lexicon rows: ${lexicon.cleanRows.length}`);
  console.log(`- lexicon quarantine rows: ${lexicon.quarantineRows.length}`);
  console.log(`- exploded sentence rows: ${sentenceData.explodedRows.length}`);
  console.log(`- sentence quarantine rows: ${sentenceData.quarantineRows.length}`);
  console.log(`- missing sentence rows: ${sentenceData.missingRows.length}`);
  console.log(`- training rows: ${sentenceData.trainingRows.length}`);
}

main();