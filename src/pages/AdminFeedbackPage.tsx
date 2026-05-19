import { useEffect, useState } from 'react';
import { useAuth, isAdminUser } from '../contexts/AuthContext';
import { supabase } from '../supabase';

interface FeedbackCorrectionRow {
  id: string;
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  model_target_tm_romanized: string;
  corrected_target_tm_romanized: string;
  source_id: string;
  reviewer_id?: string;
  timestamp: string;
  submittedBy?: {
    uid: string | null;
    email: string | null;
    displayName: string | null;
  };
  submittedAt?: string | null;
}

function formatDate(date?: string | null) {
  if (!date) return 'Pending';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Pending';
  return parsed.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminFeedbackPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FeedbackCorrectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    if (!isAdminUser(user)) {
      setLoading(false);
      return;
    }

    async function loadRows() {
      const { data, error: fetchError } = await supabase
        .from('feedback_corrections')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (fetchError) {
        console.error('Error loading feedback corrections:', fetchError);
        if (isMounted) {
          setError('Unable to load feedback corrections right now.');
          setLoading(false);
        }
        return;
      }

      const nextRows: FeedbackCorrectionRow[] = (data ?? []).map((item) => ({
        id: String(item.id ?? ''),
        source_english: String(item.source_english ?? ''),
        speaker_profile: String(item.speaker_profile ?? ''),
        sentence_family: String(item.sentence_family ?? ''),
        model_target_tm_romanized: String(item.model_target_tm_romanized ?? ''),
        corrected_target_tm_romanized: String(item.corrected_target_tm_romanized ?? ''),
        source_id: String(item.source_id ?? ''),
        reviewer_id: item.reviewer_id ? String(item.reviewer_id) : undefined,
        timestamp: String(item.timestamp ?? ''),
        submittedBy: item.submitted_by ? {
          uid: item.submitted_by.uid ?? null,
          email: item.submitted_by.email ?? null,
          displayName: item.submitted_by.displayName ?? null,
        } : undefined,
        submittedAt: item.submitted_at ? String(item.submitted_at) : null,
      }));

      if (isMounted) {
        setRows(nextRows);
        setLoading(false);
      }
    }

    loadRows();
    const intervalId = window.setInterval(loadRows, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  if (!user || !isAdminUser(user)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-center">
        <p className="text-lg font-semibold text-gray-900">Admin access required</p>
        <p className="mt-3 text-sm text-gray-700">
          Only authorized accounts may view and export feedback corrections.
        </p>
      </div>
    );
  }

  const buildJsonl = (dataRows: FeedbackCorrectionRow[]) =>
    dataRows
      .map((row) =>
        JSON.stringify({
          source_english: row.source_english,
          speaker_profile: row.speaker_profile,
          sentence_family: row.sentence_family,
          model_target_tm_romanized: row.model_target_tm_romanized,
          corrected_target_tm_romanized: row.corrected_target_tm_romanized,
          source_id: row.source_id,
          reviewer_id: row.reviewer_id ?? null,
          timestamp: row.timestamp,
          submitted_by: row.submittedBy ?? null,
          submitted_at: row.submittedAt ?? null,
        })
      )
      .join('\n');

  const isReviewedRow = (row: FeedbackCorrectionRow) => {
    return Boolean(
      row.reviewer_id?.trim() ||
      row.submittedBy?.email?.trim() ||
      row.submittedBy?.displayName?.trim() ||
      row.submittedBy?.uid?.trim()
    );
  };

  const handleExportJsonl = () => {
    const body = buildJsonl(rows);
    downloadText('feedback_corrections.jsonl', body + '\n');
  };

  const handleExportReviewedJsonl = () => {
    const reviewedRows = rows.filter(isReviewedRow);
    const body = buildJsonl(reviewedRows);
    downloadText('feedback_corrections_reviewed.jsonl', body + '\n');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-peacock-600 font-semibold">Admin dashboard</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Feedback corrections</h2>
            <p className="mt-2 text-sm text-gray-700 max-w-2xl">
              Review the submissions sent by users and export the data as JSONL for training or analysis.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end sm:flex-row">
            <div className="rounded-2xl bg-saffron-50 px-4 py-3 text-sm text-gray-800">
              <strong>{rows.length}</strong> correction{subs(rows.length)} loaded
            </div>
            <button
              type="button"
              onClick={handleExportJsonl}
              disabled={rows.length === 0}
              className="inline-flex items-center justify-center rounded-2xl bg-saffron-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-saffron-600 disabled:opacity-50"
            >
              Export all JSONL
            </button>
            <button
              type="button"
              onClick={handleExportReviewedJsonl}
              disabled={rows.filter(isReviewedRow).length === 0}
              className="inline-flex items-center justify-center rounded-2xl bg-peacock-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-peacock-700 disabled:opacity-50"
            >
              Export reviewed only
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-orange-100 bg-white p-10 text-center text-gray-700 shadow-sm">
          Loading feedback corrections…
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-700 shadow-sm">
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-orange-100 bg-white p-8 text-center text-gray-700 shadow-sm">
          No feedback corrections have been submitted yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-orange-100 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-orange-100 text-sm">
            <thead className="bg-orange-50 text-left text-xs uppercase tracking-[0.24em] text-gray-700">
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Reviewer</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Model output</th>
                <th className="px-4 py-3">Corrected output</th>
                <th className="px-4 py-3">Profile / Family</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-4 align-top text-xs text-slate-500">
                    {formatDate(row.submittedAt)}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-semibold text-gray-900">{row.submittedBy?.displayName ?? row.reviewer_id ?? 'Anonymous'}</p>
                    <p className="text-xs text-slate-500">{row.submittedBy?.email ?? row.reviewer_id ?? '—'}</p>
                  </td>
                  <td className="px-4 py-4 align-top max-w-[16rem] break-words text-sm text-slate-900">
                    <div className="font-semibold">{row.source_english}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.source_id}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-900">
                    <div className="whitespace-pre-wrap">{row.model_target_tm_romanized}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-900">
                    <div className="whitespace-pre-wrap">{row.corrected_target_tm_romanized}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-900">
                    <div>{row.speaker_profile}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.sentence_family}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function subs(count: number) {
  return count === 1 ? ' correction' : ' corrections';
}
