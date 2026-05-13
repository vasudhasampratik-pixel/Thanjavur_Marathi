export type EntryType = 'word' | 'phrase' | 'idiom' | 'proverb';

export type Category =
  | 'food'
  | 'emotions'
  | 'body'
  | 'nature'
  | 'professions'
  | 'relations'
  | 'colours'
  | 'numbers'
  | 'time'
  | 'household'
  | 'idioms'
  | 'proverbs'
  | 'ceremonies'
  | 'misc';

export interface DictionaryEntry {
  id: string;
  english: string;
  english_variants: string[];
  tm_romanized: string;
  tm_devanagari: string;
  category: Category;
  type: EntryType;
  notes: string;
  source_url: string;
}

export interface Dictionary {
  meta: {
    version: string;
    totalEntries: number;
    lastUpdated: string;
    source: string;
  };
  entries: DictionaryEntry[];
}

export interface SearchResult {
  entry: DictionaryEntry;
  score: number;
  matchType: 'exact' | 'variant' | 'fuzzy' | 'partial';
}

export interface PhraseTranslation {
  token: string;
  results: SearchResult[];
  matched: boolean;
  confidence: number;
}

export interface ComposedSegment {
  source: string;
  romanized: string;
  devanagari: string;
  matched: boolean;
  confidence: number;
}

export interface ComposedTranslation {
  romanized: string;
  devanagari: string;
  confidence: number;
  unmatchedCount: number;
  segments: ComposedSegment[];
}
