export interface FamilyMember {
  id: string;
  english: string;
  label_roman: string;
  label_devanagari: string;
  emoji: string;
  notes?: string;
  /** pixel x — centre of card — on the 870 × 540 canvas */
  x: number;
  /** pixel y — centre of card — on the 870 × 540 canvas */
  y: number;
}

// ── Canvas dimensions ─────────────────────────────────────────────────────────
export const CANVAS_W = 1440;
export const CANVAS_H = 720;

// Card size (centred on x, y)
export const CARD_W = 100;
export const CARD_H = 64;

// ── Family members ────────────────────────────────────────────────────────────
// Canvas layout (x, y centres):
//   Gen +3 (y=40):  great_grandfather(360) great_grandmother(810)
//   Gen +2 (y=85):  grandfather(510) grandmother(660)
//   Gen +1 (y=220): atya(130) vadil_kaka(255) kaka(380) | father(510) mother(660) | maushi(790) mama(915) mami(1040) || father_in_law(1190) mother_in_law(1325)
//   Gen  0 (y=390): bhaoji(60) sister(190) brother(330) bhauja(460) | me(580) spouse(720) | vahinak(850) nanand(965) daer(1080) vahini(1195) mevanna(1325)
//   Gen -1 (y=530): daughter_in_law(500) son(617) daughter(750) son_in_law(867)
//   Gen -2 (y=660): naath(617) naate(750)
export const FAMILY_MEMBERS: FamilyMember[] = [

  // ── Generation +2 — Grandparents ──────────────────────────────────────────
  {
    id: 'great_grandfather',
    english: 'Great-grandfather',
    label_roman: 'Mota Ajoba',
    label_devanagari: 'मोठे आजोबा',
    emoji: '👴',
    notes: `Mota Ajoba (मोठे आजोबा) means great-grandfather.`,
    x: 360, y: 40,
  },
  {
    id: 'grandfather',
    english: 'Grandfather',
    label_roman: 'Aajaa',
    label_devanagari: 'आजा',
    emoji: '👴',
    notes: `Your father's or mother's father. Aajaa is the warm Thanjavur Marathi equivalent of the standard Marathi "Aajoba".`,
    x: 510, y: 85,
  },
  {
    id: 'grandmother',
    english: 'Grandmother',
    label_roman: 'Aaji',
    label_devanagari: 'आजी',
    emoji: '👵',
    notes: `Your father's or mother's mother. Aaji is shared across Marathi dialects — a term of warmth and authority.`,
    x: 660, y: 85,
  },
  {
    id: 'great_grandmother',
    english: 'Great-grandmother',
    label_roman: 'Moti Aaji',
    label_devanagari: 'मोठी आजी',
    emoji: '👵',
    notes: `Moti Aaji (मोठी आजी) means great-grandmother.`,
    x: 810, y: 40,
  },

  // ── Generation +1 — Father's side ─────────────────────────────────────────
  {
    id: 'atya',
    english: `Father's Sister`,
    label_roman: 'Atya',
    label_devanagari: 'अत्या',
    emoji: '👩',
    notes: `Atya (अत्या) is your father's sister — your paternal aunt. A deeply respected figure in Thanjavur Marathi households.`,
    x: 130, y: 220,
  },
  {
    id: 'vadil_kaka',
    english: `Father's Older Brother`,
    label_roman: 'Vadil Kaka',
    label_devanagari: 'वडिल काका',
    emoji: '👨',
    notes: `Vadil Kaka (वडिल काका) is your father's older brother. The term Vadil alone can also be used respectfully to refer to one's own father.`,
    x: 255, y: 220,
  },
  {
    id: 'kaka',
    english: `Father's Brother`,
    label_roman: 'Kaka',
    label_devanagari: 'काका',
    emoji: '👨',
    notes: `Kaka (काका) is your father's brother — your paternal uncle. The more specific Thanjavur Marathi term is Chultha (चुल्था). His wife is called Chulthi (चुल्थी).`,
    x: 380, y: 220,
  },

  // ── Generation +1 — Core Parents ──────────────────────────────────────────
  {
    id: 'father',
    english: 'Father',
    label_roman: 'Bappa',
    label_devanagari: 'बप्पा',
    emoji: '👨',
    notes: `Bappa (बप्पा) is the beloved Thanjavur Marathi word for father. Vadil (वडिल) is also used, especially to refer to one's father's older brother.`,
    x: 510, y: 220,
  },
  {
    id: 'mother',
    english: 'Mother',
    label_roman: 'Amma / Aayi',
    label_devanagari: 'अम्मा / आई',
    emoji: '👩',
    notes: `Both Amma (अम्मा) and Aayi (आई) are used by the community, often interchangeably within the same household.`,
    x: 660, y: 220,
  },

  // ── Generation +1 — Mother's side ─────────────────────────────────────────
  {
    id: 'maushi',
    english: `Mother's Sister`,
    label_roman: 'Maushi',
    label_devanagari: 'मौषी',
    emoji: '👩',
    notes: `Maushi (मौषी) is your mother's sister — your maternal aunt. Her children are your Maavas Bhau (मावस भाऊ) or Maavas Bahin (मावस बहिन) — maternal cousins.`,
    x: 790, y: 220,
  },
  {
    id: 'mama',
    english: `Mother's Brother`,
    label_roman: 'Mama',
    label_devanagari: 'मामा',
    emoji: '👨',
    notes: `Mama (मामा) is your mother's brother — your maternal uncle. A very affectionate relationship in Marathi culture.`,
    x: 915, y: 220,
  },
  {
    id: 'mami',
    english: `Mama's Wife`,
    label_roman: 'Mami',
    label_devanagari: 'मामी',
    emoji: '👩',
    notes: `Mami (मामी) is your Mama's wife — your maternal uncle's wife. She plays a warm, nurturing role similar to a maternal aunt.`,
    x: 1040, y: 220,
  },

  // ── Generation +1 — Spouse's Parents ──────────────────────────────────────
  {
    id: 'father_in_law',
    english: 'Father-in-law',
    label_roman: 'Sasra',
    label_devanagari: 'साश्रा',
    emoji: '👴',
    notes: `Sasra (साश्रा) is your spouse's father. His brother is called Kaaksasra (काक्सासरा) or Chulathe Sasra (चुलत सासरा).`,
    x: 1190, y: 220,
  },
  {
    id: 'mother_in_law',
    english: 'Mother-in-law',
    label_roman: 'Saasu',
    label_devanagari: 'सासू',
    emoji: '👵',
    notes: `Saasu (सासू) is your spouse's mother. Kaak Saasu (काक्सासू) refers to the father-in-law's brother's wife.`,
    x: 1325, y: 220,
  },

  // ── Generation 0 — Sibling in-laws ────────────────────────────────────────
  {
    id: 'bhaoji',
    english: `Sister's Husband`,
    label_roman: 'Bhaoji',
    label_devanagari: 'भओजी',
    emoji: '👨',
    notes: `Bhaoji (भओजी) is your elder sister's husband, or your husband's older brother. The word carries respect — it denotes an older male in-law figure.`,
    x: 60, y: 390,
  },

  // ── Generation 0 — Your Siblings ──────────────────────────────────────────
  {
    id: 'sister',
    english: 'Sister',
    label_roman: 'Bahin',
    label_devanagari: 'बहिन',
    emoji: '👧',
    notes: `Bahin (बहिन) is your sister. A step-sister is Saavatr Bahin (सावत्र बहिन). Sakka Bahin (सक्का बहिन) clarifies she is your own blood sister.`,
    x: 190, y: 390,
  },
  {
    id: 'brother',
    english: 'Brother',
    label_roman: 'Bhau',
    label_devanagari: 'भाऊ',
    emoji: '👦',
    notes: `Bhau (भाऊ) is your brother. A step-brother is Saavatr Bhau (सावत्र भाऊ). Sakka Bhau (सक्का भाऊ) means your own blood brother.`,
    x: 330, y: 390,
  },
  {
    id: 'bhauja',
    english: `Brother's Wife`,
    label_roman: 'Bhauja',
    label_devanagari: 'भौज',
    emoji: '👩',
    notes: `Bhauja (भौज) is your brother's wife — your sister-in-law. Also referred to as Vahini (वहिनी) in general usage.`,
    x: 460, y: 390,
  },

  // ── Generation 0 — Me ─────────────────────────────────────────────────────
  {
    id: 'me',
    english: 'Me',
    label_roman: 'Mee',
    label_devanagari: 'मी',
    emoji: '⭐',
    notes: `You — the reference point for every relationship in this tree. All kinship terms are defined relative to you.`,
    x: 580, y: 390,
  },

  // ── Generation 0 — Spouse ─────────────────────────────────────────────────
  {
    id: 'spouse',
    english: 'Husband / Wife',
    label_roman: 'Dalla / Bayali',
    label_devanagari: 'दल्ला / बायली',
    emoji: '❤️',
    notes: `Dalla (दल्ला) = Husband · Bayali (बायली) = Wife. Together they are the married couple at the heart of this generation.`,
    x: 720, y: 390,
  },

  // ── Generation 0 — Spouse's Siblings (husband's side) ─────────────────────
  {
    id: 'vahinak',
    english: `Husband's Older Sister`,
    label_roman: 'Vahinak',
    label_devanagari: 'वहिनक',
    emoji: '👩',
    notes: `Vahinak (वहिनक) is your husband's older sister — a respectful elder female in-law figure. Thanjavur Marathi distinguishes older from younger sister of husband.`,
    x: 850, y: 390,
  },
  {
    id: 'nanand',
    english: `Husband's Younger Sister`,
    label_roman: 'Nanand',
    label_devanagari: 'ननंद',
    emoji: '👧',
    notes: `Nanand (ननंद) is your husband's younger sister. This is a distinct term from Vahinak — older and younger sisters of the husband each have their own word.`,
    x: 965, y: 390,
  },
  {
    id: 'daer',
    english: `Husband's Younger Brother`,
    label_roman: 'Daer',
    label_devanagari: 'देर',
    emoji: '👦',
    notes: `Daer (देर) is your husband's younger brother. This specific term reflects how Thanjavur Marathi assigns unique words even to the relative age of in-laws.`,
    x: 1080, y: 390,
  },

  // ── Generation 0 — Spouse's Siblings (wife's side) ────────────────────────
  {
    id: 'vahini',
    english: `Wife's Sister`,
    label_roman: 'Vahini',
    label_devanagari: 'वहिनी',
    emoji: '👧',
    notes: `Vahini (वहिनी) is your wife's sister. The term is also used generally for a sister-in-law (bhauja / brother's wife).`,
    x: 1195, y: 390,
  },
  {
    id: 'mevanna',
    english: `Wife's Brother`,
    label_roman: 'Mevanna',
    label_devanagari: 'मेवांना',
    emoji: '👦',
    notes: `Mevanna (मेवांना) is your wife's brother — your brother-in-law. A Saadu (सादू) is a co-brother — the husband of your wife's sister.`,
    x: 1325, y: 390,
  },

  // ── Generation −1 — Children ───────────────────────────────────────────────
  {
    id: 'daughter_in_law',
    english: 'Daughter-in-law',
    label_roman: 'Soon',
    label_devanagari: 'सून',
    emoji: '👩',
    notes: `Soon (सून) is your son's wife — daughter-in-law.`,
    x: 500, y: 530,
  },
  {
    id: 'son',
    english: 'Son',
    label_roman: 'Lonk',
    label_devanagari: 'लोंक',
    emoji: '👦',
    notes: `Lonk (लोंक) is the Thanjavur Marathi word for son.`,
    x: 617, y: 530,
  },
  {
    id: 'daughter',
    english: 'Daughter',
    label_roman: 'Lenke',
    label_devanagari: 'लेंकी',
    emoji: '👧',
    notes: `Lenke (लेंकी) is the Thanjavur Marathi word for daughter.`,
    x: 750, y: 530,
  },
  {
    id: 'son_in_law',
    english: 'Son-in-law',
    label_roman: 'Jamba',
    label_devanagari: 'जावई',
    emoji: '👨',
    notes: `Jamba (जावई) is your daughter's husband — son-in-law.`,
    x: 867, y: 530,
  },

  // ── Generation −2 — Grandchildren ─────────────────────────────────────────
  {
    id: 'grandson',
    english: 'Grandson',
    label_roman: 'Naath',
    label_devanagari: 'नात',
    emoji: '👦',
    notes: `Naath (नात) is your grandson — the son of your son or daughter.`,
    x: 617, y: 660,
  },
  {
    id: 'granddaughter',
    english: 'Granddaughter',
    label_roman: 'Naate',
    label_devanagari: 'नाती',
    emoji: '👧',
    notes: `Naate (नाती) is your granddaughter — the daughter of your son or daughter.`,
    x: 750, y: 660,
  },
];
