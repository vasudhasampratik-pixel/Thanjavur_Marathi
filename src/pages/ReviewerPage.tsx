import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Contribution, ContributionStatus } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function confidenceLabel(c: Contribution['confidence']) {
  if (c === 'confident') return { label: 'Confident', color: 'text-green-700 bg-green-50 border-green-200' };
  if (c === 'partially-sure') return { label: 'Partially sure', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  return { label: 'Not sure', color: 'text-red-700 bg-red-50 border-red-200' };
}

// ── Audio Player sub-component ────────────────────────────────────────────────

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => setError(true));
    }
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setError(true)}
        preload="none"
      />
      {error ? (
        <span className="text-xs text-red-500">Audio unavailable</span>
      ) : (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-1.5 rounded-full border border-peacock-200 bg-peacock-50 px-3 py-1.5 text-xs font-semibold text-peacock-700 transition hover:bg-peacock-100"
        >
          {isPlaying ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              Play recording
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Contribution Card ─────────────────────────────────────────────────────────

interface ContributionCardProps {
  contribution: Contribution;
  onApprove: (id: string) => void;
  onReject: (id: string, comment: string) => void;
  isSubmitting: boolean;
}

function ContributionCard({ contribution: c, onApprove, onReject, isSubmitting }: ContributionCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const confidence = confidenceLabel(c.confidence);

  const handleRejectSubmit = () => {
    if (!rejectComment.trim()) return;
    onReject(c.id, rejectComment.trim());
    setShowRejectForm(false);
    setRejectComment('');
  };

  return (
    <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-peacock-600">
            {c.promptType === 'sentence' ? 'Sentence' : 'Word'} · {c.category}
          </p>
          <p className="text-sm text-gray-500">
            By <span className="font-medium text-gray-700">{c.contributorName || c.contributorEmail}</span>
            {' · '}{formatDate(c.submittedAt)}
          </p>
        </div>
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${confidence.color}`}>
          {confidence.label}
        </span>
      </div>

      {/* Prompt */}
      <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-400 mb-1">English prompt</p>
        <p className="text-base font-semibold text-gray-900">{c.promptEnglish}</p>
      </div>

      {/* Translation */}
      <div className="rounded-xl bg-cream border border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1">Thanjavur Marathi</p>
        <p className="text-lg font-semibold text-gray-900">{c.translation}</p>
      </div>

      {/* Audio */}
      {c.audioUrl && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-1.5">Recording</p>
          <AudioPlayer url={c.audioUrl} />
        </div>
      )}

      {/* Review info for already-reviewed items */}
      {c.status !== 'pending' && (
        <div className={`rounded-xl px-4 py-3 text-sm ${c.status === 'approved' ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
          <span className="font-semibold capitalize">{c.status}</span>
          {c.reviewerComment && <span> · {c.reviewerComment}</span>}
        </div>
      )}

      {/* Action buttons (pending only) */}
      {c.status === 'pending' && (
        <div className="space-y-3 pt-1">
          {showRejectForm ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-600">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Explain why this contribution is being rejected..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-peacock-400 focus:outline-none focus:ring-2 focus:ring-peacock-200"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={!rejectComment.trim() || isSubmitting}
                  className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-40"
                >
                  Confirm rejection
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRejectForm(false); setRejectComment(''); }}
                  className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove(c.id)}
                disabled={isSubmitting}
                className="rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" /></svg>
                Approve
              </button>
              <button
                type="button"
                onClick={() => setShowRejectForm(true)}
                disabled={isSubmitting}
                className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" /></svg>
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

interface StatsBarProps {
  pending: number;
  approved: number;
  rejected: number;
}

function StatsBar({ pending, approved, rejected }: StatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Pending', value: pending, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
        { label: 'Approved', value: approved, color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
        { label: 'Rejected', value: rejected, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`rounded-2xl border ${bg} px-4 py-3 text-center`}>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: ContributionStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// ── Main ReviewerPage ─────────────────────────────────────────────────────────

export function ReviewerPage() {
  const { user, hasRole } = useAuth();
  const [filter, setFilter] = useState<ContributionStatus>('pending');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

  // Guard: only reviewers/admins
  if (!hasRole('reviewer') && !hasRole('admin')) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-700">You do not have reviewer access.</p>
        <p className="text-sm text-gray-500 mt-1">Contact an admin to request reviewer permissions.</p>
      </div>
    );
  }

  // Firestore real-time listener for the active filter
  useEffect(() => {
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'contributions'),
      where('status', '==', filter),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs: Contribution[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.uid ?? '',
            contributorEmail: data.contributorEmail ?? '',
            contributorName: data.contributorName ?? '',
            promptId: data.promptId ?? '',
            promptEnglish: data.promptEnglish ?? '',
            promptType: data.promptType ?? 'word',
            category: data.category ?? '',
            translation: data.translation ?? '',
            confidence: data.confidence ?? 'not-sure',
            audioUrl: data.audioUrl,
            status: data.status ?? 'pending',
            reviewerUid: data.reviewerUid,
            reviewerComment: data.reviewerComment,
            reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : undefined,
            submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(),
          };
        });
        setContributions(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setError('Failed to load contributions. Please try again.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filter]);

  // Fetch counts for all statuses (for stats bar)
  useEffect(() => {
    const unsubs = (['pending', 'approved', 'rejected'] as ContributionStatus[]).map((status) => {
      const q = query(collection(db, 'contributions'), where('status', '==', status));
      return onSnapshot(q, (snap) => {
        setCounts((prev) => ({ ...prev, [status]: snap.size }));
      });
    });
    return () => unsubs.forEach((u) => u());
  }, []);

  const handleApprove = useCallback(
    async (id: string) => {
      if (!user) return;
      setSubmittingIds((prev) => new Set(prev).add(id));
      try {
        await updateDoc(doc(db, 'contributions', id), {
          status: 'approved',
          reviewerUid: user.uid,
          reviewerComment: '',
          reviewedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Approve failed:', err);
        setError('Failed to approve. Please try again.');
      } finally {
        setSubmittingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [user]
  );

  const handleReject = useCallback(
    async (id: string, comment: string) => {
      if (!user) return;
      setSubmittingIds((prev) => new Set(prev).add(id));
      try {
        await updateDoc(doc(db, 'contributions', id), {
          status: 'rejected',
          reviewerUid: user.uid,
          reviewerComment: comment,
          reviewedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Reject failed:', err);
        setError('Failed to reject. Please try again.');
      } finally {
        setSubmittingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [user]
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Contribution Review Queue</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, or reject submitted Thanjavur Marathi translations.
        </p>
      </div>

      {/* Stats bar */}
      <StatsBar pending={counts.pending} approved={counts.approved} rejected={counts.rejected} />

      {/* Status filter tabs */}
      <div className="flex gap-2 border-b border-orange-100 pb-0">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={[
              'px-4 py-2 text-sm font-semibold rounded-t-xl border border-b-0 transition-colors',
              filter === value
                ? 'bg-white border-orange-200 text-peacock-700 shadow-sm'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-orange-50',
            ].join(' ')}
          >
            {label}
            {value === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-saffron-500 text-white text-[10px] font-bold w-4 h-4">
                {counts.pending > 99 ? '99+' : counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-3 text-xs font-semibold underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : contributions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-gray-600">
            {filter === 'pending'
              ? 'No pending contributions right now.'
              : `No ${filter} contributions yet.`}
          </p>
          {filter === 'pending' && (
            <p className="text-xs text-gray-400 mt-1">Check back later as contributors submit new translations.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contributions.map((c) => (
            <ContributionCard
              key={c.id}
              contribution={c}
              onApprove={handleApprove}
              onReject={handleReject}
              isSubmitting={submittingIds.has(c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
