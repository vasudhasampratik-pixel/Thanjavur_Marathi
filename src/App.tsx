import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { AuthPage } from './components/AuthPage';
import { useAuth } from './contexts/AuthContext';
import { type Tab } from './components/tabConfig';
import { TranslatorBox } from './components/TranslatorBox';
import { FamilyTreePage } from './pages/FamilyTreePage';
import { EmotionsPage } from './pages/EmotionsPage';
import { CookBookPage } from './pages/CookBookPage';
import { CommunityPage } from './pages/CommunityPage';
import { VaraadPage } from './pages/VaraadPage';
import { ContributorPage } from './pages/ContributorPage';
import { ReviewerPage } from './pages/ReviewerPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import useBackgroundSync from './hooks/useBackgroundSync';
import dictionaryData from './data/dictionary.json';
import appDictionaryData from './data/app_dictionary.json';
import type { Dictionary, DictionaryEntry } from './types';

const dictionary = dictionaryData as unknown as Dictionary;

interface AppDictionaryVariant {
  tm_romanized?: string | null;
  tm_devanagari?: string | null;
  register?: string | null;
}

interface AppDictionarySentence {
  sentence_id?: string;
  domain?: string | null;
  english?: string;
  sentence_type?: string | null;
  variants?: Record<string, AppDictionaryVariant>;
}

function buildPhraseEntriesFromAppDictionary(raw: unknown): DictionaryEntry[] {
  if (!Array.isArray(raw)) return [];

  const phraseEntries: DictionaryEntry[] = [];

  for (const sentence of raw as AppDictionarySentence[]) {
    const english = sentence.english?.trim();
    if (!english) continue;

    const variants = sentence.variants ?? {};
    const preferredOrder = ['elder_respectful', 'young_female', 'young_male'];

    let selectedVariant: AppDictionaryVariant | undefined;
    for (const key of preferredOrder) {
      const candidate = variants[key];
      if (candidate?.tm_romanized || candidate?.tm_devanagari) {
        selectedVariant = candidate;
        break;
      }
    }

    if (!selectedVariant) {
      selectedVariant = Object.values(variants).find(
        variant => variant?.tm_romanized || variant?.tm_devanagari
      );
    }

    if (!selectedVariant?.tm_romanized && !selectedVariant?.tm_devanagari) {
      continue;
    }

    const notesParts = [sentence.domain, sentence.sentence_type, selectedVariant.register]
      .filter(Boolean)
      .map(value => String(value));

    phraseEntries.push({
      id: `app_${sentence.sentence_id || phraseEntries.length + 1}`,
      english,
      english_variants: [english.replace(/[?.!,]+$/g, '').trim()].filter(
        variant => variant.length > 0 && variant !== english
      ),
      tm_romanized: selectedVariant.tm_romanized ?? '',
      tm_devanagari: selectedVariant.tm_devanagari ?? '',
      category: 'misc',
      type: 'phrase',
      notes: notesParts.join(' · '),
      source_url: 'app_dictionary.json',
    });
  }

  return phraseEntries;
}

const appPhraseEntries = buildPhraseEntriesFromAppDictionary(appDictionaryData);
const combinedEntries = [...dictionary.entries, ...appPhraseEntries];

