import type { FamilyMember } from '../../data/simpleRelations';

interface Props {
  member: FamilyMember;
  index: number;
  isSelected: boolean;
  onClick: (m: FamilyMember) => void;
}

export function TreeNode({ member, index, isSelected, onClick }: Props) {
  const isMe     = member.id === 'me';
  const isSpouse = member.id === 'spouse';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(member)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(member)}
      className={[
        'absolute flex flex-col items-center justify-center gap-0',
        'cursor-pointer select-none rounded-2xl border-2 overflow-hidden',
        'transition-all duration-200 tree-node-enter',
        isMe
          ? 'bg-saffron-500 border-saffron-600 shadow-lg'
          : isSpouse
          ? 'bg-peacock-500 border-peacock-600 shadow-lg'
          : 'bg-white border-orange-200 hover:border-saffron-400',
        isSelected
          ? 'ring-2 ring-offset-2 ring-saffron-400 scale-110 shadow-xl z-20'
          : 'hover:scale-105 hover:shadow-md z-10',
      ].join(' ')}
      style={{
        left: member.x - 50,
        top: member.y - 32,
        width: 100,
        height: 64,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Emoji avatar — animated in with the card */}
      <span className="text-xl leading-none">{member.emoji}</span>

      {/* English label — always visible */}
      <span
        className={[
          'text-center text-[10px] leading-tight font-semibold mt-0.5 px-1 w-full truncate text-center',
          isMe || isSpouse ? 'text-white' : 'text-gray-900',
        ].join(' ')}
      >
        {member.english}
      </span>

      {/* TMD Romanized — always visible */}
      <span
        className={[
          'text-center text-[10px] leading-tight italic px-1 w-full truncate text-center',
          isMe || isSpouse ? 'text-white/90' : 'text-saffron-600',
        ].join(' ')}
      >
        {member.label_roman}
      </span>
    </div>
  );
}
