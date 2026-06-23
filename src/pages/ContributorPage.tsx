import { useState, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ConfidenceLevel = 'confident' | 'partially-sure' | 'not-sure';

interface Prompt {
  id: string;
  english: string;
  type: 'word' | 'sentence';
  category: string;
  approvedCount: number;
  targetCount: number;
}

// ── Mock prompt data ──────────────────────────────────────────────────────────
const ALL_PROMPTS: Prompt[] = [
  { id: 'h1', english: 'fever', type: 'word', category: 'Health', approvedCount: 0, targetCount: 3 },
  { id: 'h2', english: 'medicine', type: 'word', category: 'Health', approvedCount: 1, targetCount: 3 },
  { id: 'h3', english: 'I have a headache', type: 'sentence', category: 'Health', approvedCount: 0, targetCount: 3 },
  { id: 'h4', english: 'Please call the doctor', type: 'sentence', category: 'Health', approvedCount: 1, targetCount: 3 },
  { id: 't1', english: 'phone', type: 'word', category: 'Technology', approvedCount: 0, targetCount: 3 },
  { id: 't2', english: 'internet', type: 'word', category: 'Technology', approvedCount: 0, targetCount: 3 },
  { id: 'tr1', english: 'train station', type: 'word', category: 'Travel', approvedCount: 1, targetCount: 3 },
  { id: 'tr2', english: 'Where is the bus stop?', type: 'sentence', category: 'Travel', approvedCount: 0, targetCount: 3 },
  { id: 'f1', english: 'rice', type: 'word', category: 'Food', approvedCount: 2, targetCount: 3 },
  { id: 'f2', english: 'Please pass the salt', type: 'sentence', category: 'Food', approvedCount: 1, targetCount: 3 },
  { id: 'fa1', english: 'grandmother', type: 'word', category: 'Family', approvedCount: 2, targetCount: 3 },
  { id: 'fa2', english: 'younger sister', type: 'word', category: 'Family', approvedCount: 1, targetCount: 3 },
];

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: 'confident', label: 'Confident' },
  { value: 'partially-sure', label: 'Partially sure' },
  { value: 'not-sure', label: 'Not sure' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPromptsForMode() {
  const needsMore = (p: Prompt) => p.approvedCount < p.targetCount;
  return ALL_PROMPTS.filter(needsMore);
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface AudioRecorderProps {
  onRecorded: (blob: Blob | null) => void;
  audioBlob: Blob | null;
}

function AudioRecorder({ onRecorded, audioBlob }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = URL.createObjectURL(blob);
        onRecorded(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError('Microphone access denied. Please allow mic access to record.');
    }
  }, [onRecorded]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    onRecorded(null);
  }, [onRecorded]);

  const audioUrl = audioBlob ? (audioUrlRef.current ?? URL.createObjectURL(audioBlob)) : null;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
        Voice Recording <span className="normal-case font-normal text-gray-400">(optional)</span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {!isRecording && !audioBlob && (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-saffron-400 hover:text-saffron-700"
          >
            <svg className="w-4 h-4 text-saffron-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Zm-1 16.93V21h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A8.001 8.001 0 0 0 20 12a1 1 0 1 0-2 0 6 6 0 0 1-12 0 1 1 0 1 0-2 0 8.001 8.001 0 0 0 7 7.93Z" />
            </svg>
            Record pronunciation
          </button>
        )}
        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-white" aria-hidden="true" />
            Stop recording
          </button>
        )}
        {audioUrl && !isRecording && (
          <>
            <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
            <button
              type="button"
              onClick={clearRecording}
              className="text-xs text-gray-400 hover:text-red-500 transition"
              aria-label="Remove recording"
            >
              Remove
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ContributorPage() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [romanized, setRomanized] = useState('');
  const [devanagari, setDevanagari] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('confident');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const prompts = getPromptsForMode().filter(p => !submitted.has(p.id) && !skipped.has(p.id));
  const current = prompts[promptIndex] ?? null;

  const resetForm = useCallback(() => {
    setRomanized('');
    setDevanagari('');
    setAudioBlob(null);
    setValidationError(null);
    setConfidence('confident');
  }, []);

  const handleSubmit = () => {
    if (!current) return;
    if (!consent) {
      setValidationError('Please accept the data usage consent before submitting.');
      return;
    }
    if (!romanized.trim()) {
      setValidationError('Romanized Marathi is required.');
      return;
    }
    if (!devanagari.trim()) {
      setValidationError('Devanagari Marathi is required.');
      return;
    }
    if (audioBlob && !romanized.trim()) {
      setValidationError('Please add text alongside your voice recording.');
      return;
    }

    setValidationError(null);
    setSubmitted(prev => new Set([...prev, current.id]));
    setShowSuccess(true);
    resetForm();
    setPromptIndex(0);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleSkip = () => {
    if (!current) return;
    setSkipped(prev => new Set([...prev, current.id]));
    resetForm();
    setPromptIndex(0);
  };

  const handleNext = () => {
    if (promptIndex < prompts.length - 1) {
      setPromptIndex(i => i + 1);
      resetForm();
    }
  };

  const totalDone = submitted.size;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

      {/* Success toast */}
      {showSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center gap-2 rounded-xl bg-peacock-50 border border-peacock-200 px-4 py-3 text-sm font-medium text-peacock-700 animate-slide-up"
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" />
          </svg>
          Contribution submitted — thank you!
        </div>
      )}

      {/* Summary strip */}
      {totalDone > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-2 text-sm text-gray-700">
          <svg className="w-4 h-4 text-saffron-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 2a8 8 0 1 1 0 16A8 8 0 0 1 10 2Zm.75 4.75a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.5a.75.75 0 0 0 0-1.5h-2.75v-3.75Z" />
          </svg>
          You have contributed <strong>{totalDone}</strong> {totalDone === 1 ? 'entry' : 'entries'} this session
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">

        {/* Left: prompt card + form */}
        <div className="space-y-5">
          {current ? (
            <article className="rounded-2xl border border-orange-100 bg-white/95 p-5 shadow-sm">

              {/* Card header */}
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={[
                      'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                      current.type === 'word'
                        ? 'bg-peacock-100 text-peacock-700'
                        : 'bg-saffron-100 text-saffron-700',
                    ].join(' ')}>
                      {current.type}
                    </span>
                    <span className="inline-block rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700 border border-orange-100">
                      {current.category}
                    </span>
                  </div>
                </div>

                {/* Progress in batch */}
                <span className="text-xs font-medium text-gray-400 shrink-0">
                  {promptIndex + 1} / {prompts.length}
                </span>
              </div>

              {/* English prompt */}
              <div className="mb-5 rounded-xl bg-cream border border-orange-100 px-5 py-4">
                <div className="mb-1 flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">English prompt</p>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800"
                  >
                    Skip word
                  </button>
                </div>
                <p className="text-2xl font-bold text-gray-900 leading-snug">{current.english}</p>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="romanized-input" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Romanized Marathi <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="romanized-input"
                    type="text"
                    value={romanized}
                    onChange={e => setRomanized(e.target.value)}
                    placeholder={`e.g. ${current.type === 'word' ? 'taap' : 'mazyaa dokyaala dukhataay'}`}
                    className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-300 shadow-inner focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-200 transition"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label htmlFor="devanagari-input" className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Devanagari Marathi <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="devanagari-input"
                    type="text"
                    value={devanagari}
                    onChange={e => setDevanagari(e.target.value)}
                    placeholder="e.g. ताप"
                    className="w-full rounded-xl border border-orange-200 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-300 shadow-inner focus:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-200 transition font-devanagari"
                    autoComplete="off"
                    spellCheck={false}
                    lang="mr"
                    dir="ltr"
                  />
                </div>

                <AudioRecorder onRecorded={setAudioBlob} audioBlob={audioBlob} />

                {/* Confidence */}
                <div className="mt-6 mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    How confident are you?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setConfidence(opt.value)}
                        className={[
                          'rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                          confidence === opt.value
                            ? 'bg-peacock-500 text-white shadow'
                            : 'border border-gray-200 bg-white text-gray-600 hover:border-peacock-400 hover:text-peacock-700',
                        ].join(' ')}
                        aria-pressed={confidence === opt.value}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Consent */}
              <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-orange-300 text-saffron-500 accent-saffron-500 focus:ring-saffron-400 shrink-0"
                  />
                  <span className="text-xs leading-5 text-gray-600">
                    I consent to my text and voice inputs being used for dataset training and quality improvement.
                  </span>
                </label>
              </div>

              {/* Validation error */}
              {validationError && (
                <p role="alert" className="mt-3 text-xs text-red-500 font-medium">
                  {validationError}
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!consent}
                  className="inline-flex items-center gap-2 rounded-full bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-saffron-600 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:ring-offset-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  Submit
                </button>

                {promptIndex < prompts.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-full border border-peacock-200 bg-peacock-50 px-4 py-2.5 text-sm font-medium text-peacock-700 shadow-sm transition hover:bg-peacock-100"
                  >
                    Next prompt
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                )}
              </div>
            </article>
          ) : (
            <div className="rounded-2xl border border-orange-100 bg-white/95 px-6 py-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-peacock-50">
                <svg className="w-8 h-8 text-peacock-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">All prompts covered!</h3>
              <p className="text-sm text-gray-500">
                {submitted.size > 0
                  ? `You contributed ${submitted.size} ${submitted.size === 1 ? 'entry' : 'entries'} this session. Thank you!`
                  : 'No prompts need contributions right now. Please check back later.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
