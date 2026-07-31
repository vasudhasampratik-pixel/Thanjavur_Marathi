import { useState, useCallback, useEffect } from 'react';
import type { DictionaryEntry } from '../types';
import { useTranslate } from '../hooks/useTranslate';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { useTranslationOrchestrator } from '../hooks/useTranslationOrchestrator';
import type { TranslationOutcome } from '../utils/crowdsourcedLookup';
import { SingleTranslationResult, PhraseTranslationResult } from './TranslationResult';
import { VoiceInputButton } from './VoiceInputButton';
import { trackTranslationEvent } from '../utils/analytics';

interface TranslatorBoxProps {
  entries: DictionaryEntry[];
}

export function TranslatorBox({ entries }: TranslatorBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<TranslationOutcome | null>(null);

  const { singleResults, phraseResults, composed, isPhrase, hasResults } = useTranslate(query, entries);
  const { state: orchestratorState, translate, reset } = useTranslationOrchestrator();

  const handleSpeechResult = useCallback((transcript: string) => {
    const nextValue = transcript.trim();
    if (!nextValue) return;
    setInputValue(nextValue);
    setQuery(nextValue);
  }, []);

  const { isListening, isSupported, startListening, stopListening } = useSpeechInput({
    lang: 'en-US',
    onResult: handleSpeechResult,
  });

  const handleSearch = useCallback(async () => {
    const nextQuery = inputValue.trim();
    if (!nextQuery) {
      setQuery('');
      setOutcome(null);
      return;
    }

    setQuery(nextQuery);
    trackTranslationEvent('translation_started', { inputType: 'text' });

    try {
      const nextOutcome = await translate(nextQuery);
      setOutcome(nextOutcome);
      trackTranslationEvent('translation_completed', {
        inputType: 'text',
        matchType: nextOutcome.matchType,
        hasRomanisedOutput: Boolean(nextOutcome.romanisedText),
        hasDevanagariOutput: Boolean(nextOutcome.devanagariText),
        latencyMs: nextOutcome.latencyMs,
      });
    } catch (error) {
      console.error('Translation orchestration failed', error);
      trackTranslationEvent('translation_error', { inputType: 'text', errorCategory: 'orchestrator' });
      setOutcome({
        originalInput: nextQuery,
        romanisedText: '',
        devanagariText: '',
        matchType: 'no-result',
        verified: false,
        latencyMs: 0,
        dataQualityWarnings: ['translation-error'],
      });
    }
  }, [inputValue, translate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const displayValue = inputValue;

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    setOutcome(null);
    reset();
  };

  useEffect(() => {
    if (orchestratorState.loadStatus === 'ready') {
      trackTranslationEvent('translation_corpus_loaded', { corpusLoadStatus: 'ready' });
    }

    if (orchestratorState.loadStatus === 'error') {
      trackTranslationEvent('translation_error', { errorCategory: 'corpus-load', corpusLoadStatus: 'error' });
    }
  }, [orchestratorState.loadStatus]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16 space-y-6">
      {/* Search bar */}
      <div className="card p-4">
        <label htmlFor="translator-input" className="block text-sm font-medium text-gray-900 mb-2">
          Type an English word, phrase, or sentence
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:flex-1">
            <input
              id="translator-input"
              type="text"
              value={displayValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. fruit, bland, earrings, dirty, teacher"
              className="input-field pr-24"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {displayValue && (
                <button
                  onClick={handleClear}
                  className="text-gray-900 hover:text-gray-900"
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
              <VoiceInputButton
                isListening={isListening}
                isSupported={isSupported}
                onStart={startListening}
                onStop={stopListening}
              />
            </div>
          </div>
          <button onClick={handleSearch} className="btn-primary w-full sm:w-auto">
            Translate
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {isListening
            ? 'Listening for a simple English word…'
            : isSupported
              ? 'Tap the mic and say a simple English word.'
              : 'Voice input is not supported in this browser.'}
        </p>

      </div>

      {query && (
        <div className="space-y-4">
          {outcome?.matchType === 'verified-community' ? (
            <>
              <div className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">Verified community translation</p>
                  <span className="rounded-full border border-peacock-200 bg-peacock-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-peacock-700">
                    {orchestratorState.loadStatus === 'ready' ? 'Corpus ready' : 'Loading corpus'}
                  </span>
                </div>
                <div className="mt-3 space-y-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
                  <p className="devanagari text-5xl font-bold text-saffron-600 leading-tight">{outcome.devanagariText || '—'}</p>
                  <p className="text-xl font-semibold text-peacock-800">{outcome.romanisedText || '—'}</p>
                </div>
              </div>

              {/* Feedback controls commented out for now.
              {outcome && !hasSubmittedFeedback && (
                <TranslationFeedback
                  outcome={outcome}
                  inputType="text"
                  onSubmitted={() => setHasSubmittedFeedback(true)}
                />
              )}
              */}
            </>
          ) : (
            <>
              {isPhrase ? (
                <PhraseTranslationResult phraseResults={phraseResults} composed={composed} />
              ) : (
                <SingleTranslationResult results={singleResults} query={query} />
              )}

              {/* Feedback controls commented out for now.
              {outcome && !hasSubmittedFeedback && (
                <TranslationFeedback
                  outcome={outcome}
                  inputType="text"
                  onSubmitted={() => setHasSubmittedFeedback(true)}
                />
              )}
              */}
            </>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center text-gray-900 text-sm pt-4">
          <p>The app is still in early stage and needs help improving sentence/phrase formation. Community support is needed to help train it. Please head to the first tab, <b>Contribute</b>, to help</p>
        </div>
      )}

      {query && !hasResults && isPhrase && (
        <div className="text-center text-gray-900 text-sm pt-2">
          <p>Results not found. Try a different phrase or spelling.</p>
        </div>
      )}
    </div>
  );
}
