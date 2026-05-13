export type Tab = 'translate' | 'family-tree' | 'bhaav' | 'cookbook' | 'varaad' | 'community';

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
  'translate',
  'family-tree',
  'bhaav',
  'cookbook',
  'varaad',
  'community',
];

export const TAB_CONFIG: Record<Tab, TabConfig> = {
  translate: {
    label: 'Translate',
    subtitle: {
      en: 'English -> Thanjavur Marathi',
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
};
