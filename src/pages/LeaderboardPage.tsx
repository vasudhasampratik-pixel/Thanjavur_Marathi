import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// ── Tier system ───────────────────────────────────────────────────────────────

interface Tier {
  label: string;
  minCount: number;
  color: string;
  bg: string;
  border: string;
}

const TIERS: Tier[] = [
  { label: 'Champion',    minCount: 26, color: 'text-saffron-700',  bg: 'bg-saffron-50',  border: 'border-saffron-200' },
  { label: 'Guardian',    minCount: 11, color: 'text-peacock-700',  bg: 'bg-peacock-50',  border: 'border-peacock-200' },
  { label: 'Contributor', minCount: 4,  color: 'text-green-700',    bg: 'bg-green-50',    border: 'border-green-200' },
  { label: 'Seedling',    minCount: 1,  color: 'text-gray-600',     bg: 'bg-gray-50',     border: 'border-gray-200' },
];

function getTier(count: number): Tier {
  return TIERS.find((t) => count >= t.minCount) ?? TIERS[TIERS.length - 1];
}

// ── Leaderboard entry type ────────────────────────────────────────────────────

interface LeaderEntry {
  uid: string;
  name: string;
  count: number;
}

// ── Podium card (top 3) ───────────────────────────────────────────────────────

const PODIUM_META = [
  {
    rank: 1,
    trophy: '🥇',
    ringColor: 'ring-yellow-400',
    bg: 'from-yellow-50 to-orange-50',
    border: 'border-yellow-200',
    labelColor: 'text-yellow-700',
    heightClass: 'min-h-[140px]',
    order: 'order-2',
  },
  {
    rank: 2,
    trophy: '🥈',
    ringColor: 'ring-slate-300',
    bg: 'from-slate-50 to-gray-50',
    border: 'border-slate-200',
    labelColor: 'text-slate-600',
    heightClass: 'min-h-[110px]',
    order: 'order-1',
  },
  {
    rank: 3,
    trophy: '🥉',
    ringColor: 'ring-orange-300',
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    labelColor: 'text-orange-600',
    heightClass: 'min-h-[90px]',
    order: 'order-3',
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface PodiumCardProps {
  entry: LeaderEntry;
  rank: 1 | 2 | 3;
  isMe: boolean;
}

function PodiumCard({ entry, rank, isMe }: PodiumCardProps) {
  const meta = PODIUM_META[rank - 1];
  const tier = getTier(entry.count);

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-end rounded-2xl border bg-gradient-to-b px-4 py-4 text-center shadow-sm',
        meta.bg,
        meta.border,
        meta.heightClass,
        meta.order,
        isMe ? 'ring-2 ring-saffron-400 ring-offset-2' : '',
      ].join(' ')}
    >
      {isMe && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-saffron-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
          You
        </span>
      )}
      <span className="text-2xl mb-1">{meta.trophy}</span>
      <div
        className={[
          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow ring-2',
          meta.ringColor,
          rank === 1 ? 'bg-saffron-500' : rank === 2 ? 'bg-slate-500' : 'bg-orange-400',
        ].join(' ')}
      >
        {initials(entry.name) || '?'}
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-800 leading-snug max-w-[80px] truncate">
        {entry.name}
      </p>
      <p className={`text-lg font-bold ${meta.labelColor}`}>{entry.count}</p>
      <span className={`mt-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tier.color} ${tier.bg} ${tier.border}`}>
        {tier.label}
      </span>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ContribBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-saffron-400 to-orange-400 transition-all duration-700"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Main LeaderboardPage ──────────────────────────────────────────────────────

export function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'contributions'),
      (snapshot) => {
        const counts: Record<string, { name: string; count: number }> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as { uid?: string; contributorName?: string };
          const uid = data.uid;
          const name = data.contributorName?.trim() || 'Anonymous';
          if (!uid) return;
          if (!counts[uid]) counts[uid] = { name, count: 0 };
          counts[uid].count += 1;
          // keep most recent name in case it changed
          if (name !== 'Anonymous') counts[uid].name = name;
        });

        const sorted: LeaderEntry[] = Object.entries(counts)
          .map(([uid, { name, count }]) => ({ uid, name, count }))
          .sort((a, b) => b.count - a.count);

        setEntries(sorted);
        setLoading(false);
      },
      (err) => {
        console.error('Leaderboard load error:', err);
        setError('Could not load leaderboard. Please try again.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const myRank = entries.findIndex((e) => e.uid === user?.uid) + 1;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const maxCount = entries[0]?.count ?? 1;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-4xl mb-4">🌱</div>
        <p className="text-lg font-semibold text-gray-800">Be the first contributor!</p>
        <p className="mt-1 text-sm text-gray-500">No contributions yet. Head to the Contribute tab and plant the first seed.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-7">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-900">Contributors Leaderboard</h2>
        <p className="text-sm text-gray-500">
          Every word contributed helps keep Thanjavur Marathi alive.
        </p>
      </div>

      {/* Your rank callout */}
      {user && myRank > 0 && (
        <div className="rounded-2xl border border-saffron-200 bg-gradient-to-r from-saffron-50 to-orange-50 px-5 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-saffron-600">Your rank</p>
            <p className="text-2xl font-bold text-saffron-700">#{myRank}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500">Contributions</p>
            <p className="text-2xl font-bold text-gray-800">{entries[myRank - 1].count}</p>
          </div>
          <span className={[
            'rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider',
            getTier(entries[myRank - 1].count).color,
            getTier(entries[myRank - 1].count).bg,
            getTier(entries[myRank - 1].count).border,
          ].join(' ')}>
            {getTier(entries[myRank - 1].count).label}
          </span>
        </div>
      )}

      {/* Tier legend */}
      <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Tiers</p>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <span
              key={t.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${t.color} ${t.bg} ${t.border}`}
            >
              {t.label}
              <span className="font-normal opacity-70">≥ {t.minCount}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 text-center">
            Hall of Fame
          </p>
          <div className="flex items-end justify-center gap-3">
            {top3.map((entry, i) => (
              <PodiumCard
                key={entry.uid}
                entry={entry}
                rank={(i + 1) as 1 | 2 | 3}
                isMe={entry.uid === user?.uid}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rest of the board */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            All contributors
          </p>
          {rest.map((entry, i) => {
            const rank = i + 4;
            const tier = getTier(entry.count);
            const isMe = entry.uid === user?.uid;

            return (
              <div
                key={entry.uid}
                className={[
                  'flex items-center gap-3 rounded-2xl border px-4 py-3 transition',
                  isMe
                    ? 'border-saffron-300 bg-saffron-50 ring-1 ring-saffron-200'
                    : 'border-orange-100 bg-white hover:border-orange-200',
                ].join(' ')}
              >
                <span className="w-6 text-center text-sm font-bold text-gray-400">
                  {rank}
                </span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                  {initials(entry.name) || '?'}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
                    {isMe && (
                      <span className="rounded-full bg-saffron-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        You
                      </span>
                    )}
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${tier.color} ${tier.bg} ${tier.border}`}>
                      {tier.label}
                    </span>
                  </div>
                  <ContribBar count={entry.count} max={maxCount} />
                </div>
                <span className="shrink-0 text-sm font-bold text-gray-700">{entry.count}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-4">
        {entries.length} contributor{entries.length !== 1 ? 's' : ''} and counting. Keep going!
      </p>
    </div>
  );
}
