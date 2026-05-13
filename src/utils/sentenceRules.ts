/**
 * Sentence Grammar Rules Engine for Tanjore Marathi
 *
 * Implements all structural rules documented in sentence-grammar.md:
 *  1.  Copula movement (is/are/am → aahe at end)
 *  2.  SVO → SOV reordering for transitive sentences
 *  3.  Prepositions → postpositions (in/near/inside/from/with/before/after/to)
 *  4.  "how many" / "how much" → kevda (single unit)
 *  5.  Existence sentences ("there is/are X in Y" → Y+postpos + X + aahe)
 *  6.  Human vs non-human existence marker (aitha vs aahe)
 *  7.  Respectful/polite command forms
 *  8.  Imperatives — object before verb
 *  9.  Negative imperatives ("do not X" → X + nako)
 * 10.  Do-support removal (did/does/do)
 * 11.  Fixed conversational templates
 * 12.  Experiencer-state constructions (hungry, thirsty)
 * 13.  Future / modal handling (will)
 * 14.  Progressive aspect (is X-ing → X object + base-verb)
 * 15.  Possession/need/want structures ("I have X" → mala + X + aahe)
 */

// ── Interfaces ───────────────────────────────────────────────────────────────

/** A single translation unit in Tanjore-Marathi-correct order */
export interface ProcessedToken {
  /** Original English word(s) to look up in the dictionary */
  source: string;
  /** Fixed override — skip dictionary lookup and use this directly */
  override?: { romanized: string; devanagari: string };
  /**
   * Postposition to append after the translated form (space-separated).
   * e.g. romanized translation of "house" becomes "ghar javaL" when near="javaL"
   */
  postposition?: string;
  postpositionDev?: string;
}

export interface RuleResult {
  /** Non-null when the whole phrase maps to a stored template */
  fixedPhrase?: { romanized: string; devanagari: string };
  /** Tokens in correct TM order, ready for sequential dictionary lookup */
  tokens: ProcessedToken[];
  /** Particles / grammar words to append at the very end */
  suffix: Array<{ romanized: string; devanagari: string }>;
  /** Informational label describing which rule fired */
  sentenceType: string;
}

// ── Fixed phrase table ────────────────────────────────────────────────────────
// Complete overrides for idiomatic / template sentences.
const FIXED_PHRASES: Record<string, { romanized: string; devanagari: string }> = {
  // Greetings & well-being
  'how are you':              { romanized: 'kasa aahat',                  devanagari: 'कसे आहात' },
  'are you well':             { romanized: 'tumhi bara aahat ka',          devanagari: 'तुम्ही बरे आहात का' },
  'how are you doing':        { romanized: 'kasa aahat',                  devanagari: 'कसे आहात' },
  // Identity
  'what is your name':        { romanized: 'tumcha naav kaay aahe',        devanagari: 'तुमचं नाव काय आहे' },
  'what time is it':          { romanized: 'kelya vaajla aahe',            devanagari: 'केव्हा वाजलं आहे' },
  // Social
  'nice to meet you':         { romanized: 'tumhala bhetun aanand jhala',  devanagari: 'तुम्हाला भेटून आनंद झाला' },
  // Polite commands
  'please come in':           { romanized: 'aaat ya',                      devanagari: 'आत या' },
  'please sit down':          { romanized: 'basa',                         devanagari: 'बसा' },
  'please sit here':          { romanized: 'itha basa',                    devanagari: 'इथा बसा' },
  // Negative imperatives
  'do not run':               { romanized: 'dhaavu nako',                  devanagari: 'धावू नको' },
  'do not shout':             { romanized: 'oraadu nako',                  devanagari: 'ओरडू नको' },
  // Yes/no past questions
  'did you eat':              { romanized: 'tumhi khaallas ka',             devanagari: 'तुम्ही खाल्लास का' },
  // Origin question
  'where are you from':       { romanized: 'tumhi kuthun aalat',           devanagari: 'तुम्ही कुठून आलात' },
  // Suggestion modals
  'shall i come':             { romanized: 'mi yeu ka',                    devanagari: 'मी येऊ का' },
  'shall i come now':         { romanized: 'mi aata yeu ka',               devanagari: 'मी आता येऊ का' },
  'should we wait':           { romanized: 'amhi thaambu ka',              devanagari: 'आम्ही थांबू का' },
  // Experiencer states
  'i am hungry':              { romanized: 'mala bhook laagthe',           devanagari: 'मला भूक लागते' },
  'i am thirsty':             { romanized: 'mala taahan laagthe',          devanagari: 'मला तहान लागते' },
  // Negative states
  'i am not well':            { romanized: 'mala bara nahi',               devanagari: 'मला बरे नाही' },
  'i am not':                 { romanized: 'mi nahi',                      devanagari: 'मी नाही' },
};

