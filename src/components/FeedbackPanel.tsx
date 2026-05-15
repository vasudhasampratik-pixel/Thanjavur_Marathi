import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { inferSentenceFamily, type SentenceFamily } from '../utils/sentenceFamily';

type SpeakerProfile = 'young_female' | 'young_male' | 'elder_respectful';

interface FeedbackPanelProps {
  sourceEnglish: string;
  modelOutput: string;
  sourceId: string;
}

interface LocalFeedbackRow {
  source_english: string;
  speaker_profile: string;
  sentence_family: string;
  model_target_tm_romanized: string;
  corrected_target_tm_romanized: string;
  source_id: string;
  reviewer_id?: string;
  timestamp: string;
}

const LOCAL_QUEUE_KEY = 'tm_feedback_queue';

function getLocalQueue(): LocalFeedbackRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LocalFeedbackRow[]) : [];
  } catch {
    return [];
  }
}

function saveLocalQueue(rows: LocalFeedbackRow[]): void {
  localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(rows));
}

function queueFeedback(row: LocalFeedbackRow): number {
  const current = getLocalQueue();
  const next = [...current, row];
  saveLocalQueue(next);
  return next.length;
}

function exportQueueAsJsonl(): string {
  return getLocalQueue().map((row) => JSON.stringify(row)).join('\n');
}

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function FeedbackPanel({ sourceEnglish, modelOutput, sourceId }: FeedbackPanelProps) {
  const { user } = useAuth();
  const [speakerProfile, setSpeakerProfile] = useState<SpeakerProfile>('young_female');
  const inferredFamily = useMemo(() => inferSentenceFamily(sourceEnglish), [sourceEnglish]);
  const [sentenceFamily, setSentenceFamily] = useState<SentenceFamily>(inferredFamily);
  const [correctedOutput, setCorrectedOutput] = useState(modelOutput);
  const [status, setStatus] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const reviewerId = user ? `${user.email || user.uid}` : '';

  const feedbackEndpoint = import.meta.env.VITE_FEEDBACK_ENDPOINT || 'http://localhost:4317/feedback';
  const canSave = sourceEnglish.trim() && modelOutput.trim() && correctedOutput.trim();

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setStatus('Saving...');

    const payload: LocalFeedbackRow = {
      source_english: sourceEnglish.trim(),
      speaker_profile: speakerProfile,
      sentence_family: sentenceFamily,
      model_target_tm_romanized: modelOutput.trim(),
      corrected_target_tm_romanized: correctedOutput.trim(),
      source_id: sourceId,
      ...(reviewerId.trim() ? { reviewer_id: reviewerId.trim() } : {}),
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(feedbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Feedback API not available');
      }

      setStatus('Saved to feedback_gold.jsonl');
    } catch {
      const queuedCount = queueFeedback(payload);
      setStatus(`Feedback server unavailable. Saved locally (${queuedCount} queued).`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportQueued = () => {
    const body = exportQueueAsJsonl();
    if (!body) {
      setStatus('No queued local feedback rows to export.');
      return;
    }
    downloadText('feedback_queue.jsonl', body + '\n');
    setStatus('Queued feedback exported as feedback_queue.jsonl');
  };

  return (
    <div className="card border-peacock-200 space-y-3">
      <p className="text-xs uppercase tracking-wide text-gray-900 font-semibold">
        Human correction
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm text-gray-900">
          Speaker profile
          <select
            value={speakerProfile}
            onChange={(e) => setSpeakerProfile(e.target.value as SpeakerProfile)}
            className="input-field mt-1 py-2"
          >
            <option value="young_female">young_female</option>
            <option value="young_male">young_male</option>
            <option value="elder_respectful">elder_respectful</option>
          </select>
        </label>

        <label className="text-sm text-gray-900">
          Sentence family
          <select
            value={sentenceFamily}
            onChange={(e) => setSentenceFamily(e.target.value as SentenceFamily)}
            className="input-field mt-1 py-2"
          >
            <option value="fixed_formula">fixed_formula</option>
            <option value="identity">identity</option>
            <option value="description">description</option>
            <option value="location">location</option>
            <option value="experiencer">experiencer</option>
            <option value="imperative">imperative</option>
            <option value="yes_no_question">yes_no_question</option>
            <option value="wh_question">wh_question</option>
            <option value="progressive">progressive</option>
            <option value="past">past</option>
            <option value="future">future</option>
          </select>
        </label>
      </div>

      {user && (
        <p className="text-xs text-peacock-700 font-medium">
          🔒 Correction will be saved as <span className="font-semibold">{user.email || user.displayName || user.uid}</span>
        </p>
      )}

      <label className="text-sm text-gray-900 block">
        Model output
        <textarea
          value={modelOutput}
          readOnly
          rows={2}
          className="input-field mt-1 py-2 bg-gray-50"
        />
      </label>

      <label className="text-sm text-gray-900 block">
        Corrected TM output
        <textarea
          value={correctedOutput}
          onChange={(e) => setCorrectedOutput(e.target.value)}
          rows={3}
          className="input-field mt-1 py-2"
        />
      </label>

      <div className="flex gap-2 flex-wrap">
        <button onClick={handleSave} disabled={!canSave || isSaving} className="btn-primary disabled:opacity-50">
          Save correction
        </button>
        <button
          onClick={handleExportQueued}
          className="px-4 py-2 rounded-xl border border-peacock-200 text-peacock-700 font-medium hover:bg-peacock-50"
        >
          Export queued feedback
        </button>
      </div>

      {status && <p className="text-sm text-gray-900">{status}</p>}
      <p className="text-xs text-gray-900">
        Source ID: {sourceId} | Inferred family: {inferredFamily}
      </p>
    </div>
  );
}
