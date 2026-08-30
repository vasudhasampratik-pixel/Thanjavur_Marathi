import type { DictionaryEntry, SearchResult } from '../types';

interface SearchOptions {
  allowFuzzy?: boolean;
  minScore?: number;
  contextTokens?: string[];
}

const QUALIFIER_CONTEXT_MAP: Record<string, { positive: string[]; negative: string[] }> = {
  sickness: {
    positive: ['fever', 'cough', 'medicine', 'doctor', 'ill', 'sick', 'body'],
    negative: ['water', 'weather', 'winter', 'ice', 'cool', 'cold', 'heat', 'hot', 'drink'],
  },
  temperature: {
    positive: ['water', 'weather', 'winter', 'ice', 'cool', 'heat', 'hot', 'drink'],
    negative: ['fever', 'cough', 'medicine', 'doctor', 'ill', 'sick', 'body'],
  },
};

function toTokenSet(value: string): Set<string> {
  return new Set(value.split(/\s+/).filter(Boolean));
}

function getQualifierTokens(english: string): string[] {
  const qualifiers = Array.from(english.matchAll(/\(([^)]+)\)/g))
    .flatMap(match => (match[1] ?? '').split(/[\/,&]/g))
    .map(token => normalise(token))
    .filter(Boolean);

  return qualifiers;
}

function getQualifierContextBoost(english: string, contextTokens: string[]): number {
  if (contextTokens.length === 0) return 0;

  const contextSet = new Set(contextTokens.map(normalise).filter(Boolean));
  const qualifiers = getQualifierTokens(english);

  if (qualifiers.length === 0) return 0;

  let boost = 0;
  for (const qualifier of qualifiers) {
    const profile = QUALIFIER_CONTEXT_MAP[qualifier];
    if (!profile) continue;

    const positiveHits = profile.positive.reduce((count, token) =>
      count + (contextSet.has(token) ? 1 : 0), 0);
    const negativeHits = profile.negative.reduce((count, token) =>
      count + (contextSet.has(token) ? 1 : 0), 0);

    boost += positiveHits * 12;
    boost -= negativeHits * 8;
  }

  return Math.max(-25, Math.min(25, boost));
}

function getContextBoost(
  entry: DictionaryEntry,
  query: string,
  contextTokens: string[]
): number {
  if (contextTokens.length === 0) return 0;

  const englishNorm = normalise(entry.english);
  const variants = entry.english_variants.map(normalise).filter(Boolean);
  const contexts = Array.from(new Set(contextTokens.map(normalise).filter(Boolean)));
  const candidatePhrases = [englishNorm, ...variants].filter(Boolean);
  let bestBoost = 0;

  for (const phrase of candidatePhrases) {
    const phraseTokens = toTokenSet(phrase);
    let overlapCount = 0;

    for (const context of contexts) {
      if (phraseTokens.has(context)) {
        overlapCount += 1;
      }
    }

    if (overlapCount === 0) continue;

    const containsQuery = phraseTokens.has(query);
    const boost = containsQuery
      ? Math.min(30, 15 + overlapCount * 5)
      : Math.min(12, overlapCount * 6);

    if (boost > bestBoost) {
      bestBoost = boost;
    }
  }

  const qualifierBoost = getQualifierContextBoost(entry.english, contextTokens);
  return bestBoost + qualifierBoost;
}

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/** Normalise a string for comparison */
export function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

/** Generate possible plural forms of a word */
function getPluralForms(word: string): string[] {
  const plurals: string[] = [];
  const lower = word.toLowerCase();

  // Don't pluralize if already ends with s (likely plural)
  if (lower.endsWith('s')) return plurals;

  // Basic rules
  if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
    // city -> cities
    plurals.push(word.slice(0, -1) + 'ies');
  } else if (lower.endsWith('f') || lower.endsWith('fe')) {
    // leaf -> leaves, knife -> knives
    const base = lower.endsWith('fe') ? word.slice(0, -2) : word.slice(0, -1);
    plurals.push(base + 'ves');
  } else if (lower.endsWith('ch') || lower.endsWith('sh') || lower.endsWith('x') || lower.endsWith('z') || lower.endsWith('s')) {
    // box -> boxes
    plurals.push(word + 'es');
  } else if (lower.endsWith('o') && !/[aeiou]o$/.test(lower)) {
    // tomato -> tomatoes, but not radio -> radios
    plurals.push(word + 'es');
  } else {
    // Most words just add 's'
    plurals.push(word + 's');
  }

  // Common irregular plurals
  const irregulars: Record<string, string> = {
    'child': 'children',
    'man': 'men',
    'woman': 'women',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'person': 'people',
    'ox': 'oxen',
    'leaf': 'leaves',
    'life': 'lives',
    'knife': 'knives',
    'wife': 'wives',
    'wolf': 'wolves',
    'calf': 'calves',
    'half': 'halves',
    'loaf': 'loaves',
    'elf': 'elves',
    'shelf': 'shelves',
    'thief': 'thieves',
    'sheaf': 'sheaves',
  };

  if (irregulars[lower]) {
    plurals.push(irregulars[lower]);
  }

  return plurals;
}

