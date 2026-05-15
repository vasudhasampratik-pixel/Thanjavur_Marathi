import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
type CommunitySection = 'network' | 'feedback' | 'improve' | 'upcoming';

type CardStyle = 'envelope' | 'postcard' | 'recipe-scrap' | 'stamp';

type SpeakerTag =
  | 'fluent speaker'
  | 'learning'
  | 'from this region'
  | 'can help with pronunciation'
  | 'knows recipes';

interface NetworkPost {
  id: string;
  name: string;
  note: string;
  location: string;
  tags: SpeakerTag[];
  cardStyle: CardStyle;
  timestamp: Date;
}

// ── Guardrail helpers ─────────────────────────────────────────────────────────
const BLOCKED_PATTERN =
  /(\bfuck|shit|damn|ass|bitch|cunt|nigger|faggot|hate|kill|die|rape|abuse|scam|xxx|porn|nude\b)/i;

const GIBBERISH_PATTERN = /^[^a-zA-Z\u0900-\u097F\s.,!?'-]{4,}$/;

function validate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'This field cannot be empty.';
  if (trimmed.length < 3) return 'Too short — please write at least 3 characters.';
  if (trimmed.length > 300) return 'Please keep this under 300 characters.';
  if (BLOCKED_PATTERN.test(trimmed)) return 'Please keep the language respectful.';
  if (GIBBERISH_PATTERN.test(trimmed)) return 'Looks like gibberish — please enter real text.';
  return null;
}

function validateName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter your name.';
  if (trimmed.length < 2) return 'Name is too short.';
  if (trimmed.length > 60) return 'Name must be under 60 characters.';
  if (BLOCKED_PATTERN.test(trimmed)) return 'Please use your real name.';
  if (/^[^a-zA-Z]/.test(trimmed)) return 'Name must start with a letter.';
  return null;
}

// ── Card style derivation ─────────────────────────────────────────────────────
function deriveCardStyle(tags: SpeakerTag[]): CardStyle {
  if (tags.includes('knows recipes')) return 'recipe-scrap';
  if (tags.includes('fluent speaker')) return 'stamp';
  if (tags.includes('learning')) return 'envelope';
  return 'postcard';
}

// ── Deterministic rotation from id ───────────────────────────────────────────
function cardRotation(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return ((Math.abs(hash) % 11) - 5); // -5 to +5 deg
}

