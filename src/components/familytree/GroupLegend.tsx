export function GroupLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5 text-xs text-gray-900">

      {/* Marriage line swatch */}
      <span className="inline-flex items-center gap-2">
        <svg width="30" height="10" aria-hidden="true">
          <line x1="0" y1="5" x2="30" y2="5" stroke="#72c9a5" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        Marriage
      </span>

      {/* Descent / blood line swatch */}
      <span className="inline-flex items-center gap-2">
        <svg width="10" height="22" aria-hidden="true">
          <line x1="5" y1="0" x2="5" y2="22" stroke="#ffa47a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Blood / descent
      </span>

      {/* Tap hint */}
      <span className="inline-flex items-center gap-1.5 text-peacock-600 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
        Tap any card to see the Devanagari script
      </span>
    </div>
  );
}
