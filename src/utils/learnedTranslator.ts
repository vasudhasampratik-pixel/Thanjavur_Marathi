import type { ComposedSegment, ComposedTranslation, DictionaryEntry } from '../types';
import { normalise, tokenise } from './search';

interface Candidate {
  text: string;
  weight: number;
}

interface CandidateProb {
  text: string;
  prob: number;
}

interface PhraseValue {
  romanized: string;
  devanagari: string;
}

interface LearnedModel {
  phraseMap: Map<string, PhraseValue>;
  romanizedLexicon: Map<string, CandidateProb[]>;
  devanagariLexicon: Map<string, CandidateProb[]>;
  bigramCounts: Map<string, Map<string, number>>;
  prevTokenTotals: Map<string, number>;
  vocab: Set<string>;
}

const START = '<s>';
const END = '</s>';

function tokeniseRomanized(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function pushCandidate(
  lexicon: Map<string, Candidate[]>,
  sourceToken: string,
  targetText: string,
  weight: number
): void {
  if (!sourceToken || !targetText || weight <= 0) return;
  const key = normalise(sourceToken);
  if (!key) return;

  const items = lexicon.get(key) ?? [];
  const existing = items.find(item => item.text === targetText);
  if (existing) {
    existing.weight += weight;
  } else {
    items.push({ text: targetText, weight });
  }
  lexicon.set(key, items);
}

function finalizeLexicon(raw: Map<string, Candidate[]>): Map<string, CandidateProb[]> {
  const output = new Map<string, CandidateProb[]>();

  for (const [token, candidates] of raw.entries()) {
    const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
    if (total <= 0) continue;

    const normalized = candidates
      .map(candidate => ({ text: candidate.text, prob: candidate.weight / total }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 8);

    output.set(token, normalized);
  }

  return output;
}

function addBigramSample(
  sequence: string[],
  bigramCounts: Map<string, Map<string, number>>,
  prevTokenTotals: Map<string, number>,
  vocab: Set<string>
): void {
  const seq = [START, ...sequence, END];

  for (let i = 1; i < seq.length; i++) {
    const prev = seq[i - 1];
    const next = seq[i];

    vocab.add(next);

    const row = bigramCounts.get(prev) ?? new Map<string, number>();
    row.set(next, (row.get(next) ?? 0) + 1);
    bigramCounts.set(prev, row);

    prevTokenTotals.set(prev, (prevTokenTotals.get(prev) ?? 0) + 1);
  }
}

function getBigramProb(
  prev: string,
  next: string,
  bigramCounts: Map<string, Map<string, number>>,
  prevTokenTotals: Map<string, number>,
  vocabSize: number
): number {
  const row = bigramCounts.get(prev);
  const seen = row?.get(next) ?? 0;
  const total = prevTokenTotals.get(prev) ?? 0;
  return (seen + 1) / (total + Math.max(1, vocabSize));
}

export function buildLearnedModel(entries: DictionaryEntry[]): LearnedModel {
  const phraseMap = new Map<string, PhraseValue>();
  const romanizedRawLexicon = new Map<string, Candidate[]>();
  const devanagariRawLexicon = new Map<string, Candidate[]>();
  const bigramCounts = new Map<string, Map<string, number>>();
  const prevTokenTotals = new Map<string, number>();
  const vocab = new Set<string>();

  for (const entry of entries) {
    const englishNorm = normalise(entry.english || '');
    if (!englishNorm) continue;

    const romanized = (entry.tm_romanized || '').trim();
    const devanagari = (entry.tm_devanagari || '').trim();

    if (entry.type === 'phrase' && (romanized || devanagari)) {
      phraseMap.set(englishNorm, { romanized, devanagari });
    }

    if (romanized) {
      addBigramSample(tokeniseRomanized(romanized), bigramCounts, prevTokenTotals, vocab);
    }

    const englishTokens = tokenise(englishNorm);
    const romanizedTokens = tokeniseRomanized(romanized);

    if (englishTokens.length === 1) {
      if (romanized) {
        pushCandidate(romanizedRawLexicon, englishTokens[0], romanized, 6);
      }
      if (devanagari) {
        pushCandidate(devanagariRawLexicon, englishTokens[0], devanagari, 6);
      }
    }

    if (englishTokens.length > 1 && romanizedTokens.length > 0) {
      const tokenWeight = 1 / englishTokens.length;
      for (const en of englishTokens) {
        for (const rm of romanizedTokens) {
          pushCandidate(romanizedRawLexicon, en, rm, tokenWeight);
        }
      }
    }
  }

  return {
    phraseMap,
    romanizedLexicon: finalizeLexicon(romanizedRawLexicon),
    devanagariLexicon: finalizeLexicon(devanagariRawLexicon),
    bigramCounts,
    prevTokenTotals,
    vocab,
  };
}

function pickBestCandidate(
  sourceToken: string,
  previousRomanizedToken: string,
  model: LearnedModel
): { romanized: string; devanagari: string; confidence: number; matched: boolean } {
  const token = normalise(sourceToken);
  const romanizedCandidates = model.romanizedLexicon.get(token) ?? [];
  const devanagariCandidates = model.devanagariLexicon.get(token) ?? [];

  if (romanizedCandidates.length === 0) {
    return {
      romanized: sourceToken,
      devanagari: sourceToken,
      confidence: 0,
      matched: false,
    };
  }

  const vocabSize = model.vocab.size || 1;
  let bestText = romanizedCandidates[0].text;
  let bestScore = -Infinity;
  let bestEmission = romanizedCandidates[0].prob;

  for (const candidate of romanizedCandidates.slice(0, 5)) {
    const candidateTokens = tokeniseRomanized(candidate.text);
    if (candidateTokens.length === 0) continue;

    let lmScore = Math.log(
      getBigramProb(previousRomanizedToken, candidateTokens[0], model.bigramCounts, model.prevTokenTotals, vocabSize)
    );

    for (let i = 1; i < candidateTokens.length; i++) {
      lmScore += Math.log(
        getBigramProb(candidateTokens[i - 1], candidateTokens[i], model.bigramCounts, model.prevTokenTotals, vocabSize)
      );
    }

    const emissionScore = Math.log(Math.max(candidate.prob, 1e-6));
    const score = emissionScore + 0.35 * lmScore;

    if (score > bestScore) {
      bestScore = score;
      bestText = candidate.text;
      bestEmission = candidate.prob;
    }
  }

  const bestDevanagari = devanagariCandidates[0]?.text || '';
  return {
    romanized: bestText,
    devanagari: bestDevanagari,
    confidence: Math.round(Math.max(0, Math.min(100, bestEmission * 100))),
    matched: true,
  };
}

export function translateWithLearnedModel(
  query: string,
  model: LearnedModel
): ComposedTranslation | null {
  const queryNorm = normalise(query);
  if (!queryNorm) return null;

  const exact = model.phraseMap.get(queryNorm);
  if (exact) {
    const confidence = exact.romanized ? 98 : 85;
    const segment: ComposedSegment = {
      source: query,
      romanized: exact.romanized || '',
      devanagari: exact.devanagari || '',
      matched: true,
      confidence,
    };

    return {
      romanized: exact.romanized || '',
      devanagari: exact.devanagari || '',
      confidence,
      unmatchedCount: 0,
      segments: [segment],
    };
  }

  const tokens = tokenise(queryNorm);
  if (tokens.length === 0) return null;

  const segments: ComposedSegment[] = [];
  const romanizedOut: string[] = [];
  const devanagariOut: string[] = [];

  let index = 0;
  let previousRomanizedToken = START;
  let unmatchedCount = 0;
  let confidenceSum = 0;
  let confidenceWeight = 0;

  while (index < tokens.length) {
    let matchedPhrase: { text: string; value: PhraseValue; length: number } | null = null;
    const maxWindow = Math.min(5, tokens.length - index);

    for (let size = maxWindow; size >= 2; size--) {
      const source = tokens.slice(index, index + size).join(' ');
      const value = model.phraseMap.get(source);
      if (value) {
        matchedPhrase = { text: source, value, length: size };
        break;
      }
    }

    if (matchedPhrase) {
      const source = matchedPhrase.text;
      const romanized = matchedPhrase.value.romanized || '';
      const devanagari = matchedPhrase.value.devanagari || '';

      segments.push({
        source,
        romanized,
        devanagari,
        matched: true,
        confidence: romanized ? 96 : 82,
      });

      if (romanized) {
        romanizedOut.push(romanized);
        const romTokens = tokeniseRomanized(romanized);
        previousRomanizedToken = romTokens[romTokens.length - 1] ?? previousRomanizedToken;
      }
      if (devanagari) {
        devanagariOut.push(devanagari);
      }

      confidenceSum += romanized ? 96 : 82;
      confidenceWeight += 1;
      index += matchedPhrase.length;
      continue;
    }

    const source = tokens[index];
    const best = pickBestCandidate(source, previousRomanizedToken, model);

    segments.push({
      source,
      romanized: best.matched ? best.romanized : source,
      devanagari: best.devanagari || (best.matched ? '' : source),
      matched: best.matched,
      confidence: best.confidence,
    });

    if (best.matched) {
      if (best.romanized) {
        romanizedOut.push(best.romanized);
        const rmTokens = tokeniseRomanized(best.romanized);
        previousRomanizedToken = rmTokens[rmTokens.length - 1] ?? previousRomanizedToken;
      }
      if (best.devanagari) {
        devanagariOut.push(best.devanagari);
      }
      confidenceSum += best.confidence;
    } else {
      romanizedOut.push(source);
      devanagariOut.push(source);
      unmatchedCount += 1;
      confidenceSum += 0;
    }

    confidenceWeight += 1;
    index += 1;
  }

  const confidence = confidenceWeight > 0 ? Math.round(confidenceSum / confidenceWeight) : 0;

  return {
    romanized: romanizedOut.join(' ').trim(),
    devanagari: devanagariOut.join(' ').trim(),
    confidence,
    unmatchedCount,
    segments,
  };
}
