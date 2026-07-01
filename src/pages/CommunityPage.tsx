import { useState } from 'react';

// -- Shared validation ---------------------------------------------------------
const BLOCKED_PATTERN =
  /(\bfuck|shit|damn|ass|bitch|cunt|nigger|faggot|hate|kill|die|rape|abuse|scam|xxx|porn|nude\b)/i;

const GIBBERISH_PATTERN = /^[^a-zA-Z\u0900-\u097F\s.,!?'-]{4,}$/;

function validate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'This field cannot be empty.';
  if (trimmed.length < 3) return 'Too short - please write at least 3 characters.';
  if (trimmed.length > 300) return 'Please keep this under 300 characters.';
  if (BLOCKED_PATTERN.test(trimmed)) return 'Please keep the language respectful.';
  if (GIBBERISH_PATTERN.test(trimmed)) return 'Looks like gibberish - please enter real text.';
  return null;
}

type CommunitySection = 'feedback' | 'improve' | 'upcoming';

function FeedbackSection() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(message);
    setError(err ?? '');
    if (err) return;

    const subject = encodeURIComponent('Thanjavur Marathi App - Feature Request / Feedback');
    const body = encodeURIComponent(message.trim());
    const mailto = `mailto:vasudhasamprati.k@gmail.com?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    setDone(true);
    setMessage('');
    setTimeout(() => setDone(false), 5000);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-peacock-100 bg-peacock-50 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-peacock-700 font-semibold">Your voice matters</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">Feedback &amp; Feature Requests</h3>
        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
          Have an idea, a recipe to add, a word that&apos;s missing, or a bug to report? Please tell us. Every message goes directly to the team.
        </p>
      </div>

      <form
        onSubmit={handleSend}
        className="rounded-2xl border border-orange-100 bg-white p-4 sm:p-5 space-y-4"
        noValidate
      >
        <p className="text-base font-semibold text-gray-900">What&apos;s on your mind? ✍️</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1" htmlFor="fb-type">
              Type of feedback
            </label>
            <div className="flex flex-wrap gap-2">
              {['Feature request', 'Missing word / recipe', 'Bug report', 'General feedback'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMessage((prev) => (prev ? prev : `[${tag}]\n`))}
                  className="px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-gray-900 hover:bg-orange-100 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1" htmlFor="fb-message">
              Your message <span className="text-saffron-500">*</span>
            </label>
            <textarea
              id="fb-message"
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError('');
              }}
              placeholder="Describe your idea, request, or issue clearly..."
              maxLength={300}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none resize-none transition-colors ${
                error ? 'border-rose-400' : 'border-orange-200 focus:border-saffron-500'
              }`}
            />
            <div className="flex justify-between mt-1">
              {error ? <p className="text-xs text-rose-500">{error}</p> : <span />}
              <p className="text-xs text-gray-900 text-right">{message.length}/300</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-saffron-500 text-white text-sm font-semibold hover:bg-saffron-600 active:bg-saffron-700 transition-colors"
          >
            Send feedback
          </button>
          <p className="text-xs text-gray-900">Opens your email app - your message goes to the team.</p>
        </div>

        {done && (
          <p className="text-sm text-peacock-700 font-medium animate-slide-up">
            ✓ Thank you! Your email client should have opened. We&apos;ll read every message.
          </p>
        )}
      </form>
    </div>
  );
}

function ImproveSection() {
  return (
    <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-6 py-10 text-center">
      <p className="text-4xl mb-3" aria-hidden="true">🛠️</p>
      <h3 className="text-xl font-bold text-gray-900">Help Improve</h3>
      <p className="text-sm text-gray-900 mt-2 max-w-md mx-auto leading-relaxed">
        Use the Contribute tab to add new words, sentence examples, and voice recordings.
        Every approved contribution improves translation quality and helps build a stronger
        Thanjavur Marathi dataset over time.
      </p>
      <p className="mt-4 text-xs text-gray-900">
        You can also share ideas in Feedback &amp; Requests to help shape what we build next.
      </p>
    </div>
  );
}

function UpcomingSection() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-peacock-100 bg-peacock-50 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-peacock-700 font-semibold">What&apos;s coming next</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">Upcoming Features</h3>
        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
          Here&apos;s a peek at what&apos;s being built for this app. Feedback and suggestions are always welcome.
        </p>
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-5 flex gap-4">
        <div className="text-3xl flex-shrink-0" aria-hidden="true">🎙️</div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-saffron-700 font-semibold mb-1">Voice input</p>
          <h4 className="text-base font-bold text-gray-900 leading-snug">
            Voice input for translation
          </h4>
          <p className="text-sm text-gray-900 mt-2 leading-relaxed">
            I will enable voice input so you can speak English and get Thanjavur Marathi translations directly in the app.
            This makes the translator faster and easier to use on mobile devices.
          </p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
            🚧 In planning
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-100 bg-white p-5 flex gap-4">
        <div className="text-3xl flex-shrink-0" aria-hidden="true">🧒</div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-saffron-700 font-semibold mb-1">Teach Gen-Alphas</p>
          <h4 className="text-base font-bold text-gray-900 leading-snug">
            A dedicated tab for young kids to learn Thanjavur Marathi
          </h4>
          <p className="text-sm text-gray-900 mt-2 leading-relaxed">
            Basic words, colours, and animals presented in a fun, visual way, plus audio book stories so that young
            children can hear and absorb the dialect naturally. The goal is to make the language accessible to the
            next generation, even if they&apos;ve never heard it at home.
          </p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
            🚧 In planning
          </span>
        </div>
      </div>
    </div>
  );
}

const SECTIONS: { id: CommunitySection; label: string; icon: string }[] = [
  { id: 'feedback', label: 'Feedback & Requests', icon: '✉️' },
  { id: 'improve', label: 'Help Me Improve', icon: '🛠️' },
  { id: 'upcoming', label: 'Upcoming Features', icon: '🔭' },
];

export function CommunityPage() {
  const [activeSection, setActiveSection] = useState<CommunitySection>('feedback');

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pb-28 sm:pb-12">
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Community sections">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={[
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all',
                isActive
                  ? 'bg-saffron-500 border-saffron-500 text-white shadow-md'
                  : 'bg-white border-orange-100 text-gray-900 hover:border-saffron-300 hover:text-saffron-700',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              <span aria-hidden="true">{section.icon}</span>
              {section.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6">
        {activeSection === 'feedback' && <FeedbackSection />}
        {activeSection === 'improve' && <ImproveSection />}
        {activeSection === 'upcoming' && <UpcomingSection />}
      </div>
    </div>
  );
}
