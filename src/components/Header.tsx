import { TabBar } from './TabBar';
import { TAB_CONFIG, type Tab } from './tabConfig';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const sub = TAB_CONFIG[activeTab]?.subtitle ?? TAB_CONFIG.translate.subtitle;

  return (
    <header>
      <div className="sticky top-0 z-40 border-b border-orange-100 bg-cream/95 backdrop-blur">
        <TabBar activeTab={activeTab} onTabChange={onTabChange} />
      </div>
      <div className="mx-auto max-w-6xl text-center py-5 px-4 sm:py-6">
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
