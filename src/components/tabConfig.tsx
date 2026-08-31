export type Tab = 'contributor' | 'translate' | 'legacy' | 'family-tree' | 'bhaav' | 'cookbook' | 'varaad' | 'community' | 'reviewer' | 'leaderboard';

export interface TabConfig {
  label: string;
  subtitle: {
    en: string;
    hint: string;
  };
  icon: React.ReactNode;
  iconActive: React.ReactNode;
}

export const TAB_ORDER: Tab[] = [
  'contributor',
  'leaderboard',
  'translate',
  'legacy',
];

export const LEGACY_TAB_ORDER: Tab[] = ['family-tree', 'bhaav', 'cookbook', 'varaad'];

// Tabs that are only visible to specific roles (checked in Header)
export const ROLE_RESTRICTED_TABS: Partial<Record<Tab, string[]>> = {
  reviewer: ['reviewer', 'admin'],
};

export const TAB_CONFIG: Record<Tab, TabConfig> = {
  contributor: {
    label: 'Contribute',
    subtitle: {
      en: 'Help grow the Thanjavur Marathi dataset',
      hint: 'Contribute Marathi words and sentences to help train and improve the language model',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726Z" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
      </svg>
    ),
  },
  translate: {
    label: 'Translate',
    subtitle: {
      en: 'English → Thanjavur Marathi',
      hint: 'Preserving the Dakshini Marathi dialect spoken by the Deshastha Marathis of Thanjavur, Tamil Nadu since 1673',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M10.5 3a7.5 7.5 0 1 0 4.55 13.61l4.17 4.18a1 1 0 0 0 1.41-1.41l-4.17-4.18A7.5 7.5 0 0 0 10.5 3Zm-5.5 7.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z" />
      </svg>
    ),
  },
  legacy: {
    label: 'Our Legacy',
    subtitle: {
      en: 'Our Legacy - Culture, Family, and Tradition',
      hint: 'Explore the family tree, emotions, cookbook, and wedding traditions of Thanjavur Marathi',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v5c0 4.5 3.2 7.5 8 9 4.8-1.5 8-4.5 8-9V7l-8-4Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5 3.5 6.75v5.1c0 4.7 3.35 8.1 8.5 9.65 5.15-1.55 8.5-4.95 8.5-9.65v-5.1L12 2.5Zm-1.2 13.1-3.05-3.05 1.4-1.4 1.65 1.65 4.25-4.25 1.4 1.4-5.65 5.65Z" />
      </svg>
    ),
  },
  'family-tree': {
    label: 'Family Tree',
    subtitle: {
      en: 'Naati - Explore Kinship Relations',
      hint: 'Thanjavur Marathi has one of the richest kinship vocabularies of any Indian language',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm-6 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm12 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM12 6v3M6 14v3a2 2 0 1 0 4 0v-3M14 14v3a2 2 0 1 0 4 0v-3M9 10h6" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="4" r="2" />
        <circle cx="6" cy="12" r="2" />
        <circle cx="18" cy="12" r="2" />
        <circle cx="6" cy="20" r="2" />
        <circle cx="18" cy="20" r="2" />
        <path d="M12 6v5M6 14v4M18 14v4M9 11H6M15 11h3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  bhaav: {
    label: 'Bhavana',
    subtitle: {
      en: 'Bhavana - Emotions and Character',
      hint: 'Thanjavur Marathi captures the full spectrum of human feeling',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2Zm-2.25 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm4.5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-5.5 3.5s.5 2 3.25 2 3.25-2 3.25-2" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2Zm-2.25 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm4.5 0a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-5.5 3.5s.5 2 3.25 2 3.25-2 3.25-2" />
      </svg>
    ),
  },
  cookbook: {
    label: 'CookBook',
    subtitle: {
      en: 'CookBook - The Living Thali',
      hint: 'Explore authentic recipes by ingredient and cook one step at a time',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v18H7.5A2.5 2.5 0 0 1 5 18.5v-13Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 4a3 3 0 0 1 3-3h10v20H9a3 3 0 0 1-3-3V4Zm4 3a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6Zm0 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6Zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4Z" />
      </svg>
    ),
  },
  varaad: {
    label: 'Varaad',
    subtitle: {
      en: 'Varaad - Wedding Ceremonies and Tradition',
      hint: 'Tanjore Marathi Desastha Rituals · Madhwa & Smarta traditions',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 3-4 4.5-7 5 .5 5 3 8.5 7 10 4-1.5 6.5-5 7-10-3-.5-5.5-2-7-5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C10.4 5.2 7.8 6.8 4.5 7.3c.5 5.2 3.1 9 7.5 10.7 4.4-1.7 7-5.5 7.5-10.7C16.2 6.8 13.6 5.2 12 2Z" opacity="0.85" />
        <path d="M9.5 12.5l1.8 1.8 3.5-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  community: {
    label: 'Community',
    subtitle: {
      en: 'Community - Connect and Contribute',
      hint: 'Find fellow Thanjavur Marathi speakers, share feedback, and help grow this living archive',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 0 0-4-4h-1M9 20H4v-2a4 4 0 0 1 4-4h1m4-4a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm6-4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0H4Zm17-5a3 3 0 1 0-4-4.47A5.97 5.97 0 0 1 18 15h1.5A2.5 2.5 0 0 1 22 17.5V19h-3v1h4v-2.5A4.5 4.5 0 0 0 19 15ZM5 15a5.97 5.97 0 0 1 1-3.47A3 3 0 1 0 2 15H3.5A2.5 2.5 0 0 0 1 17.5V19h3v1H0v-2.5A4.5 4.5 0 0 1 5 15Z" />
      </svg>
    ),
  },
  reviewer: {
    label: 'Review',
    subtitle: {
      en: 'Review submitted contributions',
      hint: 'Approve or reject contributions submitted by contributors to maintain data quality',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" />
      </svg>
    ),
  },
  leaderboard: {
    label: 'Leaderboard',
    subtitle: {
      en: 'Top contributors keeping the language alive',
      hint: 'See who has contributed the most to the Thanjavur Marathi dataset',
    },
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-8-5v5m4-9v9M3 20h18" />
      </svg>
    ),
    iconActive: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75c-1.036 0-1.875-.84-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75C3.84 21.75 3 20.91 3 19.875v-6.75Z" />
      </svg>
    ),
  },
};
