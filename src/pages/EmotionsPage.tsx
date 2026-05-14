import { useState } from 'react';
import { EMOTION_GROUPS, type EmotionGroup } from '../data/emotions';

const publicAssetUrl = (path: string) => {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return `${baseUrl}${path.replace(/^\//, '')}`;
};

// ── Placeholder card for groups without an image ─────────────────────────────
const PLACEHOLDER_GRADIENTS: Record<string, string> = {
  dignified: 'from-slate-200 to-slate-300',
};

function EmotionCard({
  group,
  onClick,
}: {
  group: EmotionGroup;
  onClick: () => void;
}) {
  const gradient = PLACEHOLDER_GRADIENTS[group.id] ?? 'from-saffron-100 to-saffron-200';
  const primary = group.entries[0];

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl overflow-hidden shadow-sm border border-orange-100 bg-white hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:ring-offset-2"
      aria-label={`${group.primaryEnglish} — tap to see Marathi words`}
    >
      {/* Image / placeholder */}
      <div className="relative w-full aspect-square overflow-hidden">
        {group.image ? (
          <img
            src={publicAssetUrl(`/expressions/${group.image}`)}
            alt={group.primaryEnglish}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <span className="text-5xl select-none" aria-hidden="true">🌿</span>
          </div>
        )}

        {/* Word-count badge (when group has multiple entries) */}
        {group.entries.length > 1 && (
          <span className="absolute top-2 right-2 bg-saffron-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
            {group.entries.length} words
          </span>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-saffron-500/0 group-hover:bg-saffron-500/10 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 text-saffron-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            Tap to reveal
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 pb-3 pt-2">
        <p className="text-xs font-semibold text-peacock-600 uppercase tracking-wide leading-none mb-1">
          {group.primaryEnglish}
        </p>
        <p className="text-base font-bold text-gray-900 leading-tight">{primary.roman}</p>
        <p className="devanagari text-lg text-saffron-500 leading-tight">{primary.devanagari}</p>
      </div>
    </button>
  );
}

// ── Detail panel — slide-up on mobile, centred modal on desktop ───────────────
function EmotionDetail({
  group,
  onClose,
}: {
  group: EmotionGroup;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed z-50 bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={`${group.primaryEnglish} words`}
      >
        <div
          className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col border-t-4 border-saffron-500 sm:border-t-0 sm:border sm:border-orange-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar (mobile only) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              {group.image && (
                <img
                  src={publicAssetUrl(`/expressions/${group.image}`)}
                  alt={group.primaryEnglish}
                  className="w-12 h-12 rounded-xl object-cover border border-orange-100 shadow-sm"
                />
              )}
              <div>
                <p className="text-xs font-semibold text-peacock-600 uppercase tracking-wide">
                  {group.primaryEnglish}
                </p>
                <p className="text-lg font-bold text-gray-900 leading-tight">
                  {group.entries[0].roman}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 hover:text-gray-900 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Entries */}
          <div className="overflow-y-auto px-5 pb-6 space-y-3">
            {group.entries.map((entry, i) => (
              <div
                key={i}
                className="rounded-2xl border border-orange-100 bg-saffron-50 px-4 py-3"
              >
                <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                  <span className="text-xl font-bold text-gray-900">{entry.roman}</span>
                  <span className="devanagari text-2xl text-saffron-500 leading-none">{entry.devanagari}</span>
                </div>
                <p className="text-sm text-peacock-700 font-medium">{entry.english}</p>
                {entry.note && (
                  <p className="mt-1.5 text-xs text-gray-900 leading-relaxed border-t border-orange-100 pt-1.5">
                    {entry.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function EmotionsPage() {
  const [selected, setSelected] = useState<EmotionGroup | null>(null);

  return (
    <div className="max-w-screen-lg mx-auto px-4 pb-28 sm:pb-12">

      {/* Page heading */}
      <div className="text-center py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Bhavana — Emotions & Character
        </h2>
        <p className="devanagari text-3xl text-saffron-500 mt-1 leading-snug">भावना</p>

      </div>

           {/* Tap hint */}
           <div>
      <span className="inline-flex items-center gap-1.5 text-peacock-600 font-medium">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
        </svg>
        Tap any card to see the Devanagari script
      </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {EMOTION_GROUPS.map((group) => (
          <EmotionCard
            key={group.id}
            group={group}
            onClick={() => setSelected(group)}
          />
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <EmotionDetail
          group={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
