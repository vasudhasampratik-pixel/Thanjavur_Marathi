export type RelationGroup =
  | 'you'
  | 'spouse'
  | 'core'
  | 'paternal'
  | 'maternal'
  | 'siblings'
  | 'spouse_side'
  | 'inlaws'
  | 'childrens_inlaw'
  | 'step';

export interface RelationNode {
  id: string;
  label_roman: string;
  label_devanagari: string;
  english: string;
  group: RelationGroup;
  notes?: string;
  x: number;
  y: number;
}

export interface RelationEdge {
  from: string;
  to: string;
  type: 'blood' | 'marriage' | 'step' | 'sibling';
}

// Canvas: 1300 × 780  •  You @ (550, 410)  •  Spouse @ (760, 410)
export const relationNodes: RelationNode[] = [
  // ── YOU ───────────────────────────────────────────────────────────
  {
    id: 'you',
    label_roman: 'Tuumhi / Mee',
    label_devanagari: 'तुम्ही / मी',
    english: 'You',
    group: 'you',
    notes: 'The reference point for all relations below.',
    x: 550,
    y: 410,
  },

  // ── SPOUSE ────────────────────────────────────────────────────────
  {
    id: 'spouse',
    label_roman: 'Patni / Pati',
    label_devanagari: 'पत्नी / पती',
    english: 'Spouse',
    group: 'spouse',
    notes: 'Your husband or wife. Spouse relations branch out to the right.',
    x: 760,
    y: 410,
  },

  // ── CORE — Parents ────────────────────────────────────────────────
  {
    id: 'bapa',
    label_roman: 'Bapa',
    label_devanagari: 'बप्पा',
    english: 'Father',
    group: 'core',
    x: 430,
    y: 215,
  },
  {
    id: 'amma',
    label_roman: 'Amma / Aayi',
    label_devanagari: 'अम्मा / आई',
    english: 'Mother',
    group: 'core',
    x: 570,
    y: 215,
  },
  {
    id: 'vadil',
    label_roman: 'Vadil',
    label_devanagari: 'वडिल',
    english: "Father's older brother (also used for Father)",
    group: 'core',
    notes: "Refers specifically to the father's older brother, or can be used respectfully for one's own father.",
    x: 295,
    y: 215,
  },

  // ── PATERNAL — Father's side ──────────────────────────────────────
  {
    id: 'kaka',
    label_roman: 'Kaka / Chultha',
    label_devanagari: 'काका / चुल्था',
    english: "Father's brother — Paternal Uncle",
    group: 'paternal',
    notes: 'Kaka is the common word; Chultha is the more specific Thanjavur Marathi term.',
    x: 185,
    y: 295,
  },
  {
    id: 'chulthi',
    label_roman: 'Chulthi',
    label_devanagari: 'चुल्थी',
    english: "Paternal Uncle's wife (Kaki)",
    group: 'paternal',
    x: 75,
    y: 370,
  },
  {
    id: 'atya',
    label_roman: 'Atya',
    label_devanagari: 'अत्या',
    english: "Father's sister — Paternal Aunt",
    group: 'paternal',
    x: 75,
    y: 215,
  },
  {
    id: 'chulath_bhau',
    label_roman: 'Chulath Bhau',
    label_devanagari: 'चुलत भाऊ',
    english: "Paternal Uncle's son — Male Cousin (paternal)",
    group: 'paternal',
    x: 55,
    y: 465,
  },
  {
    id: 'chulath_bahin',
    label_roman: 'Chulath Bahin',
    label_devanagari: 'चुलत बहिन',
    english: "Paternal Uncle's daughter — Female Cousin (paternal)",
    group: 'paternal',
    x: 55,
    y: 555,
  },

  // ── MATERNAL — Mother's side ──────────────────────────────────────
  {
    id: 'maushi',
    label_roman: 'Maushi',
    label_devanagari: 'मौषी',
    english: "Mother's sister — Maternal Aunt",
    group: 'maternal',
    x: 680,
    y: 215,
  },
  {
    id: 'mama',
    label_roman: 'Mama',
    label_devanagari: 'मामा',
    english: "Mother's brother — Maternal Uncle",
    group: 'maternal',
    x: 820,
    y: 175,
  },
  {
    id: 'mami',
    label_roman: 'Mami',
    label_devanagari: 'मामी',
    english: "Maternal Uncle's wife",
    group: 'maternal',
    x: 940,
    y: 235,
  },
  {
    id: 'maavas_bhau',
    label_roman: 'Maavas Bhau',
    label_devanagari: 'मावस भाऊ',
    english: "Maternal Aunt's son — Male Cousin (maternal)",
    group: 'maternal',
    x: 1040,
    y: 330,
  },
  {
    id: 'maavas_bahin',
    label_roman: 'Maavas Bahin',
    label_devanagari: 'मावस बहिन',
    english: "Maternal Aunt's daughter — Female Cousin (maternal)",
    group: 'maternal',
    x: 1040,
    y: 420,
  },

  // ── SIBLINGS ──────────────────────────────────────────────────────
  {
    id: 'bhau',
    label_roman: 'Bhau',
    label_devanagari: 'भाऊ',
    english: 'Brother',
    group: 'siblings',
    x: 340,
    y: 410,
  },
  {
    id: 'bahin',
    label_roman: 'Bahin',
    label_devanagari: 'बहिन',
    english: 'Sister',
    group: 'siblings',
    x: 340,
    y: 510,
  },
  {
    id: 'vahini',
    label_roman: 'Vahini / Bhauja',
    label_devanagari: 'वहिनी / भौज',
    english: "Brother's wife — Sister-in-law",
    group: 'siblings',
    notes: 'Vahini is the general sister-in-law; Bhauja specifically means brother\'s wife.',
    x: 200,
    y: 510,
  },
  {
    id: 'bhaoji',
    label_roman: 'Bhaoji',
    label_devanagari: 'भओजी',
    english: "Elder sister's husband; or husband's older brother",
    group: 'siblings',
    notes: 'Used for an elder brother-in-law figure — either your elder sister\'s husband or your husband\'s older brother.',
    x: 200,
    y: 410,
  },

  // ── SPOUSE'S SIDE ─────────────────────────────────────────────────
  {
    id: 'vahinak',
    label_roman: 'Vahinak',
    label_devanagari: 'वहिनक',
    english: "Husband's older sister",
    group: 'spouse_side',
    x: 870,
    y: 330,
  },
  {
    id: 'daer',
    label_roman: 'Daer',
    label_devanagari: 'देर',
    english: "Husband's younger brother",
    group: 'spouse_side',
    x: 870,
    y: 490,
  },
  {
    id: 'nanand',
    label_roman: 'Nanand',
    label_devanagari: 'ननंद',
    english: "Husband's younger sister",
    group: 'spouse_side',
    x: 990,
    y: 490,
  },
  {
    id: 'saadu',
    label_roman: 'Saadu',
    label_devanagari: '—',
    english: "Co-brother (wife's sister's husband)",
    group: 'spouse_side',
    notes: "A co-brother — the husband of one's wife's sister. A relationship unique enough to need its own word.",
    x: 990,
    y: 380,
  },
  {
    id: 'mevanna',
    label_roman: 'Mevanna',
    label_devanagari: 'मेवांना',
    english: "Wife's brother",
    group: 'spouse_side',
    x: 1100,
    y: 430,
  },
  {
    id: 'mhevani',
    label_roman: 'Mhevani',
    label_devanagari: 'म्हेवणी',
    english: "Wife's sister",
    group: 'spouse_side',
    x: 1100,
    y: 520,
  },

  // ── IN-LAWS ───────────────────────────────────────────────────────
  {
    id: 'sasra',
    label_roman: 'Sasra',
    label_devanagari: 'साश्रा',
    english: 'Father-in-law',
    group: 'inlaws',
    x: 820,
    y: 330,
  },
  {
    id: 'saasu',
    label_roman: 'Saasu',
    label_devanagari: 'सासू',
    english: 'Mother-in-law',
    group: 'inlaws',
    x: 950,
    y: 295,
  },
  {
    id: 'kaaksasra',
    label_roman: 'Kaaksasra / Chulathe Sasra',
    label_devanagari: 'काक्सासरा / चुलत सासरा',
    english: "Father-in-law's brother",
    group: 'inlaws',
    x: 820,
    y: 220,
  },
  {
    id: 'kaak_saasu',
    label_roman: 'Kaak Saasu / Chulath Saasu',
    label_devanagari: 'काक्सासू / चुलत सासू',
    english: "Father-in-law's brother's wife",
    group: 'inlaws',
    x: 960,
    y: 200,
  },

  // ── CHILDREN'S IN-LAWS ────────────────────────────────────────────
  {
    id: 'vyaahin',
    label_roman: 'Vyaahin',
    label_devanagari: 'व्याहीं',
    english: "One's son's or daughter's father-in-law",
    group: 'childrens_inlaw',
    notes: "The parent of your child's spouse — a relation with no English equivalent.",
    x: 470,
    y: 610,
  },
  {
    id: 'vihinn',
    label_roman: 'Vihinn',
    label_devanagari: 'विहिन्न',
    english: "One's son's or daughter's mother-in-law",
    group: 'childrens_inlaw',
    x: 620,
    y: 610,
  },

  // ── STEP RELATIONS ────────────────────────────────────────────────
  {
    id: 'saavatr',
    label_roman: 'Saavatr',
    label_devanagari: 'सावत्र',
    english: 'Step (prefix for all step relations)',
    group: 'step',
    notes: 'Used as a prefix to any relation word to indicate "step". e.g. Saavatr Maai = Step Mother.',
    x: 310,
    y: 610,
  },
  {
    id: 'saavatr_maai',
    label_roman: 'Saavatr Maai',
    label_devanagari: 'सावत्र माई',
    english: 'Step Mother',
    group: 'step',
    x: 195,
    y: 700,
  },
  {
    id: 'saavatr_baap',
    label_roman: 'Saavatr Baap',
    label_devanagari: 'सावत्र बाप',
    english: 'Step Father',
    group: 'step',
    x: 340,
    y: 700,
  },
  {
    id: 'sakka',
    label_roman: 'Sakka',
    label_devanagari: 'सक्का',
    english: "One's own (not step) relative",
    group: 'step',
    notes: "Sakka is used to clarify that a relation is a blood/own relative, not a step relation. e.g. Sakka Bhau = one's own brother.",
    x: 460,
    y: 700,
  },
];

