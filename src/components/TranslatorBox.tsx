import { useState, useCallback } from 'react';
import type { DictionaryEntry } from '../types';
import { useTranslate } from '../hooks/useTranslate';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { VoiceInputButton } from './VoiceInputButton';
import { SingleTranslationResult, PhraseTranslationResult } from './TranslationResult';
import { FeedbackPanel } from './FeedbackPanel';

interface TranslatorBoxProps {
  entries: DictionaryEntry[];
  totalEntries: number;
}

export function TranslatorBox({ entries, totalEntries }: TranslatorBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');

  const { singleResults, phraseResults, composed, isPhrase, hasResults } = useTranslate(query, entries);

  const handleSearch = useCallback(() => {
    setQuery(inputValue);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleVoiceResult = useCallback((transcript: string) => {
    setInputValue(transcript);
    setQuery(transcript);
  }, []);

  const { isListening, isSupported, interimTranscript, startListening, stopListening } =
    useSpeechInput({ onResult: handleVoiceResult });

  const displayValue = isListening && interimTranscript ? interimTranscript : inputValue;
  const bestSingle = singleResults[0];
  const modelOutput = isPhrase
    ? (composed?.romanized ?? '')
    : (bestSingle?.entry.tm_romanized ?? '');
  const sourceId = isPhrase
    ? `composed::${query.trim().toLowerCase().replace(/\s+/g, '_')}`
    : (bestSingle?.entry.id ?? `lookup::${query.trim().toLowerCase().replace(/\s+/g, '_')}`);

  const handleClear = () => {
    setInputValue('');
    setQuery('');
  };

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
              className="input-field pr-10"
              autoComplete="off"
              spellCheck="false"
            />
            {displayValue && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-900"
                aria-label="Clear input"
              >
                ✕
              </button>
            )}
          </div>
          <VoiceInputButton
            isListening={isListening}
            isSupported={isSupported}
            onStart={startListening}
            onStop={stopListening}
          />
          <button onClick={handleSearch} className="btn-primary w-full sm:w-auto">
            Translate
          </button>
        </div>

        {isListening && (
          <p className="mt-2 text-sm text-red-500 animate-pulse">
            🎙 Listening… speak now
          </p>
        )}

        {!isSupported && (
          <p className="mt-2 text-xs text-gray-900">
            Voice input not supported in this browser. Try Chrome or Edge.
          </p>
        )}
      </div>

      {/* Results */}
      {query && (
        <>
          {isPhrase ? (
            <PhraseTranslationResult phraseResults={phraseResults} composed={composed} />
          ) : (
            <SingleTranslationResult results={singleResults} query={query} />
          )}

          {modelOutput && (
            <FeedbackPanel
              sourceEnglish={query}
              modelOutput={modelOutput}
              sourceId={sourceId}
            />
          )}
        </>
      )}

      {!query && (
        <div className="text-center text-gray-900 text-sm pt-4">
          <p>Database contains <span className="font-semibold text-peacock-600">{totalEntries}</span> Thanjavur Marathi words &amp; phrases</p>
          <p className="mt-1">Try: &ldquo;fruit&rdquo;, &ldquo;bland&rdquo;, &ldquo;earrings&rdquo;, &ldquo;dirty&rdquo;, &ldquo;teacher&rdquo;</p>
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
