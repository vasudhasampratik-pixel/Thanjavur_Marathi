import { useEffect, useRef, useState } from 'react';
import { TAB_CONFIG, TAB_ORDER, type Tab } from './tabConfig';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateScrollUI = () => {
      const canScroll = el.scrollWidth - el.clientWidth > 8;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;

      setShowRightFade(canScroll && !atEnd);
      setShowSwipeHint(canScroll && el.scrollLeft < 12);
    };

    updateScrollUI();

    el.addEventListener('scroll', updateScrollUI, { passive: true });
    window.addEventListener('resize', updateScrollUI);

    return () => {
      el.removeEventListener('scroll', updateScrollUI);
      window.removeEventListener('resize', updateScrollUI);
    };
  }, []);

  return (
    <nav className="relative border-t border-orange-100 bg-white/75" aria-label="Main navigation">
      <div className="mx-auto max-w-6xl px-2 sm:px-4">
        <div
          ref={scrollerRef}
          className="flex items-center gap-2 overflow-x-auto py-2 pr-10 sm:pr-2"
        >
          {TAB_ORDER.map((tabId) => {
            const tab = TAB_CONFIG[tabId];
            const isActive = activeTab === tabId;
            return (
              <button
                key={tabId}
                onClick={() => onTabChange(tabId)}
                className={[
                  'shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 snap-start',
                  isActive
                    ? 'bg-saffron-500 text-white shadow-md'
                    : 'text-gray-900 hover:text-saffron-600 hover:bg-saffron-50',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive ? tab.iconActive : tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showRightFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cream to-transparent sm:hidden" aria-hidden="true" />
      )}

      {showSwipeHint && (
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-orange-200 bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-700 shadow-sm sm:hidden" aria-hidden="true">
          Swipe for more
        </div>
      )}
    </nav>
  );
}
