import { useMemo } from 'react';
import type {
  ComposedTranslation,
  DictionaryEntry,
  PhraseTranslation,
  SearchResult,
} from '../types';
import { findBestNgram, searchToken, tokenise, normalise } from '../utils/search';
import { applySentenceRules } from '../utils/sentenceRules';

interface UseTranslateResult {
  /** Results when input is a single word */
  singleResults: SearchResult[];
  /** Results when input is a multi-word phrase */
  phraseResults: PhraseTranslation[];
  composed: ComposedTranslation | null;
  isPhrase: boolean;
  hasResults: boolean;
}

export function useTranslate(
  query: string,
  entries: DictionaryEntry[]
): UseTranslateResult {
  return useMemo(() => {
    const appendPostposition = (base: string, postposition?: string): string => {
      if (!postposition) return base;
      return postposition.startsWith('-') ? `${base}${postposition}` : `${base} ${postposition}`;
    };

    const q = query.trim();
    if (!q) {
      return {
        singleResults: [],
        phraseResults: [],
        composed: null,
        isPhrase: false,
        hasResults: false,
      };
    }

    const tokens = tokenise(q);
    const isPhrase = tokens.length > 1;

    // Parse grammar structure early so structural rules (existence, location,
    // postpositions, etc.) can take precedence over full-phrase dictionary hits.
    const ruleResult = isPhrase ? applySentenceRules(q) : null;

    // ── Single-word lookup ────────────────────────────────────────────────────
    if (!isPhrase) {
      const normalized = normalise(q);
      if (normalized === 'the' || normalized === 'am' || normalized === 'a') {
        return { singleResults: [], phraseResults: [], composed: null, isPhrase: false, hasResults: false };
      }
      const singleResults = searchToken(normalized, entries);
      return {
        singleResults,
        phraseResults: [],
        composed: null,
        isPhrase: false,
        hasResults: singleResults.length > 0,
      };
    }

    // ── Grammar rules engine ──────────────────────────────────────────────────
    // Returns tokens pre-ordered in Tanjore Marathi word order, plus any
    // grammatical suffix particles (aahe, ka, nahi, nako, …).
    if (!ruleResult) {
      return {
        singleResults: [],
        phraseResults: [],
        composed: null,
        isPhrase: true,
        hasResults: false,
      };
    }

    // For structurally transformed sentences, honor grammar rules first.
    // Only use a full-phrase dictionary shortcut for plain/default phrases.
    if (ruleResult.sentenceType === 'default') {
      const fullPhraseMatch = searchToken(normalise(q), entries, 1, {
        allowFuzzy: false,
        minScore: 95,
      }).find(r => r.matchType === 'exact' || r.matchType === 'variant');

      if (fullPhraseMatch) {
        const composed: ComposedTranslation = {
          romanized: fullPhraseMatch.entry.tm_romanized?.trim() ?? '',
          devanagari: fullPhraseMatch.entry.tm_devanagari?.trim() ?? '',
          confidence: fullPhraseMatch.score,
          unmatchedCount: 0,
          segments: [{
            source: q,
            romanized: fullPhraseMatch.entry.tm_romanized?.trim() ?? '',
            devanagari: fullPhraseMatch.entry.tm_devanagari?.trim() ?? '',
            matched: true,
            confidence: fullPhraseMatch.score,
          }],
        };
        return { singleResults: [], phraseResults: [], composed, isPhrase: true, hasResults: true };
      }
    }

    // Fixed phrase template (e.g. "how are you", "nice to meet you")
    if (ruleResult.fixedPhrase) {
      const fp = ruleResult.fixedPhrase;
      const composed: ComposedTranslation = {
        romanized: fp.romanized,
        devanagari: fp.devanagari,
        confidence: 100,
        unmatchedCount: 0,
        segments: [{
          source: q,
          romanized: fp.romanized,
          devanagari: fp.devanagari,
          matched: true,
          confidence: 100,
        }],
      };
      return { singleResults: [], phraseResults: [], composed, isPhrase: true, hasResults: true };
    }

    // ── Token-by-token lookup over rules-reordered token list ─────────────────
    const phraseResults: PhraseTranslation[] = [];
    const romanizedSegments: string[] = [];
    const devanagariSegments: string[] = [];
    let unmatchedCount = 0;
    let confidenceWeightedTotal = 0;
    let confidenceWeight = 0;

    // Build context token list for disambiguation (all source words, normalised)
    const contextAll = ruleResult.tokens
      .map(pt => normalise(pt.source))
      .filter(Boolean);

    for (let i = 0; i < ruleResult.tokens.length; i++) {
      const pt = ruleResult.tokens[i];
      const tokenNorm = normalise(pt.source);
      if (!tokenNorm) continue;

      // ── Override: fixed translation supplied by the rules engine ─────────────
      if (pt.override) {
        const { romanized, devanagari } = pt.override;
        phraseResults.push({
          token: pt.source,
          results: [{
            entry: {
              id: `rule_override_${i}`,
              english: pt.source,
              english_variants: [],
              tm_romanized: romanized,
              tm_devanagari: devanagari,
              category: 'misc',
              type: 'word',
              notes: '',
              source_url: '',
            },
            score: 100,
            matchType: 'exact',
          }],
          matched: true,
          confidence: 100,
        });
        romanizedSegments.push(appendPostposition(romanized, pt.postposition));
        devanagariSegments.push(appendPostposition(devanagari, pt.postpositionDev));
        confidenceWeightedTotal += 100;
        confidenceWeight += 1;
        continue;
      }

      let ngramLength = 1;
      let ngramResults: SearchResult[] | null = null;

      for (let size = Math.min(4, ruleResult.tokens.length - i); size >= 2; size--) {
        const candidateTokens = ruleResult.tokens.slice(i, i + size);
        if (candidateTokens.some(token => token.override)) continue;

        const ngramMatch = findBestNgram(
          candidateTokens.map(token => token.source),
          0,
          entries,
          size
        );

        if (ngramMatch && ngramMatch.length === size) {
          ngramLength = size;
          ngramResults = ngramMatch.results;
          break;
        }
      }

      if (ngramResults) {
        const combinedSource = ruleResult.tokens
          .slice(i, i + ngramLength)
          .map(token => token.source)
          .join(' ');
        const top = ngramResults[0];
        const conf = Math.max(0, Math.min(100, Math.round(top.score ?? 0)));

        phraseResults.push({
          token: combinedSource,
          results: ngramResults,
          matched: true,
          confidence: conf,
        });

        const rm = top.entry.tm_romanized?.trim() || combinedSource;
        const dv = top.entry.tm_devanagari?.trim() || combinedSource;
        romanizedSegments.push(appendPostposition(rm, pt.postposition));
        devanagariSegments.push(appendPostposition(dv, pt.postpositionDev));

        confidenceWeightedTotal += conf * ngramLength;
        confidenceWeight += ngramLength;
        i += ngramLength - 1;
        continue;
      }

      // ── Dictionary lookup ─────────────────────────────────────────────────────
      const contextTokens = contextAll.filter((_, ci) => ci !== i);
      const tokenResults = searchToken(tokenNorm, entries, 3, {
        allowFuzzy: true,
        contextTokens,
      });
      const top = tokenResults[0];

      if (!top) {
        phraseResults.push({ token: pt.source, results: [], matched: false, confidence: 0 });
        const fallback = pt.source;
        romanizedSegments.push(appendPostposition(fallback, pt.postposition));
        devanagariSegments.push(appendPostposition(fallback, pt.postpositionDev));
        unmatchedCount += 1;
        confidenceWeight += 1;
        continue;
      }

      const conf = Math.max(0, Math.min(100, Math.round(top.score ?? 0)));
      phraseResults.push({
        token: pt.source,
        results: tokenResults,
        matched: true,
        confidence: conf,
      });

      const rm = top.entry.tm_romanized?.trim() || pt.source;
      const dv = top.entry.tm_devanagari?.trim() || pt.source;
      romanizedSegments.push(appendPostposition(rm, pt.postposition));
      devanagariSegments.push(appendPostposition(dv, pt.postpositionDev));

      confidenceWeightedTotal += conf;
      confidenceWeight += 1;
    }

    // ── Append grammatical suffix particles ───────────────────────────────────
    for (const particle of ruleResult.suffix) {
      romanizedSegments.push(particle.romanized);
      devanagariSegments.push(particle.devanagari);
      phraseResults.push({
        token: particle.romanized,
        results: [{
          entry: {
            id: `rule_suffix_${particle.romanized}`,
            english: particle.romanized,
            english_variants: [],
            tm_romanized: particle.romanized,
            tm_devanagari: particle.devanagari,
            category: 'misc',
            type: 'word',
            notes: `grammar rule — ${ruleResult.sentenceType}`,
            source_url: '',
          },
          score: 100,
          matchType: 'exact',
        }],
        matched: true,
        confidence: 100,
      });
    }

    const confidence = confidenceWeight > 0
      ? Math.round(confidenceWeightedTotal / confidenceWeight)
      : 0;

    const composed: ComposedTranslation = {
      romanized: romanizedSegments.join(' ').trim(),
      devanagari: devanagariSegments.join(' ').trim(),
      confidence,
      unmatchedCount,
      segments: phraseResults.map((r, idx) => ({
        source: r.token,
        romanized: romanizedSegments[idx] ?? r.results[0]?.entry.tm_romanized?.trim() ?? r.token,
        devanagari: devanagariSegments[idx] ?? r.results[0]?.entry.tm_devanagari?.trim() ?? r.token,
        matched: r.matched,
        confidence: r.confidence,
      })),
    };

    return {
      singleResults: [],
      phraseResults,
      composed,
      isPhrase: true,
      hasResults: phraseResults.some(p => p.matched),
    };
  }, [query, entries]);
}