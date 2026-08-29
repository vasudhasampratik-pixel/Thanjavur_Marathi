export type TranslationMatchType = 'verified-community' | 'indictrans2' | 'word-based' | 'no-result';

export interface CrowdsourcedSentenceRecord {
  id: string;
  englishText: string;
  englishNormalized: string;
  romanisedText: string;
  devanagariText: string;
  audioUrl?: string;
  status: 'approved' | 'pending' | 'rejected' | 'unknown';
  warnings: string[];
  createdAt?: unknown;
  contributorId?: string;
}

export interface TranslationOutcome {
  originalInput: string;
  romanisedText: string;
  devanagariText: string;
  matchType: TranslationMatchType;
  sourceDocumentId?: string;
  verified: boolean;
  audioUrl?: string;
  latencyMs: number;
  dataQualityWarnings: string[];
}

function readString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function pickFirstString(data: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = readString(data[key]);
    if (value) return value;
  }
  return null;
}

function normalizeStatus(value: unknown, data: Record<string, unknown>): CrowdsourcedSentenceRecord['status'] {
  const normalized = readString(value)?.toLowerCase();
  if (normalized === 'approved') return 'approved';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'pending') return 'pending';

  if (data.approved === true) return 'approved';
  if (data.rejected === true) return 'rejected';
  if (data.status === 'approved') return 'approved';
  if (data.status === 'pending') return 'pending';
  if (data.status === 'rejected') return 'rejected';

  return 'unknown';
}

function parseTranslationParts(translationValue: string | null, romanisedValue: string | null, devanagariValue: string | null) {
  const romanised = romanisedValue?.trim() ?? '';
  const devanagari = devanagariValue?.trim() ?? '';

  if (translationValue) {
    const parts = translationValue
      .split('|')
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return {
        romanisedText: romanised || parts[0] || '',
        devanagariText: devanagari || parts[1] || '',
      };
    }

    if (!romanised && !devanagari) {
      return { romanisedText: translationValue.trim(), devanagariText: '' };
    }
  }

  return { romanisedText: romanised, devanagariText: devanagari };
}

export function normalizeEnglishText(input: string): string {
  if (!input) return '';

  return input
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]+$/g, '')
    .trim();
}

export function adaptCrowdsourcedRecord(docId: string, data: Record<string, unknown>): CrowdsourcedSentenceRecord | null {
  const englishText = pickFirstString(data, [
    'promptEnglish',
    'prompt_english',
    'englishText',
    'english',
    'text',
    'prompt',
  ]);

  if (!englishText) {
    return null;
  }

  const translationValue = pickFirstString(data, ['translation', 'translationText', 'translatedText']);
  const romanisedValue = pickFirstString(data, [
    'romanisedText',
    'romanizedText',
    'tm_romanized',
    'tmRomanized',
    'tmRomanised',
    'romanized',
    'romanised',
    'marathiRomanized',
    'marathiRomanised',
  ]);
  const devanagariValue = pickFirstString(data, [
    'devanagariText',
    'tm_devanagari',
    'tmDevanagari',
    'devanagari',
    'marathiText',
    'marathiDevanagari',
  ]);

  const { romanisedText, devanagariText } = parseTranslationParts(translationValue, romanisedValue, devanagariValue);
  const status = normalizeStatus(data.status, data);
  const warnings: string[] = [];

  if (!romanisedText && !devanagariText) {
    warnings.push('missing-output');
  }

  if (status === 'pending' || status === 'unknown') {
    warnings.push('pending-review');
  }

  return {
    id: docId,
    englishText,
    englishNormalized: normalizeEnglishText(englishText),
    romanisedText,
    devanagariText,
    audioUrl: pickFirstString(data, ['audioUrl', 'audio_url']) ?? undefined,
    status,
    warnings,
    createdAt: data.createdAt,
    contributorId: pickFirstString(data, ['contributorId', 'uid']) ?? undefined,
  };
}

function rankRecord(record: CrowdsourcedSentenceRecord): number {
  let score = 0;

  if (record.status === 'approved') score += 120;
  if (record.status === 'pending') score += 80;
  if (record.romanisedText && record.devanagariText) score += 10;
  if (record.romanisedText) score += 3;
  if (record.devanagariText) score += 3;
  if (record.warnings.includes('pending-review')) score -= 5;

  return score;
}

export function selectLookupCandidateRecords(records: CrowdsourcedSentenceRecord[]) {
  return records.filter(record => {
    if (!record.englishNormalized || !record.romanisedText && !record.devanagariText) {
      return false;
    }

    return record.status === 'approved' || record.status === 'pending';
  });
}

export function buildCrowdsourcedLookupIndex(records: CrowdsourcedSentenceRecord[]) {
  const index = new Map<string, CrowdsourcedSentenceRecord[]>();

  for (const record of records) {
    if (!record.englishNormalized) continue;
    const bucket = index.get(record.englishNormalized) ?? [];
    bucket.push(record);
    index.set(record.englishNormalized, bucket);
  }

  for (const [key, bucket] of index) {
    bucket.sort((left, right) => rankRecord(right) - rankRecord(left));
    index.set(key, bucket);
  }

  return index;
}

export function findExactCrowdsourcedMatch(input: string, records: CrowdsourcedSentenceRecord[]): CrowdsourcedSentenceRecord | null {
  const normalizedInput = normalizeEnglishText(input);
  if (!normalizedInput) return null;

  const candidates = selectLookupCandidateRecords(records);
  const index = buildCrowdsourcedLookupIndex(candidates);
  const bucket = index.get(normalizedInput);
  if (!bucket?.length) return null;

  return bucket[0] ?? null;
}

export function buildExactMatchOutcome(input: string, record: CrowdsourcedSentenceRecord, latencyMs: number): TranslationOutcome {
  return {
    originalInput: input,
    romanisedText: record.romanisedText,
    devanagariText: record.devanagariText,
    matchType: 'verified-community',
    sourceDocumentId: record.id,
    verified: record.status === 'approved',
    audioUrl: record.audioUrl,
    latencyMs,
    dataQualityWarnings: record.warnings,
  };
}