// ── Grammatical particles ─────────────────────────────────────────────────────
const AAHE  = { romanized: 'aahe',  devanagari: 'आहे' };  // copula / existence (non-human)
const AITHA = { romanized: 'aitha', devanagari: 'आइथा' }; // existence (human plural)
const KA    = { romanized: 'ka',    devanagari: 'का' };    // question marker
const NAHI  = { romanized: 'nahi',  devanagari: 'नाही' };  // negation
const NAKO  = { romanized: 'nako',  devanagari: 'नको' };   // prohibitive (do not)

// ── Dative pronoun map ────────────────────────────────────────────────────────
// Used in possession ("I have X" → "mala X aahe") and need/want/experiencer sentences.
const DATIVE: Record<string, { romanized: string; devanagari: string }> = {
  i:    { romanized: 'mala',   devanagari: 'मला' },
  me:   { romanized: 'mala',   devanagari: 'मला' },
  you:  { romanized: 'tula',   devanagari: 'तुला' },
  he:   { romanized: 'tyana',  devanagari: 'त्याना' },
  she:  { romanized: 'tyana',  devanagari: 'त्याना' },
  we:   { romanized: 'amhala', devanagari: 'आम्हाला' },
  they: { romanized: 'tyanna', devanagari: 'त्यांना' },
};

// ── Preposition → postposition map ───────────────────────────────────────────
const POSTPOSITIONS: Record<string, { romanized: string; devanagari: string }> = {
  in:     { romanized: '-aant',    devanagari: '-आंत' },
  inside: { romanized: '-aant',    devanagari: '-आंत' },
  near:   { romanized: '-kada',    devanagari: '-कडा' },
  beside: { romanized: '-kada',    devanagari: '-कडा' },
  at:     { romanized: '-a',       devanagari: '-आ' },
  on:     { romanized: '-var',     devanagari: '-वर' },
  from:   { romanized: '-sooon',   devanagari: '-हून' },
  with:   { romanized: 'boror',    devanagari: 'बोरोर' },
  before: { romanized: 'puda',     devanagari: 'पुढा' },
  after:  { romanized: '-nantara', devanagari: '-नंतर' },
  to:     { romanized: '-aala',    devanagari: '-ला' },
};

const IN_LOCATION_POSTPOSITION = { romanized: '-aant', devanagari: '-आंत' };

const LOCATION_HINT_WORDS = new Set([
  'kitchen', 'room', 'home', 'house', 'school', 'college', 'university',
  'office', 'market', 'shop', 'store', 'temple', 'church', 'mosque',
  'village', 'city', 'town', 'street', 'road', 'park', 'garden', 'farm',
  'hospital', 'station', 'hotel', 'hall', 'bathroom', 'bedroom', 'toilet',
  'restaurant', 'cafe', 'bank', 'library', 'court', 'warehouse', 'classroom',
  'backyard', 'yard', 'compound', 'verandah', 'veranda', 'porch',
]);

// ── Word-class sets ───────────────────────────────────────────────────────────
const SKIP_WORDS     = new Set(['the', 'a', 'an', 'there']);
const COPULA         = new Set(['is', 'are', 'am', 'was', 'were']);
const DO_SUPPORT     = new Set(['do', 'does', 'did', 'shall', 'should']);
const SUBJECT_PRONOUNS = new Set(['i', 'you', 'he', 'she', 'we', 'they']);

