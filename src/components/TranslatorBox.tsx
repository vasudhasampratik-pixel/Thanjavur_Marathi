import { useState, useCallback, useEffect, useRef } from 'react';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { useTranslationOrchestrator } from '../hooks/useTranslationOrchestrator';
import type { TranslationOutcome } from '../utils/crowdsourcedLookup';
import { VoiceInputButton } from './VoiceInputButton';
import { trackTranslationEvent } from '../utils/analytics';

function CorpusAudioButton({ audioUrl }: { audioUrl?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!audioUrl) {
    return null;
  }

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        return;
      }

      await audio.play();
    } catch {
      setHasError(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause pronunciation' : 'Listen'}
        title="Listen"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-peacock-200 bg-peacock-50 text-peacock-700 transition hover:bg-peacock-100"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {isPlaying ? (
            <path d="M7 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm10 0a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z" />
          ) : (
            <path d="M8.5 6.5a1 1 0 0 1 1.53-.848l7 4.5a1 1 0 0 1 0 1.696l-7 4.5A1 1 0 0 1 8.5 15.5v-9Z" />
          )}
        </svg>
      </button>
      {hasError && <span className="text-[11px] text-red-500">Audio unavailable</span>}
    </div>
  );
}

export function TranslatorBox() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<TranslationOutcome | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

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
    if (isTranslating) return;
    const nextQuery = inputValue.trim();
    if (!nextQuery) {
      setQuery('');
      setOutcome(null);
      return;
    }

    setQuery(nextQuery);
    setTranslationError(null);
    trackTranslationEvent('translation_started', { inputType: 'text' });
    setIsTranslating(true);

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
      setTranslationError(error instanceof Error ? error.message : 'Translation failed. Please try again.');
      setOutcome({
        originalInput: nextQuery,
        romanisedText: '',
        devanagariText: '',
        matchType: 'no-result',
        verified: false,
        latencyMs: 0,
        dataQualityWarnings: ['translation-error'],
      });
    } finally {
      setIsTranslating(false);
    }
  }, [inputValue, isTranslating, translate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const displayValue = inputValue;

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    setOutcome(null);
    setTranslationError(null);
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
          Type an English word or phrase
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:flex-1">
            <input
              id="translator-input"
              type="text"
              value={displayValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. teacher, the fruit is sweet"
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
          <button onClick={handleSearch} disabled={isTranslating} className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-60">
            {isTranslating ? 'Translating…' : 'Translate'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {isListening
            ? 'Listening for a simple English word…'
            : isSupported
              ? 'Tap the mic and say a simple English word or phrase.'
              : 'Voice input is not supported in this browser.'}
        </p>

      </div>

      {query && isTranslating && (
        <div className="card p-6 text-center text-sm text-gray-700">Translating with the base IndicTrans2 model…</div>
      )}

      {query && !isTranslating && (
        <div className="space-y-4">
          {translationError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{translationError}</div>
          )}
          {outcome?.matchType === 'verified-community' ? (
            <>
              <div className="rounded-2xl border border-orange-100 bg-white/95 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">Verified community translation</p>
                </div>
                <div className="mt-3 space-y-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="devanagari text-5xl font-bold text-saffron-600 leading-tight">{outcome.devanagariText || '—'}</p>
                      <p className="text-xl font-semibold text-peacock-800">{outcome.romanisedText || '—'}</p>
                    </div>
                    <div className="pt-1">
                      <CorpusAudioButton audioUrl={outcome.audioUrl} />
                    </div>
                  </div>
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
          ) : outcome?.matchType === 'backend-ai' ? (
            <div className="card border-saffron-200">
              <p className="text-xs uppercase tracking-wide text-gray-700 font-semibold">AI translation</p>
              <p className="devanagari mt-3 text-5xl font-bold text-saffron-600 leading-tight">{outcome.devanagariText || '—'}</p>
              <p className="mt-3 text-xs text-gray-600">Model {outcome.modelVersion || 'base-v1'}</p>
              {outcome.quota && (
                <p className="mt-1 text-xs text-gray-600">{outcome.quota.remaining} translations remaining today</p>
              )}
            </div>
          ) : translationError ? null : (
            <div className="card p-6 text-center text-sm text-gray-700">No translation was returned.</div>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center text-gray-900 text-sm pt-4">
          <p>The app is still in early stage and needs help improving sentence/phrase formation. Community support is needed to help train it. Please head to the first tab, <b>Contribute</b>, to help</p>
        </div>
      )}

    </div>
  );
}