export const relationEdges: RelationEdge[] = [
  // Parents → You
  { from: 'bapa', to: 'you', type: 'blood' },
  { from: 'amma', to: 'you', type: 'blood' },

  // Vadil is Bapa's older brother (or Bapa himself)
  { from: 'vadil', to: 'bapa', type: 'blood' },

  // Paternal
  { from: 'kaka', to: 'bapa', type: 'blood' },
  { from: 'atya', to: 'bapa', type: 'blood' },
  { from: 'chulthi', to: 'kaka', type: 'marriage' },
  { from: 'chulath_bhau', to: 'kaka', type: 'blood' },
  { from: 'chulath_bahin', to: 'kaka', type: 'blood' },

  // Maternal
  { from: 'maushi', to: 'amma', type: 'blood' },
  { from: 'mama', to: 'amma', type: 'blood' },
  { from: 'mami', to: 'mama', type: 'marriage' },
  { from: 'maavas_bhau', to: 'maushi', type: 'blood' },
  { from: 'maavas_bahin', to: 'maushi', type: 'blood' },

  // Siblings
  { from: 'bhau', to: 'bapa', type: 'blood' },
  { from: 'bahin', to: 'bapa', type: 'blood' },
  { from: 'vahini', to: 'bhau', type: 'marriage' },
  { from: 'bhaoji', to: 'bahin', type: 'marriage' },

  // Spouse
  { from: 'you', to: 'spouse', type: 'marriage' },

  // Spouse's family
  { from: 'sasra', to: 'spouse', type: 'blood' },
  { from: 'saasu', to: 'spouse', type: 'blood' },
  { from: 'kaaksasra', to: 'sasra', type: 'blood' },
  { from: 'kaak_saasu', to: 'sasra', type: 'marriage' },
  { from: 'vahinak', to: 'spouse', type: 'blood' },
  { from: 'daer', to: 'spouse', type: 'blood' },
  { from: 'nanand', to: 'spouse', type: 'blood' },
  { from: 'saadu', to: 'spouse', type: 'marriage' },
  { from: 'mevanna', to: 'spouse', type: 'blood' },
  { from: 'mhevani', to: 'spouse', type: 'blood' },

  // Children's in-laws
  { from: 'vyaahin', to: 'you', type: 'marriage' },
  { from: 'vihinn', to: 'you', type: 'marriage' },

  // Step relations
  { from: 'saavatr', to: 'you', type: 'step' },
  { from: 'saavatr_maai', to: 'saavatr', type: 'step' },
  { from: 'saavatr_baap', to: 'saavatr', type: 'step' },
  { from: 'sakka', to: 'you', type: 'step' },
];
