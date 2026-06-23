import { useState, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ContributionMode = 'words' | 'sentences' | 'mixed' | 'recommended';
type ConfidenceLevel = 'very-confident' | 'confident' | 'partially-sure' | 'not-sure';

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

const COVERAGE_DATA = [
  { category: 'Food', pct: 82 },
  { category: 'Family', pct: 65 },
  { category: 'Travel', pct: 33 },
  { category: 'Health', pct: 21 },
  { category: 'Technology', pct: 14 },
];

const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: 'very-confident', label: 'Very confident' },
  { value: 'confident', label: 'Confident' },
  { value: 'partially-sure', label: 'Partially sure' },
  { value: 'not-sure', label: 'Not sure' },
];

const MODE_OPTIONS: { value: ContributionMode; label: string; description: string }[] = [
  { value: 'recommended', label: 'Recommended for me', description: 'Prioritises undercovered topics' },
  { value: 'words', label: 'Words', description: 'Single words only' },
  { value: 'sentences', label: 'Sentences', description: 'Full phrases and sentences' },
  { value: 'mixed', label: 'Mixed', description: 'Words and sentences together' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPromptsForMode(mode: ContributionMode): Prompt[] {
  const needsMore = (p: Prompt) => p.approvedCount < p.targetCount;
  switch (mode) {
    case 'words':
      return ALL_PROMPTS.filter(p => p.type === 'word' && needsMore(p));
    case 'sentences':
      return ALL_PROMPTS.filter(p => p.type === 'sentence' && needsMore(p));
    case 'recommended':
      return [...ALL_PROMPTS].filter(needsMore).sort((a, b) => {
        const covA = COVERAGE_DATA.find(c => c.category === a.category)?.pct ?? 100;
        const covB = COVERAGE_DATA.find(c => c.category === b.category)?.pct ?? 100;
        return covA - covB || a.approvedCount - b.approvedCount;
      });
    default:
      return ALL_PROMPTS.filter(needsMore);
  }
}

function coverageColor(pct: number): string {
  if (pct >= 70) return 'bg-peacock-400';
  if (pct >= 40) return 'bg-saffron-400';
  return 'bg-red-400';
}

function coverageTextColor(pct: number): string {
  if (pct >= 70) return 'text-peacock-700';
  if (pct >= 40) return 'text-saffron-600';
  return 'text-red-600';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CoveragePanel() {
  return (
    <aside className="rounded-2xl border border-orange-100 bg-white/80 p-5 shadow-sm">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-peacock-600">
        Category Coverage
      </h2>
      <p className="mb-4 text-xs text-gray-500">Contribute to undercovered areas first</p>
      <ul className="space-y-3">
        {COVERAGE_DATA.map(({ category, pct }) => (
          <li key={category}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{category}</span>
              <span className={`text-xs font-semibold ${coverageTextColor(pct)}`}>{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${coverageColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 rounded-xl bg-saffron-50 px-3 py-2 text-xs leading-5 text-saffron-700">
        <strong>Recommended:</strong> Health &amp; Technology — fewer than 3 approved entries per prompt.
      </p>
    </aside>
  );
}

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
  const [mode, setMode] = useState<ContributionMode>('recommended');
  const [promptIndex, setPromptIndex] = useState(0);
  const [romanized, setRomanized] = useState('');
  const [devanagari, setDevanagari] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('confident');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [consent, setConsent] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const prompts = getPromptsForMode(mode).filter(p => !submitted.has(p.id) && !skipped.has(p.id));
  const current = prompts[promptIndex] ?? null;

  const resetForm = useCallback(() => {
    setRomanized('');
    setDevanagari('');
    setAudioBlob(null);
    setFlagged(false);
    setValidationError(null);
    setConfidence('confident');
  }, []);

  const handleModeChange = (m: ContributionMode) => {
    setMode(m);
    setPromptIndex(0);
    resetForm();
  };

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

  const handleFlag = () => {
    if (!current) return;
    setFlagged(true);
  };

  const handleNext = () => {
    if (promptIndex < prompts.length - 1) {
      setPromptIndex(i => i + 1);
      resetForm();
    }
  };

  const totalDone = submitted.size;
  const recommendedCategory = COVERAGE_DATA.slice().sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Contribute to the Dictionary
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Help preserve Thanjavur Marathi by contributing words and sentences to the training dataset.
        </p>
        {recommendedCategory && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-saffron-50 border border-saffron-200 px-4 py-1.5 text-sm text-saffron-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            Recommended: <strong>{recommendedCategory.category}</strong> — low coverage, needs your help
          </div>
        )}
      </div>

      {/* Mode selector */}
      <section className="mb-6" aria-label="Contribution mode">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
          What would you like to contribute?
        </h2>
        <div className="flex flex-wrap gap-2">
          {MODE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleModeChange(opt.value)}
              title={opt.description}
              className={[
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                mode === opt.value
                  ? 'bg-saffron-500 text-white shadow-md'
                  : 'border border-orange-200 bg-white text-gray-700 hover:border-saffron-400 hover:text-saffron-700',
              ].join(' ')}
              aria-pressed={mode === opt.value}
            >
              {opt.value === 'recommended' && (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M9.049 2.927C9.349 2.005 10.651 2.005 10.951 2.927l1.286 3.959a1 1 0 0 0 .951.693h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 0 0-.364 1.118l1.286 3.959c.3.923-.755 1.688-1.54 1.118L10 15.347l-3.37 2.448c-.785.57-1.84-.195-1.54-1.118l1.286-3.959a1 1 0 0 0-.364-1.118L2.642 9.39c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 0 0 .951-.693l1.285-3.96Z" />
                </svg>
              )}
              {opt.label}
            </button>
          ))}
        </div>
      </section>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">

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
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {current.approvedCount}/{current.targetCount} approved entries
                  </div>
                </div>

                {/* Progress in batch */}
                <span className="text-xs font-medium text-gray-400 shrink-0">
                  {promptIndex + 1} / {prompts.length}
                </span>
              </div>

              {/* English prompt */}
              <div className="mb-5 rounded-xl bg-cream border border-orange-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">English prompt</p>
                <p className="text-2xl font-bold text-gray-900 leading-snug">{current.english}</p>
              </div>

              {/* Flagged notice */}
              {flagged && (
                <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
                  This prompt has been flagged as unclear. You can still contribute or skip to the next one.
                </div>
              )}

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
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
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

                <button
                  type="button"
                  onClick={handleSkip}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-800"
                >
                  Skip
                </button>

                <button
                  type="button"
                  onClick={handleFlag}
                  disabled={flagged}
                  className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-700 shadow-sm transition hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18m0-14.25 5.25-1.5L13.5 7.5 19.5 6v10.5l-6 1.5-5.25-2.25L3 17.25" />
                  </svg>
                  {flagged ? 'Flagged' : 'Flag as unclear'}
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
                  : 'No prompts need contributions in this category right now. Try switching modes.'}
              </p>
            </div>
          )}
        </div>

        {/* Right: coverage panel */}
        <div className="lg:pt-0">
          <CoveragePanel />
        </div>
      </div>
    </div>
  );
}
