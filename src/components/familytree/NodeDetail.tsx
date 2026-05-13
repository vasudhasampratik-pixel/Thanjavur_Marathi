import type { FamilyMember } from '../../data/simpleRelations';

interface Props {
  member: FamilyMember;
  onClose: () => void;
}

export function NodeDetail({ member, onClose }: Props) {
  const isMe     = member.id === 'me';
  const isSpouse = member.id === 'spouse';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 sm:absolute sm:bottom-auto sm:top-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-96"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border-t-4 border-saffron-500 sm:border-t-0 sm:border sm:border-orange-100 p-5 animate-slide-up">

        {/* ── Header: emoji + English label + close ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-4xl leading-none">{member.emoji}</span>
            <span
              className={[
                'text-xs font-bold px-3 py-1 rounded-full',
                isMe
                  ? 'bg-saffron-500 text-white'
                  : isSpouse
                  ? 'bg-peacock-500 text-white'
                  : 'bg-saffron-100 text-saffron-700 border border-saffron-200',
              ].join(' ')}
            >
              {member.english}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-900 hover:text-gray-900 text-lg leading-none transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── TMD Romanized — always prominent ── */}
        <p className="text-2xl font-bold text-gray-900 leading-snug mb-1">
          {member.label_roman}
        </p>

        {/* ── Devanagari — revealed only on tap ── */}
        <p className="devanagari text-3xl text-saffron-500 leading-snug mb-3">
          {member.label_devanagari}
        </p>

        {/* ── Cultural notes ── */}
        {member.notes && (
          <p className="text-xs text-gray-900 leading-relaxed border-t border-orange-50 pt-3">
            {member.notes}
          </p>
        )}
      </div>
    </div>
  );
}
