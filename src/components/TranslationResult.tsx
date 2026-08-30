import type { SearchResult, PhraseTranslation, ComposedTranslation } from '../types';

interface SingleResultProps {
  results: SearchResult[];
  query: string;
}

interface PhraseResultProps {
  phraseResults: PhraseTranslation[];
  composed: ComposedTranslation | null;
}

export function SingleTranslationResult({ results, query }: SingleResultProps) {
  if (!query.trim()) return null;

  if (results.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-gray-900 font-medium">
          Results not found for &ldquo;<span className="text-gray-900">{query}</span>&rdquo;
        </p>
        <p className="text-sm text-gray-900 mt-1">
          Try a different spelling, or this word may not be in our database yet.
        </p>
      </div>
    );
  }

  const [best] = results;

  return (
    <div className="space-y-3">
      {/* Primary result */}
      <div className="card border-saffron-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="devanagari text-5xl font-bold text-saffron-600 leading-tight">
              {best.entry.tm_devanagari || '—'}
            </p>
            <p className="mt-2 text-xl font-semibold text-peacock-700">
              {best.entry.tm_romanized}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-peacock-100 text-peacock-800 border-peacock-200">
                confidence {Math.max(0, Math.min(100, Math.round(best.score)))}%
              </span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <MatchBadge type={best.matchType} />
          </div>
        </div>
        {best.entry.notes && (
          <p className="mt-3 text-sm text-gray-900 border-t border-gray-100 pt-3">
            {best.entry.notes}
          </p>
        )}
      </div>

    </div>
  );
}

export function PhraseTranslationResult({ phraseResults, composed }: PhraseResultProps) {
  return (
    <div className="space-y-3">
      {composed && (
        <div className="card border-saffron-200">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <p className="text-xs uppercase tracking-wide text-gray-900 font-semibold">
              Composed sentence
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-peacock-100 text-peacock-800 border-peacock-200">
                confidence {composed.confidence}%
              </span>
              {composed.unmatchedCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200">
                  {composed.unmatchedCount} unmatched
                </span>
              )}
            </div>
          </div>

          <p className="devanagari text-4xl font-bold leading-tight">
            {composed.segments.length > 0
              ? composed.segments.map((segment, index) => (
                  <span
                    key={`dev-${segment.source}-${index}`}
                    className={segment.matched ? 'text-saffron-600' : 'text-gray-900 underline decoration-dotted'}
                  >
                    {segment.devanagari || '—'}
                    {index < composed.segments.length - 1 ? ' ' : ''}
                  </span>
                ))
              : '—'}
          </p>
          <p className="mt-2 text-lg font-semibold">
            {composed.segments.length > 0
              ? composed.segments.map((segment, index) => (
                  <span
                    key={`rom-${segment.source}-${index}`}
                    className={segment.matched ? 'text-peacock-700' : 'text-gray-900 underline decoration-dotted'}
                  >
                    {segment.romanized || '—'}
                    {index < composed.segments.length - 1 ? ' ' : ''}
                  </span>
                ))
              : '—'}
          </p>
        </div>
      )}

      <p className="text-xs uppercase tracking-wide text-gray-900 font-semibold px-1">
        Segment-by-segment translation
      </p>
      {phraseResults.map(({ token, results, matched, confidence }, index) => (
        <div key={`${token}-${index}`} className={`card py-4 ${!matched ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-gray-900">{token}</span>
            {matched && (
              <span className="text-xs bg-peacock-100 text-peacock-700 px-2 py-0.5 rounded-full border border-peacock-200">
                {confidence}%
              </span>
            )}
            {!matched && (
              <span className="text-xs bg-gray-100 text-gray-900 px-2 py-0.5 rounded-full border border-gray-200">
                not found
              </span>
            )}
          </div>
          {matched && results[0] && (
            <div>
              <p className="devanagari text-3xl font-bold text-saffron-600">
                {results[0].entry.tm_devanagari || '—'}
              </p>
              <p className="text-sm text-peacock-700 mt-1">{results[0].entry.tm_romanized}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MatchBadge({ type }: { type: SearchResult['matchType'] }) {
  const config = {
    exact:          { label: 'Exact match',       color: 'bg-peacock-100 text-peacock-800 border-peacock-200' },
    variant:        { label: 'Variant match',     color: 'bg-blue-100 text-blue-800 border-blue-200' },
    plural:         { label: 'Plural match',      color: 'bg-blue-100 text-blue-800 border-blue-200' },
    plural_variant: { label: 'Plural variant',    color: 'bg-blue-100 text-blue-800 border-blue-200' },
    partial:        { label: 'Partial match',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    fuzzy:          { label: 'Did you mean?',     color: 'bg-orange-100 text-orange-800 border-orange-200' },
  };
  const c = config[type];
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${c.color}`}>
      {c.label}
    </span>
  );
}
