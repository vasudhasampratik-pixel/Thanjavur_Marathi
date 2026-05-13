export type SentenceFamily =
  | 'fixed_formula'
  | 'identity'
  | 'description'
  | 'location'
  | 'experiencer'
  | 'imperative'
  | 'yes_no_question'
  | 'wh_question'
  | 'progressive'
  | 'past'
  | 'future';

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

function normalizeEnglish(value: string): string {
  return value
    .toLowerCase()
    .replace(/[!?.,;:()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferSentenceFamily(sourceEnglishRaw: string): SentenceFamily {
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