// Human nouns trigger the human-plural existence marker "aitha" instead of "aahe"
const HUMAN_NOUNS = new Set([
  'people', 'children', 'men', 'women', 'person', 'child',
  'man', 'woman', 'students', 'teachers', 'family', 'boys',
  'girls', 'brothers', 'sisters', 'parents', 'friends', 'members',
]);

const TIME_WORDS = new Set([
  'today', 'tomorrow', 'yesterday', 'tonight', 'now', 'later', 'soon',
  'morning', 'afternoon', 'evening', 'night', 'daily', 'week', 'month', 'year',
  'kaale', 'aaje', 'uja', 'nitte', 'dupaara', 'raatri', 'paashte', 'sahenkali',
]);

const POSSESSIVES = new Set(['my', 'your', 'his', 'her', 'our', 'their']);

const CLAUSE_CONNECTORS = new Set(['and', 'then']);

const POSSESSIVE_TO_SUBJECT: Record<string, string> = {
  my: 'i',
  your: 'you',
  his: 'he',
  her: 'she',
  our: 'we',
  their: 'they',
};

const IDENTITY_NOUNS = new Set([
  'father', 'mother', 'brother', 'sister', 'son', 'daughter',
  'husband', 'wife', 'grandfather', 'grandmother', 'name',
]);

// Known lexical verbs (present / simple-past forms) — used to detect SOV candidates
const KNOWN_VERBS = new Set([
  'read', 'reads', 'brought', 'bring', 'brings', 'ate', 'eat', 'eats',
  'cut', 'cuts', 'make', 'makes', 'made', 'go', 'goes', 'went',
  'come', 'comes', 'came', 'give', 'gives', 'gave', 'take', 'takes', 'took',
  'comb', 'combs', 'combed', 'brush', 'brushes', 'brushed',
  'see', 'sees', 'saw', 'hear', 'hears', 'heard', 'open', 'opens', 'opened',
  'close', 'closes', 'closed', 'run', 'runs', 'sit', 'sits', 'sat',
  'write', 'writes', 'wrote', 'wait', 'waits', 'waited',
  'leave', 'leaves', 'left', 'send', 'sends', 'sent',
  'cook', 'cooks', 'cooked', 'clean', 'cleans', 'cleaned',
  'wash', 'washes', 'washed', 'call', 'calls', 'called',
  'buy', 'buys', 'bought', 'sell', 'sells', 'sold',
  'put', 'puts', 'got', 'get', 'gets', 'said', 'say', 'says',
  'play', 'plays', 'played', 'work', 'works', 'worked',
  'walk', 'walks', 'walked', 'talk', 'talks', 'talked',
  'drink', 'drinks', 'drank', 'use', 'uses', 'used',
  'keep', 'keeps', 'kept', 'show', 'shows', 'showed',
  'bring', 'brought', 'help', 'helps', 'helped',
]);