function App() {
  const { user, loading } = useAuth();
  useBackgroundSync();
  const [activeTab, setActiveTab] = useState<Tab>('translate');
  const [openFooterPanel, setOpenFooterPanel] = useState<'credits' | 'developer' | null>(null);
  const footerPanelRef = useRef<HTMLDivElement | null>(null);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        openFooterPanel &&
        footerPanelRef.current &&
        !footerPanelRef.current.contains(event.target as Node)
      ) {
        setOpenFooterPanel(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenFooterPanel(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openFooterPanel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
        <div className="rounded-3xl border border-orange-100 bg-white/95 px-8 py-10 text-center shadow-xl shadow-orange-100/40">
          <p className="text-lg font-semibold text-gray-900">Loading your experience…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  const activeFooterContent =
    openFooterPanel === 'credits'
      ? {
          title: 'Credits and Copyrights',
          body: (
            <div className="space-y-3 text-sm leading-6 text-gray-700">
              <p>
                Language data sourced from{' '}
                <a
                  href="https://tanjoremarathis.blogspot.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-peacock-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-peacock-800"
                >
                  tanjoremarathis.blogspot.com
                </a>{' '}
                by Pratibha.
              </p>
              <p>
                Cookbook sourced from{' '}
                <a
                  href="https://tanjoremarathirecipes.blogspot.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-peacock-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-peacock-800"
                >
                  tanjoremarathirecipes.blogspot.com
                </a>{' '}
                by Bhumiie Prahalaad and Indira Ramarao.
              </p>
              <p>
                TMD wedding rituals were sourced from the writings of Late Shri Krishna Murthy Sharma, Chennai.
              </p>
              <p className="text-gray-600">
                With deep gratitude to the people who documented, preserved, and shared this knowledge. This project stands on their care and generosity, and it is dedicated to honoring that work with respect.
              </p>
            </div>
          ),
        }
      : openFooterPanel === 'developer'
        ? {
            title: 'About the developer',
            body: (
              <div className="space-y-3 text-sm leading-6 text-gray-700">
                <p>
                  Hi, I am Vasudha S K, a software developer with a special love for frontend work. I often struggle to explain my native background because Thanjavur Marathi is a lesser-known dialect, and I do not fully understand Mumbai or Pune Marathi either. This project is my humble attempt to preserve the culture, language, and stories that shaped me.
                </p>
                <p>
                  If you would like to connect, please reach out on{' '}
                  <a
                    href="https://www.linkedin.com/in/vasudhask3105/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-peacock-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-peacock-800"
                  >
                    LinkedIn
                  </a>{' '}
                  or email me at{' '}
                  <a
                    href="mailto:vasudhasamprati.k@gmail.com"
                    className="font-medium text-peacock-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-peacock-800"
                  >
                    vasudhasamprati.k@gmail.com
                  </a>
                  . You can also follow my public Instagram account{' '}
                  <a
                    href="https://www.instagram.com/dhasuva"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-peacock-700 underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-peacock-800"
                  >
                    @dhasuva
                  </a>
                  .
                </p>
                <p className="text-gray-600">
                  I hope this space feels useful, respectful, and alive for anyone looking to learn, remember, or reconnect.
                </p>
              </div>
            ),
          }
        : null;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 pb-8 pt-4 sm:pt-6">
        {activeTab === 'contributor' && <ContributorPage onNavigate={setActiveTab} />
        {activeTab === 'translate' && (
          <TranslatorBox
            entries={combinedEntries}
            totalEntries={combinedEntries.length}
          />
        )}
        {activeTab === 'family-tree' && <FamilyTreePage />}
        {activeTab === 'bhaav' && <EmotionsPage />}
        {activeTab === 'cookbook' && <CookBookPage />}
        {activeTab === 'varaad' && <VaraadPage />}
        {activeTab === 'community' && <CommunityPage />}
        {activeTab === 'reviewer' && <ReviewerPage />}
        {activeTab === 'leaderboard' && <LeaderboardPage />}
      </main>

        <footer className="mt-6 border-t border-orange-100 bg-gradient-to-b from-white via-white to-orange-50/80 px-4 py-5">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-center">
            <div ref={footerPanelRef} className="relative inline-flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOpenFooterPanel(openFooterPanel === 'credits' ? null : 'credits')}
                aria-expanded={openFooterPanel === 'credits'}
                aria-controls="footer-popover"
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-orange-300 hover:text-peacock-700"
              >
                Credits and Copyrights
              </button>
              <button
                type="button"
                onClick={() => setOpenFooterPanel(openFooterPanel === 'developer' ? null : 'developer')}
                aria-expanded={openFooterPanel === 'developer'}
                aria-controls="footer-popover"
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 shadow-sm transition hover:border-orange-300 hover:text-peacock-700"
              >
                About the developer
              </button>

              {activeFooterContent && (
                <div
                  id="footer-popover"
                  role="dialog"
                  aria-label={activeFooterContent.title}
                  className="fixed inset-x-3 bottom-20 z-20 rounded-2xl border border-orange-100 bg-white p-4 text-left shadow-[0_18px_50px_rgba(0,0,0,0.12)] sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-3 sm:w-[24rem]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-peacock-600">
                        {activeFooterContent.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenFooterPanel(null)}
                      className="rounded-full px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-orange-50 hover:text-gray-800"
                      aria-label="Close popup"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3">{activeFooterContent.body}</div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            Thanjavur Marathi · {currentYear}
          </p>
        </footer>
    </div>
  );
}

export default App;
