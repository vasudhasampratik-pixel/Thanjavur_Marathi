import { useState, useCallback } from 'react';
import type { DictionaryEntry } from '../types';
import { useTranslate } from '../hooks/useTranslate';
import { SingleTranslationResult, PhraseTranslationResult } from './TranslationResult';

interface TranslatorBoxProps {
  entries: DictionaryEntry[];
}

export function TranslatorBox({ entries }: TranslatorBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');

  const { singleResults, phraseResults, composed, isPhrase, hasResults } = useTranslate(query, entries);

  const handleSearch = useCallback(() => {
    setQuery(inputValue);
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const displayValue = inputValue;

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
          <button onClick={handleSearch} className="btn-primary w-full sm:w-auto">
            Translate
          </button>
        </div>

      </div>

      {/* Results */}
      {query && (
        <>
          {isPhrase ? (
            <PhraseTranslationResult phraseResults={phraseResults} composed={composed} />
          ) : (
            <SingleTranslationResult results={singleResults} query={query} />
          )}
        </>
      )}

      {!query && (
        <div className="text-center text-gray-900 text-sm pt-4">
          <p>Please note: The app is in a nascent stage. The sentence and phrase formation has to be perfected. For this, community contribution is required. </p>
          <p>Please head over to the first tab 'Contribute' for your support.</p>
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