// ── Avatar helpers ────────────────────────────────────────────────────────────
function avatarInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}
const AVATAR_PALETTE = ['#FF6B35', '#1A936F', '#e85420', '#7c3aed', '#b45309', '#0e7490'];
function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ── Time helper ───────────────────────────────────────────────────────────────
function formatRelative(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Tag meta ──────────────────────────────────────────────────────────────────
const ALL_TAGS: SpeakerTag[] = [
  'fluent speaker',
  'learning',
  'from this region',
  'can help with pronunciation',
  'knows recipes',
];

const TAG_ICON: Record<SpeakerTag, string> = {
  'fluent speaker': '🗣️',
  'learning': '📖',
  'from this region': '🏡',
  'can help with pronunciation': '🎙️',
  'knows recipes': '🍲',
};

// ── Card style visuals ────────────────────────────────────────────────────────
const CARD_STYLE_META: Record<CardStyle, { bg: string; border: string; icon: string; label: string }> = {
  envelope:      { bg: 'bg-white',       border: 'border-gray-200',   icon: '✉️',  label: 'New member' },
  postcard:      { bg: 'bg-amber-50',    border: 'border-amber-200',  icon: '📬',  label: 'Open to chat' },
  'recipe-scrap':{ bg: 'bg-orange-50',   border: 'border-orange-300', icon: '🍲',  label: 'Recipe keeper' },
  stamp:         { bg: 'bg-peacock-50',  border: 'border-peacock-200',icon: '🔏',  label: 'Fluent speaker' },
};

// ── Seed posts ────────────────────────────────────────────────────────────────
const SEED_POSTS: NetworkPost[] = [
  {
    id: 'seed-1',
    name: 'Meena Ramaswamy',
    note: 'Grew up speaking Tanjavur Marathi at home in Chennai. Lovely to find this space!',
    location: 'Chennai, India',
    tags: ['fluent speaker', 'from this region'],
    cardStyle: 'stamp',
    timestamp: new Date('2026-04-10T09:00:00'),
  },
  {
    id: 'seed-2',
    name: 'Vikram Bhonsale',
    note: 'My grandparents spoke this dialect fluently. I am trying to learn more words every day.',
    location: 'Pune, India',
    tags: ['learning'],
    cardStyle: 'envelope',
    timestamp: new Date('2026-04-18T14:30:00'),
  },
  {
    id: 'seed-3',
    name: 'Anuradha Shastri',
    note: 'Settled in Singapore but our family still uses these words at home. Also love the recipes!',
    location: 'Singapore',
    tags: ['knows recipes', 'can help with pronunciation'],
    cardStyle: 'recipe-scrap',
    timestamp: new Date('2026-05-01T08:15:00'),
  },
  {
    id: 'seed-4',
    name: 'Rohan Kulkarni',
    note: 'Researcher based in London. Happy to connect with anyone studying this dialect.',
    location: 'London, UK',
    tags: ['learning', 'can help with pronunciation'],
    cardStyle: 'postcard',
    timestamp: new Date('2026-05-05T11:00:00'),
  },
];

// ── Table card ────────────────────────────────────────────────────────────────
function TableCard({ post, isOpen, onToggle }: { post: NetworkPost; isOpen: boolean; onToggle: () => void }) {
  const meta = CARD_STYLE_META[post.cardStyle];
  const rot = cardRotation(post.id);

  return (
    <button
      onClick={onToggle}
      style={{ transform: isOpen ? 'rotate(0deg) scale(1.02)' : `rotate(${rot}deg)` }}
      className={[
        'relative text-left w-full rounded-2xl border-2 shadow-md transition-all duration-300',
        meta.bg,
        meta.border,
        isOpen ? 'shadow-xl z-10 ring-2 ring-saffron-400 ring-offset-2' : 'md:hover:scale-105 md:hover:shadow-lg md:hover:z-10',
      ].join(' ')}
      aria-expanded={isOpen}
      aria-label={`${post.name}'s note — ${isOpen ? 'tap to close' : 'tap to open'}`}
    >
      {/* Card style ribbon */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-2 pb-0">
        <span className="text-xs text-gray-900">{meta.icon} {meta.label}</span>
        <span className="text-xs text-gray-900">{formatRelative(post.timestamp)}</span>
      </div>

      <div className="pt-7 px-3 pb-3">
        {/* Avatar + name row */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none"
            style={{ backgroundColor: avatarBg(post.name) }}
          >
            {avatarInitials(post.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{post.name}</p>
            <p className="text-xs text-peacock-700 truncate">📍 {post.location}</p>
          </div>
        </div>

        {/* Note — always visible but truncated when closed */}
        <p className={`text-xs text-gray-900 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
          {post.note}
        </p>

        {/* Tags — only when open */}
        {isOpen && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white border border-orange-200 text-xs text-gray-900"
              >
                {TAG_ICON[tag]} {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tap hint when closed */}
        {!isOpen && (
          <p className="mt-2 text-xs text-saffron-600 font-medium">Tap to read →</p>
        )}
      </div>
    </button>
  );
}

// ── Sub-sections ──────────────────────────────────────────────────────────────

function NetworkSection() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<NetworkPost[]>(SEED_POSTS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  // form state
  const [name, setName] = useState(user?.displayName || '');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [selectedTags, setSelectedTags] = useState<SpeakerTag[]>([]);
  const [nameError, setNameError] = useState('');
  const [noteError, setNoteError] = useState('');
  const [pinned, setPinned] = useState(false);

  function toggleTag(tag: SpeakerTag) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nameErr = validateName(name);
    const noteErr = validate(note);
    setNameError(nameErr ?? '');
    setNoteError(noteErr ?? '');
    if (nameErr || noteErr) return;

    const newPost: NetworkPost = {
      id: `post-${Date.now()}`,
      name: name.trim(),
      note: note.trim(),
      location: location.trim() || 'Somewhere in the world',
      tags: selectedTags,
      cardStyle: deriveCardStyle(selectedTags),
      timestamp: new Date(),
    };

    setPosts(prev => [newPost, ...prev]);
    setName(''); setLocation(''); setNote(''); setSelectedTags([]);
    setComposing(false);
    setPinned(true);
    setTimeout(() => setPinned(false), 4000);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-peacock-700 font-semibold">Letters Across the Table</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">Community Network</h3>
          <p className="text-sm text-gray-900 mt-1 max-w-lg leading-relaxed">
            Every card below is a real person who speaks, learns, or cherishes Thanjavur Marathi.
            Tap a card to read their note. Add yours and take a seat at the table.
          </p>
        </div>
        <button
          onClick={() => setComposing(v => !v)}
          className="flex-shrink-0 px-4 py-2.5 rounded-full bg-saffron-500 text-white text-sm font-semibold hover:bg-saffron-600 active:bg-saffron-700 transition-colors shadow"
        >
          {composing ? '✕ Close' : '✉️ Write your note'}
        </button>
      </div>

      {pinned && (
        <p className="text-sm text-peacock-700 font-medium animate-slide-up">
          📌 Pinned! Your note is now on the table.
        </p>
      )}

      {/* Compose form */}
      {composing && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border-2 border-saffron-300 bg-amber-50 p-5 shadow-lg space-y-4 animate-slide-up"
        >
          {/* Envelope flap decoration */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl" aria-hidden="true">✉️</span>
            <p className="text-base font-bold text-gray-900">Write your postcard</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1" htmlFor="net-name">
                Your name <span className="text-saffron-500">*</span>
              </label>
              <input
                id="net-name"
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(''); }}
                placeholder="e.g. Meena Bhonsale"
                maxLength={60}
                className={`w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none transition-colors ${nameError ? 'border-rose-400' : 'border-orange-200 focus:border-saffron-500'}`}
              />
              {nameError && <p className="text-xs text-rose-500 mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-900 mb-1" htmlFor="net-location">
                Location <span className="text-gray-900 font-normal">(optional)</span>
              </label>
              <input
                id="net-location"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Melbourne, Australia"
                maxLength={80}
                className="w-full rounded-xl border-2 border-orange-200 bg-white focus:border-saffron-500 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1" htmlFor="net-note">
              Your note <span className="text-saffron-500">*</span>
            </label>
            <textarea
              id="net-note"
              rows={3}
              value={note}
              onChange={e => { setNote(e.target.value); setNoteError(''); }}
              placeholder="e.g. My grandmother sang songs in this dialect. Looking to connect with others who remember."
              maxLength={300}
              className={`w-full rounded-xl border-2 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none resize-none transition-colors ${noteError ? 'border-rose-400' : 'border-orange-200 focus:border-saffron-500'}`}
            />
            <div className="flex justify-between mt-1">
              {noteError ? <p className="text-xs text-rose-500">{noteError}</p> : <span />}
              <p className="text-xs text-gray-900">{note.length}/300</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-900 mb-2">Tags <span className="text-gray-900 font-normal">(pick all that apply)</span></p>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                      active
                        ? 'bg-saffron-500 border-saffron-500 text-white'
                        : 'bg-white border-orange-200 text-gray-900 hover:border-saffron-400',
                    ].join(' ')}
                  >
                    {TAG_ICON[tag]} {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-saffron-500 text-white text-sm font-semibold hover:bg-saffron-600 active:bg-saffron-700 transition-colors shadow"
            >
              🔏 Seal and pin
            </button>
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="px-4 py-2.5 rounded-full border border-orange-200 text-sm text-gray-900 hover:bg-orange-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-900">
        {(Object.entries(CARD_STYLE_META) as [CardStyle, typeof CARD_STYLE_META[CardStyle]][]).map(([, m]) => (
          <span key={m.label} className="flex items-center gap-1">{m.icon} {m.label}</span>
        ))}
      </div>

      {/* Community table surface */}
      <div
        className="rounded-3xl border border-orange-100 p-5 sm:p-6"
        style={{
          background: 'radial-gradient(ellipse at 60% 40%, #FFF7ED 60%, #FDF8F0 100%)',
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <p className="text-xs text-gray-900 mb-4 uppercase tracking-widest text-center">
          {posts.length} {posts.length === 1 ? 'note' : 'notes'} on the table — tap to open
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {posts.map(post => (
            <TableCard
              key={post.id}
              post={post}
              isOpen={openId === post.id}
              onToggle={() => setOpenId(openId === post.id ? null : post.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeedbackSection() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const err = validate(message);
    setError(err ?? '');
    if (err) return;

    // Compose a mailto link and open it
    const subject = encodeURIComponent('Thanjavur Marathi App — Feature Request / Feedback');
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
        <h3 className="text-2xl font-bold text-gray-900 mt-1">Feedback & Feature Requests</h3>
        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
          Have an idea, a recipe to add, a word that's missing, or a bug to report? Please tell us. Every message goes directly to the team.
        </p>
      </div>

      <form
        onSubmit={handleSend}
        className="rounded-2xl border border-orange-100 bg-white p-4 sm:p-5 space-y-4"
        noValidate
      >
        <p className="text-base font-semibold text-gray-900">What's on your mind? ✍️</p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-1" htmlFor="fb-type">
              Type of feedback
            </label>
            <div className="flex flex-wrap gap-2">
              {['Feature request', 'Missing word / recipe', 'Bug report', 'General feedback'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMessage(prev => prev ? prev : `[${tag}]\n`)}
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
              onChange={e => { setMessage(e.target.value); setError(''); }}
              placeholder="Describe your idea, request, or issue clearly..."
              maxLength={300}
              className={`w-full rounded-xl border-2 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-900 focus:outline-none resize-none transition-colors ${error ? 'border-rose-400' : 'border-orange-200 focus:border-saffron-500'}`}
            />
            <div className="flex justify-between mt-1">
              {error
                ? <p className="text-xs text-rose-500">{error}</p>
                : <span />}
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
          <p className="text-xs text-gray-900">Opens your email app — your message goes to the team.</p>
        </div>

        {done && (
          <p className="text-sm text-peacock-700 font-medium animate-slide-up">
            ✓ Thank you! Your email client should have opened. We'll read every message.
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
      <h3 className="text-xl font-bold text-gray-900">Help Me Improve</h3>
      <p className="text-sm text-gray-900 mt-2 max-w-md mx-auto leading-relaxed">
        To contribute: go to the Translate tab, search a word or phrase, review the result and
        submit the corrected input or better wording. Each correction helps train and improve the Thanjavur Marathi
        dataset over time.
      </p>
      <p className="mt-4 text-xs text-gray-900">
        This project is still in a very nascent stage and needs polishing, so your support is essential.
      </p>
    </div>
  );
}

function UpcomingSection() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-peacock-100 bg-peacock-50 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.18em] text-peacock-700 font-semibold">What's coming next</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">Upcoming Features</h3>
        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
          Here's a peek at what's being built for this app. Feedback and suggestions are always welcome.
        </p>
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
            next generation, even if they've never heard it at home.
          </p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200">
            🚧 In planning
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Nav pills ─────────────────────────────────────────────────────────────────
const SECTIONS: { id: CommunitySection; label: string; icon: string }[] = [
  { id: 'network', label: 'Network', icon: '🌐' },
  { id: 'feedback', label: 'Feedback & Requests', icon: '✉️' },
  { id: 'improve', label: 'Help Me Improve', icon: '🛠️' },
  { id: 'upcoming', label: 'Upcoming Features', icon: '🔭' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export function CommunityPage() {
  const [activeSection, setActiveSection] = useState<CommunitySection>('network');

  return (
    <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pb-28 sm:pb-12">


      {/* Section nav */}
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Community sections">
        {SECTIONS.map(section => {
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

      {/* Section content */}
      <div className="mt-6">
        {activeSection === 'network' && <NetworkSection />}
        {activeSection === 'feedback' && <FeedbackSection />}
        {activeSection === 'improve' && <ImproveSection />}
        {activeSection === 'upcoming' && <UpcomingSection />}
      </div>
    </div>
  );
}