/** Generate possible singular forms of a word */
function getSingularForms(word: string): string[] {
  const singulars: string[] = [];
  const lower = word.toLowerCase();

  // Don't singularize if doesn't end with s (likely singular)
  if (!lower.endsWith('s')) return singulars;

  // Reverse basic rules
  if (lower.endsWith('ies')) {
    // cities -> city
    singulars.push(word.slice(0, -3) + 'y');
  } else if (lower.endsWith('ves')) {
    // leaves -> leaf
    const base = word.slice(0, -3);
    if (base.endsWith('f')) {
      singulars.push(base); // leaf
    } else {
      singulars.push(base + 'f'); // knife -> knif (but we'll handle specially)
    }
  } else if (lower.endsWith('es')) {
    // boxes -> box
    singulars.push(word.slice(0, -2));
  } else if (lower.endsWith('s')) {
    // dogs -> dog
    singulars.push(word.slice(0, -1));
  }

  // Common irregular singulars
  const irregulars: Record<string, string> = {
    'children': 'child',
    'men': 'man',
    'women': 'woman',
    'teeth': 'tooth',
    'feet': 'foot',
    'mice': 'mouse',
    'geese': 'goose',
    'people': 'person',
    'oxen': 'ox',
    'leaves': 'leaf',
    'lives': 'life',
    'knives': 'knife',
    'wives': 'wife',
    'wolves': 'wolf',
    'calves': 'calf',
    'halves': 'half',
    'loaves': 'loaf',
    'elves': 'elf',
    'shelves': 'shelf',
    'thieves': 'thief',
    'sheaves': 'sheaf',
  };

  if (irregulars[lower]) {
    singulars.push(irregulars[lower]);
  }

  return singulars;
}

/**
 * Search for a single token in the dictionary.
 * Returns up to `limit` results ranked by match quality.
 */
export function searchToken(
  token: string,
  entries: DictionaryEntry[],
  limit = 5,
  options?: SearchOptions
): SearchResult[] {
  const query = normalise(token);
  if (!query) return [];

  const allowFuzzy = options?.allowFuzzy ?? true;
  const minScore = options?.minScore ?? 0;
  const contextTokens = options?.contextTokens ?? [];

  const results: SearchResult[] = [];

  for (const entry of entries) {
    const englishNorm = normalise(entry.english);
    const variants = entry.english_variants.map(normalise);
    const contextBoost = getContextBoost(entry, query, contextTokens);

    // Exact match
    if (englishNorm === query) {
      results.push({ entry, score: 100 + contextBoost, matchType: 'exact' });
      continue;
    }

    // Variant exact match
    if (variants.includes(query)) {
      results.push({ entry, score: 95 + contextBoost, matchType: 'variant' });
      continue;
    }

    // Plural/singular form match
    const pluralForms = getPluralForms(entry.english);
    const singularForms = getSingularForms(entry.english);
    const allForms = [...pluralForms, ...singularForms].map(normalise);

    if (allForms.includes(query)) {
      results.push({ entry, score: 90 + contextBoost, matchType: 'plural' });
      continue;
    }

    // Also check variants for plural forms
    for (const variant of entry.english_variants) {
      const variantPlurals = getPluralForms(variant);
      const variantSingulars = getSingularForms(variant);
      const variantForms = [...variantPlurals, ...variantSingulars].map(normalise);

      if (variantForms.includes(query)) {
        results.push({ entry, score: 85 + contextBoost, matchType: 'plural_variant' });
        break; // Only add once per entry
      }
    }

    // Partial containment (e.g. query is "bitter" and entry.english is "bittergourd").
    // Avoid short-token false positives like "am" matching "amla".
    if (query.length >= 3 && (englishNorm.startsWith(query) || query.startsWith(englishNorm))) {
      results.push({ entry, score: 80 + Math.min(8, contextBoost), matchType: 'partial' });
      continue;
    }

    // Fuzzy match
    if (allowFuzzy) {
      const dist = levenshtein(query, englishNorm);
      const maxAllowed = query.length <= 4 ? 1 : query.length <= 7 ? 2 : 3;
      if (dist <= maxAllowed) {
        const score = Math.max(0, 70 - dist * 15) + Math.min(6, contextBoost);
        results.push({ entry, score, matchType: 'fuzzy' });
        continue;
      }
    }
  }

  return results
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Tokenise a phrase into individual words */
export function tokenise(phrase: string): string[] {
  return phrase
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function findBestNgram(
  tokens: string[],
  startIndex: number,
  entries: DictionaryEntry[],
  maxWindow = 4
): { text: string; results: SearchResult[]; length: number } | null {
  const remaining = tokens.length - startIndex;
  const windowLimit = Math.min(maxWindow, remaining);

  for (let size = windowLimit; size >= 1; size--) {
    const text = tokens.slice(startIndex, startIndex + size).join(' ');
    const rawResults = searchToken(text, entries, 3, {
      allowFuzzy: size === 1,
      minScore: size > 1 ? 95 : 0,
    });

    const results = size > 1
      ? rawResults.filter(result => result.matchType === 'exact' || result.matchType === 'variant')
      : rawResults;

    if (results.length > 0) {
      return { text, results, length: size };
    }
  }

  return null;
}