import { useEffect, useRef, useState } from 'react';
import { TabBar } from './TabBar';
import { TAB_CONFIG, TAB_ORDER, ROLE_RESTRICTED_TABS, type Tab } from './tabConfig';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, signOutUser, roles } = useAuth();
  const sub = TAB_CONFIG[activeTab]?.subtitle ?? TAB_CONFIG.translate.subtitle;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const visibleTabs = TAB_ORDER.filter((tab) => {
    const required = ROLE_RESTRICTED_TABS[tab];
    if (!required) return true;
    return required.some((r) => roles.includes(r));
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const displayName = user?.displayName?.trim()  || '';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('') || 'A';

  return (
    <header>
      <div className="sticky top-0 z-40 border-b border-orange-100 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-2 py-3 sm:px-4">
          <div className="flex-1 min-w-0">
            <TabBar activeTab={activeTab} onTabChange={onTabChange} visibleTabs={visibleTabs} />
          </div>
          {user && (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                aria-expanded={isMenuOpen}
                aria-label="Open account menu"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-saffron-500 text-sm font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden sm:inline-flex">{displayName}</span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-orange-100 bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-peacock-600">Signed in as</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{displayName}</p>
                  {user.email && <p className="text-xs text-slate-500">{user.email}</p>}
                  {roles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {roles.map((role) => (
                        <span
                          key={role}
                          className="inline-block rounded-full bg-saffron-50 border border-saffron-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-saffron-700"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOutUser();
                    }}
                    className="mt-4 w-full rounded-2xl bg-saffron-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-saffron-600"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto relative max-w-6xl text-center py-5 px-4 sm:py-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-saffron-500 text-white text-3xl font-bold devanagari shadow-lg mb-3">
          ळ
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Thanjavur Marathi
        </h1>
        <p className="mt-1 text-sm sm:text-base text-peacock-600 font-medium transition-all duration-300">
          {sub.en}
        </p>
        <p className="mt-1 text-xs sm:text-sm text-gray-900 max-w-2xl mx-auto transition-all duration-300">
          {sub.hint}
        </p>
      </div>
    </header>
  );
}