// Experiencer adjectives that trigger dative + phrase construction
const EXPERIENCER_OVERRIDES: Record<string, { romanized: string; devanagari: string }> = {
  hungry:  { romanized: 'bhook laagthe',  devanagari: 'भूक लागते' },
  thirsty: { romanized: 'taahan laagthe', devanagari: 'तहान लागते' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
}

function isProgressiveForm(word: string): boolean {
  return word.endsWith('ing') && word.length > 4;
}

/**
 * Approximate base form from an -ing word for dictionary lookup.
 * "cutting" → "cut", "making" → "make", "going" → "go"
 */
function deProgressivize(word: string): string {
  if (!word.endsWith('ing')) return word;
  const stem = word.slice(0, -3);
  if (stem.length < 2) return word;
  // Double-consonant: "running" → stem "runn" → "run"
  if (stem[stem.length - 1] === stem[stem.length - 2]) {
    return stem.slice(0, -1);
  }
  // Dropped-e form: "making" → stem "mak" → "make"
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  if (!vowels.has(stem[stem.length - 1])) {
    return stem + 'e';
  }
  return stem;
}

function isLikelyLocationToken(word: string): boolean {
  if (!word) return false;
  if (LOCATION_HINT_WORDS.has(word)) return true;
  return (
    word.endsWith('room') ||
    word.endsWith('house') ||
    word.endsWith('school') ||
    word.endsWith('office') ||
    word.endsWith('market') ||
    word.endsWith('station') ||
    word.endsWith('city') ||
    word.endsWith('village') ||
    word.endsWith('town') ||
    word.endsWith('park')
  );
}

function resolvePostposition(prep: string, targetTokenNorm: string) {
  if ((prep === 'in' || prep === 'inside') && isLikelyLocationToken(targetTokenNorm)) {
    return IN_LOCATION_POSTPOSITION;
  }
  return POSTPOSITIONS[prep] ?? POSTPOSITIONS.in;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function applySentenceRules(input: string): RuleResult {
  const cleaned = norm(input);
  if (!cleaned) {
    return { tokens: [], suffix: [], sentenceType: 'default' };
  }

  // ── 1. Fixed phrase table (exact match) ─────────────────────────────────────
  const fixed = FIXED_PHRASES[cleaned];
  if (fixed) {
    return { fixedPhrase: fixed, tokens: [], suffix: [], sentenceType: 'fixed_phrase' };
  }

  // Tokenize — keep rawTokens for source attribution, use lower-norm for logic
  const rawTokens = input.trim().split(/\s+/).filter(Boolean);
  const tokens = rawTokens.map(t => norm(t));

  if (tokens.length === 0) {
    return { tokens: [], suffix: [], sentenceType: 'default' };
  }

  // ── 2. Detect structural markers ─────────────────────────────────────────────

  // "how many …" / "how much …"
  const howIdx = tokens.indexOf('how');
  const hasHowMany =
    howIdx >= 0 &&
    howIdx + 1 < tokens.length &&
    (tokens[howIdx + 1] === 'many' || tokens[howIdx + 1] === 'much');

  // Existence: "there is/are …"
  const isExistenceSentence =
    tokens[0] === 'there' && tokens.length > 1 && COPULA.has(tokens[1]);

  // Negative imperative: "do not …" / "don't …"
  const isNegativeImperative =
    (tokens[0] === 'do' && tokens[1] === 'not') ||
    tokens[0] === 'dont';

  // Copula detection
  const copulaIndex = tokens.findIndex(t => COPULA.has(t));
  const hasCopula = copulaIndex >= 0;

  // Progressive: copula followed by an -ing word
  const progressiveVerbIndex = tokens.findIndex(
    (t, i) => i > copulaIndex && copulaIndex >= 0 && isProgressiveForm(t)
  );
  const isProgressiveSentence = hasCopula && progressiveVerbIndex > copulaIndex && !isExistenceSentence;

  // Future: "will …"
  const willIndex = tokens.indexOf('will');
  const hasFuture = willIndex >= 0;

  // Yes/No question: leading copula or auxiliary before a subject pronoun
  const isYesNoQuestion =
    (COPULA.has(tokens[0]) && SUBJECT_PRONOUNS.has(tokens[1] ?? '')) ||
    (tokens[0] === 'can' && tokens[1] === 'you') ||
    (tokens[0] === 'did' && SUBJECT_PRONOUNS.has(tokens[1] ?? '')) ||
    (tokens[0] === 'could' && tokens[1] === 'you');

  // Negation
  const notIndex = tokens.indexOf('not');
  const hasNegation = notIndex >= 0;

  // Possession / want / need → dative construction
  const haveIdx = tokens.findIndex(t => t === 'have' || t === 'has');
  const wantIdx = tokens.findIndex(t => t === 'want' || t === 'need' || t === 'like');
  const isPossessionOrWant =
    (haveIdx >= 0 && SUBJECT_PRONOUNS.has(tokens[0])) ||
    (wantIdx >= 0 && SUBJECT_PRONOUNS.has(tokens[0]));

  // Experiencer adjective
  const experiencerAdj = tokens.find(t => t in EXPERIENCER_OVERRIDES);
  const isExperiencerState = hasCopula && !!experiencerAdj && SUBJECT_PRONOUNS.has(tokens[0]);

  // Imperative: starts with a known verb (or "please") — no leading subject pronoun
  const startsLikeBareCommand =
    !SKIP_WORDS.has(tokens[0]) &&
    !SUBJECT_PRONOUNS.has(tokens[0]) &&
    !COPULA.has(tokens[0]) &&
    tokens[0] !== 'there' &&
    !DO_SUPPORT.has(tokens[0]) &&
    !hasHowMany &&
    !isYesNoQuestion;

  const hasCommandContinuation =
    tokens.includes('and') ||
    tokens.includes('then') ||
    POSSESSIVES.has(tokens[1] ?? '');

  const isImperative =
    startsLikeBareCommand &&
    (KNOWN_VERBS.has(tokens[0]) || tokens[0] === 'please' || hasCommandContinuation);

  // Transitive SOV: subject pronoun → known verb → object(s), no copula
  const verbIdx =
    SUBJECT_PRONOUNS.has(tokens[0]) && !hasCopula && !isPossessionOrWant
      ? tokens.findIndex((t, i) => i > 0 && (KNOWN_VERBS.has(t) || isProgressiveForm(t)))
      : -1;
  const isTransitiveSov = verbIdx > 0;

  // ── 3. Build ProcessedToken list ─────────────────────────────────────────────
  const processed: ProcessedToken[] = [];
  const suffix: Array<{ romanized: string; devanagari: string }> = [];
  let sentenceType = 'default';

  // ─── EXISTENCE ────────────────────────────────────────────────────────────────
  // "There is water in the pot." → pot+t water aahe
  if (isExistenceSentence) {
    sentenceType = 'existence';
    const contentBeforePrep: string[] = [];
    let prep = '';
    let locStart = -1;

    for (let i = 2; i < tokens.length; i++) {
      const t = tokens[i];
      if (SKIP_WORDS.has(t)) continue;
      if (t in POSTPOSITIONS) {
        prep = t;
        locStart = i + 1;
        break;
      }
      contentBeforePrep.push(rawTokens[i]);
    }

    const locTokens: Array<{ raw: string; norm: string }> = [];
    if (locStart >= 0) {
      for (let i = locStart; i < tokens.length; i++) {
        if (!SKIP_WORDS.has(tokens[i])) {
          locTokens.push({ raw: rawTokens[i], norm: tokens[i] });
        }
      }
    }

    // TM order: location+postpos → noun → aahe/aitha
    if (locTokens.length > 0 && prep) {
      for (const lt of locTokens) {
        const pp = prep === 'in'
          ? IN_LOCATION_POSTPOSITION
          : resolvePostposition(prep, lt.norm);
        processed.push({ source: lt.raw, postposition: pp.romanized, postpositionDev: pp.devanagari });
      }
    }
    for (const ct of contentBeforePrep) {
      processed.push({ source: ct });
    }

    const allContentNorm = [...contentBeforePrep, ...locTokens.map(lt => lt.raw)].map(norm);
    suffix.push(allContentNorm.some(t => HUMAN_NOUNS.has(t)) ? AITHA : AAHE);
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── NEGATIVE IMPERATIVE ─────────────────────────────────────────────────────
  // "Do not run." → run + nako
  if (isNegativeImperative) {
    sentenceType = 'negative_imperative';
    const startIdx = tokens[0] === 'dont' ? 1 : 2;
    for (let i = startIdx; i < tokens.length; i++) {
      if (!SKIP_WORDS.has(tokens[i])) {
        processed.push({ source: rawTokens[i] });
      }
    }
    suffix.push(NAKO);
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── EXPERIENCER STATE ────────────────────────────────────────────────────────
  // "I am hungry." → mala bhook laagthe
  if (isExperiencerState && experiencerAdj) {
    sentenceType = 'experiencer_state';
    const datForm = DATIVE[tokens[0]];
    processed.push({
      source: rawTokens[0],
      override: datForm ?? undefined,
    });
    processed.push({
      source: experiencerAdj,
      override: EXPERIENCER_OVERRIDES[experiencerAdj],
    });
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── POSSESSION / WANT / NEED ─────────────────────────────────────────────────
  // "I have work today." → mala aaj kaam aahe
  // "I want rice."       → mala bhaath pajhe   (want → pajhe via dictionary or override)
  // "I need vegetables." → mala bhaaji pajhe
  if (isPossessionOrWant) {
    sentenceType = 'possession';
    const datForm = DATIVE[tokens[0]];
    processed.push({
      source: rawTokens[0],
      override: datForm ?? undefined,
    });

    const skipIdx = haveIdx >= 0 ? haveIdx : wantIdx;
    for (let i = skipIdx + 1; i < tokens.length; i++) {
      if (!SKIP_WORDS.has(tokens[i])) {
        processed.push({ source: rawTokens[i] });
      }
    }

    // For "want/need" the verb "want" translates to "pajhe" — look it up via dictionary.
    // For "have/has" just append aahe.
    if (wantIdx >= 0) {
      // Push "want"/"need" token at end (dictionary will resolve it)
      processed.push({ source: rawTokens[wantIdx] });
    } else {
      suffix.push(AAHE);
    }
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── YES / NO QUESTION ───────────────────────────────────────────────────────
  // "Are you well?" → you well aahe ka
  // "Can you hear me?" → you me hear aahe ka
  if (isYesNoQuestion) {
    sentenceType = 'yes_no_question';
    const helper = tokens[0];
    const hasLexicalPredicate = tokens
      .slice(1)
      .some(t => KNOWN_VERBS.has(t) || isProgressiveForm(t));

    for (let i = 1; i < tokens.length; i++) {
      const t = tokens[i];
      if (SKIP_WORDS.has(t) || COPULA.has(t) || DO_SUPPORT.has(t)) continue;
      processed.push({ source: rawTokens[i] });
    }

    // Verb questions like "did you eat" use statement order + final ka.
    // Copular questions keep aahe + ka.
    if (helper === 'did' || helper === 'do' || helper === 'does' || hasLexicalPredicate) {
      suffix.push(KA);
    } else {
      suffix.push(AAHE, KA);
    }

    return { tokens: processed, suffix, sentenceType };
  }

  // ─── QUANTITY QUESTION ───────────────────────────────────────────────────────
  // "How many people are there?" → kevda people aitha
  // "How much water is there?"   → kevda water aahe
  if (hasHowMany) {
    sentenceType = 'quantity_question';
    processed.push({
      source: 'how many',
      override: { romanized: 'kevda', devanagari: 'केवढा' },
    });
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (i === howIdx || i === howIdx + 1) continue; // skip "how many/much"
      if (SKIP_WORDS.has(t) || COPULA.has(t)) continue;
      processed.push({ source: rawTokens[i] });
    }
    const isHuman = tokens.some(t => HUMAN_NOUNS.has(t));
    suffix.push(isHuman ? AITHA : AAHE);
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── FUTURE ──────────────────────────────────────────────────────────────────
  // "We will go tomorrow." → we tomorrow go
  if (hasFuture) {
    sentenceType = 'future';
    const subjectTokens: ProcessedToken[] = [];
    const restTokens: ProcessedToken[] = [];

    for (let i = 0; i < tokens.length; i++) {
      if (i === willIndex) continue; // drop "will"
      const t = tokens[i];
      if (SKIP_WORDS.has(t)) continue;
      (i < willIndex ? subjectTokens : restTokens).push({ source: rawTokens[i] });
    }
    processed.push(...subjectTokens, ...restTokens);
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── PROGRESSIVE ─────────────────────────────────────────────────────────────
  // "She is cutting vegetables." → she vegetables cut
  // "He is going to town."       → he town la go
  if (isProgressiveSentence) {
    sentenceType = 'progressive';
    const subjectTokens: ProcessedToken[] = [];
    const objectTokens: ProcessedToken[] = [];
    let progressiveToken: ProcessedToken | null = null;
    let pendingPrep: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (SKIP_WORDS.has(t) || COPULA.has(t)) continue;

      if (isProgressiveForm(t)) {
        // Convert -ing to base form for dictionary lookup
        progressiveToken = { source: deProgressivize(rawTokens[i]) };
        continue;
      }

      if (t in POSTPOSITIONS) {
        pendingPrep = t;
        continue;
      }

      const pt: ProcessedToken = { source: rawTokens[i] };
      if (pendingPrep) {
        const pp = resolvePostposition(pendingPrep, t);
        pt.postposition = pp.romanized;
        pt.postpositionDev = pp.devanagari;
        pendingPrep = null;
      }

      if (i < copulaIndex) {
        subjectTokens.push(pt);
      } else {
        objectTokens.push(pt);
      }
    }

    // TM order: subject + object(s) + verb
    processed.push(...subjectTokens, ...objectTokens);
    if (progressiveToken) processed.push(progressiveToken);
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── COPULA SENTENCE (predicate adjective or location) ───────────────────────
  // "The mango is sweet."       → mango sweet aahe
  // "The bag is near the wall." → bag wall javaL aahe
  // "He is not well."           → he well nahi
  if (hasCopula && !isTransitiveSov) {
    sentenceType = 'predicate_adjective';
    const preTokens: ProcessedToken[] = [];
    const postTokens: ProcessedToken[] = [];
    let pastCopula = false;
    let pendingPrep: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (SKIP_WORDS.has(t)) continue;
      if (COPULA.has(t)) { pastCopula = true; continue; }
      if (t === 'not') continue; // handled via suffix

      if (t in POSTPOSITIONS) {
        pendingPrep = t;
        if (pastCopula) sentenceType = 'location';
        continue;
      }

      const pt: ProcessedToken = { source: rawTokens[i] };
      if (pendingPrep) {
        const pp = resolvePostposition(pendingPrep, t);
        pt.postposition = pp.romanized;
        pt.postpositionDev = pp.devanagari;
        pendingPrep = null;
      }

      (pastCopula ? postTokens : preTokens).push(pt);
    }

    processed.push(...preTokens, ...postTokens);

    const preNorm = preTokens.map(pt => norm(pt.source));
    const postNorm = postTokens.map(pt => norm(pt.source));
    const hasPossessive = [...preNorm, ...postNorm].some(t => POSSESSIVES.has(t));
    const hasIdentityNoun = [...preNorm, ...postNorm].some(t => IDENTITY_NOUNS.has(t));
    const isIdentity =
      (preNorm.includes('name') && hasPossessive) ||
      ((preNorm[0] === 'this' || preNorm[0] === 'that') && (hasPossessive || hasIdentityNoun));

    if (hasNegation) {
      suffix.push(NAHI);
    } else if (!isIdentity) {
      suffix.push(AAHE);
    }

    return { tokens: processed, suffix, sentenceType };
  }

  // ─── IMPERATIVE ──────────────────────────────────────────────────────────────
  // "Open the door."       → door open
  // "Please give me water." → me water give
  if (isImperative) {
    sentenceType = 'imperative';
    const isPolite = tokens[0] === 'please';
    const startIdx = isPolite ? 1 : 0;
    const clauseStartIndices: number[] = [startIdx];

    for (let i = startIdx; i < tokens.length; i++) {
      if (CLAUSE_CONNECTORS.has(tokens[i]) && i + 1 < tokens.length) {
        clauseStartIndices.push(i + 1);
      }
    }

    for (let ci = 0; ci < clauseStartIndices.length; ci++) {
      const clauseStart = clauseStartIndices[ci];
      const clauseEnd = ci + 1 < clauseStartIndices.length
        ? clauseStartIndices[ci + 1] - 1
        : tokens.length - 1;

      let verbToken: ProcessedToken | null = null;
      const objectTokens: ProcessedToken[] = [];
      let subjectFromPossessive: string | null = null;
      let pendingPrep: string | null = null;

      for (let i = clauseStart; i <= clauseEnd; i++) {
        const t = tokens[i];
        if (SKIP_WORDS.has(t) || CLAUSE_CONNECTORS.has(t)) continue;

        if (t in POSTPOSITIONS) {
          pendingPrep = t;
          continue;
        }

        if (POSSESSIVES.has(t)) {
          subjectFromPossessive = POSSESSIVE_TO_SUBJECT[t] ?? null;
          continue;
        }

        const pt: ProcessedToken = { source: rawTokens[i] };
        if (pendingPrep) {
          const pp = resolvePostposition(pendingPrep, t);
          pt.postposition = pp.romanized;
          pt.postpositionDev = pp.devanagari;
          pendingPrep = null;
        }

        if (!verbToken && (KNOWN_VERBS.has(t) || i === clauseStart)) {
          verbToken = pt;
          continue;
        }
        objectTokens.push(pt);
      }

      if (subjectFromPossessive) {
        processed.push({ source: subjectFromPossessive });
      }

      processed.push(...objectTokens);
      if (verbToken) processed.push(verbToken);

      if (ci < clauseStartIndices.length - 1) {
        processed.push({
          source: 'and then',
          override: { romanized: 'yanantara', devanagari: 'यानंतर' },
        });
      }
    }

    return { tokens: processed, suffix, sentenceType };
  }

  // ─── TRANSITIVE SOV REORDER ──────────────────────────────────────────────────
  // "He reads the book."  → he book reads
  // "We came yesterday."  → we yesterday came
  if (isTransitiveSov) {
    sentenceType = 'transitive_sov';
    const subjectTokens: ProcessedToken[] = [];
    const verbToken: ProcessedToken = { source: rawTokens[verbIdx] };
    const timeTokens: ProcessedToken[] = [];
    const objectTokens: ProcessedToken[] = [];
    let pendingPrep: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      if (i === verbIdx) continue;
      const t = tokens[i];
      if (SKIP_WORDS.has(t)) continue;

      if (t in POSTPOSITIONS) {
        pendingPrep = t;
        continue;
      }

      const pt: ProcessedToken = { source: rawTokens[i] };
      if (pendingPrep) {
        const pp = resolvePostposition(pendingPrep, t);
        pt.postposition = pp.romanized;
        pt.postpositionDev = pp.devanagari;
        pendingPrep = null;
      }

      if (i < verbIdx) {
        subjectTokens.push(pt);
      } else if (TIME_WORDS.has(t)) {
        timeTokens.push(pt);
      } else {
        objectTokens.push(pt);
      }
    }

    // TM order: subject + time + object(s) + verb
    processed.push(...subjectTokens, ...timeTokens, ...objectTokens, verbToken);
    return { tokens: processed, suffix, sentenceType };
  }

  // ─── DEFAULT ─────────────────────────────────────────────────────────────────
  // Pass tokens through in order, applying postposition conversions and
  // deferring copula to end as aahe.
  {
    sentenceType = 'default';
    let hasDeferredCopula = false;
    let addNahi = false;
    let pendingPrep: string | null = null;

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (SKIP_WORDS.has(t)) continue;

      if (COPULA.has(t)) {
        hasDeferredCopula = true;
        continue;
      }

      if (t === 'not') {
        addNahi = true;
        hasDeferredCopula = false;
        continue;
      }

      if (DO_SUPPORT.has(t)) continue; // do-support removal

      if (t in POSTPOSITIONS) {
        pendingPrep = t;
        continue;
      }

      const pt: ProcessedToken = { source: rawTokens[i] };
      if (pendingPrep) {
        const pp = resolvePostposition(pendingPrep, t);
        pt.postposition = pp.romanized;
        pt.postpositionDev = pp.devanagari;
        pendingPrep = null;
      }
      processed.push(pt);
    }

    if (addNahi) {
      suffix.push(NAHI);
    } else if (hasDeferredCopula) {
      suffix.push(AAHE);
    }

    return { tokens: processed, suffix, sentenceType };
  }
}
