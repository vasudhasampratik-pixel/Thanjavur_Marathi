# Thanjavur Marathi Translator — Project Plan

## Overview

A static React web app for translating English words, phrases, and sentences
into Thanjavur Marathi (TMD / Dakshini Marathi). Built around a hand-crafted
JSON language database scraped from tanjoremarathis.blogspot.com.

**Stack**
- Framework : React 18 + Vite
- Language : TypeScript
- Styling : Tailwind CSS
- Voice Input : Web Speech API (browser-native, no API key needed)
- Database : Static JSON file(s) bundled with the app
- Hosting : GitHub Pages / Netlify / Azure Static Web Apps (TBD)

---

## Phase 1 — Language Database (Scraper + JSON)

### 1.1 Scraper Script (Node.js)

File: `scripts/scraper.ts`

- Use `axios` to fetch each blog post URL
- Use `cheerio` to extract post body text
- Parse three text patterns found on the site:
  - Pattern A: `TM Word .. Devanagari .. English`
  - Pattern B: `ENGLISH CAPS Devanagari ... meaning`
  - Pattern C: `Romanized Devanagari ...meaning`
- Normalize separators (`..'`, `...`, `....`, ` — `)
- Map each entry to the schema below
- Write output to `src/data/dictionary.json`

### 1.2 Target URLs to Scrape (~30 high-value posts)

| Category | URL |
|---|---|
| Common Words & Phrases label | /search/label/Common%20Words%20and%20Phrases |
| Forgotten Marathi Words label | /search/label/Forgotten%20Marathi%20Words |
| Sickness words | /2013/10/tmd-words-for-sickness.html |
| Emotions | /2013/05/emotions-and-characterization-in-tmd.html |
| Vegetables & Fruits | /2013/02/about-oons-and-vegetables-and-fruits.html |
| Kitchen Utensils | /2012/12/kitchen-utensils-in-tmd.html |
| Trees & Fruits | /2011/09/from-trees-to-fruits-and-finally-to.html |
| People & Professions | /2010/12/people-and-professions.html |
| Colours & Metals | /2010/11/interesting-take-on-colours-and-metals.html |
| Grocery List | /2012/01/try-your-grocery-list-in-thanjavur.html |
| Pests | /2012/01/pests-around-house.html |
| Relatives | /2010/02/relatives.html |
| Idioms | /2010/11/idioms-and-phrases-in-thanjavur-marathi.html |
| Proverbs | (all proverb label posts) |
| Days & Months | /2010/10/days-and-months.html |
| Tastes | /2018/11/different-tastes.html |
| Opposites | /2020/01/opposites-in-thanjavur-marathi.html |
| Ornaments/Jewelry | /2018/09/tmds-or-dakshini-marathis-as-we-call.html |
| Puja terminology | /2013/09/puja-terminology.html |
| Numbers | /search/label/Numbers%20and%20Clours |

### 1.3 JSON Schema

File: `src/data/dictionary.json`

```json
{
  "meta": {
    "version": "1.0.0",
    "totalEntries": 0,
    "lastUpdated": "2026-04-12",
    "source": "https://tanjoremarathis.blogspot.com"
  },
  "entries": [
    {
      "id": "food_001",
      "english": "rice",
      "english_variants": ["rice grain"],
      "tm_romanized": "tandool",
      "tm_devanagari": "तांदूळ",
      "category": "food",
      "type": "word",
      "notes": "",
      "source_url": "/2012/01/try-your-grocery-list-in-thanjavur.html"
    }
  ]
}
```

**Categories:** food, emotions, body, nature, professions, relations,
colours, numbers, time, household, idioms, proverbs, ceremonies, misc

**Types:** word | phrase | idiom | proverb

---

## Phase 2 — React App Structure

```
tanrathi/
├── public/
│   └── favicon.ico
├── scripts/
│   └── scraper.ts           ← one-time data build script
├── src/
│   ├── data/
│   │   └── dictionary.json  ← generated language database
│   ├── components/
│   │   ├── TranslatorBox.tsx     ← main input + result card
│   │   ├── VoiceInputButton.tsx  ← mic button, Web Speech API
│   │   ├── TranslationResult.tsx ← displays TM romanized + Devanagari
│   │   ├── CategoryBadge.tsx     ← colour-coded category pill
│   │   └── Header.tsx
│   ├── hooks/
│   │   ├── useSpeechInput.ts ← Web Speech API hook
│   │   └── useTranslate.ts   ← search/fuzzy-match logic
│   ├── utils/
│   │   └── search.ts         ← normalise, fuzzy match, multi-word split
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── PLAN.md
├── package.json
└── vite.config.ts
```

---

## Phase 3 — Translation Logic

File: `src/utils/search.ts` and `src/hooks/useTranslate.ts`

**Search algorithm (single word):**
1. Lowercase + trim the input
2. Exact match against `english` field → return immediately
3. Partial match against `english_variants[]`
4. Fuzzy match (Levenshtein distance ≤ 2) for typo tolerance
5. Return top 5 results ranked by score

**Phrase / sentence handling:**
1. Tokenize input into individual words
2. Run single-word search on each token
3. Reconstruct results showing which tokens matched / didn't match
4. Display "no translation found" badge for unmatched tokens

**Display per result:**
- TM word in Devanagari (large, primary)
- TM romanized spelling (secondary)
- Category badge
- Source note

---

## Phase 4 — Voice Input

File: `src/hooks/useSpeechInput.ts`

- Use `window.SpeechRecognition` / `window.webkitSpeechRecognition`
- Language set to `en-IN` (Indian English accent)
- Interim results shown in real-time in the text box
- On final result → auto-trigger translation
- Graceful fallback if browser doesn't support Web Speech API
- VoiceInputButton shows animated pulse while listening

---

## Phase 5 — UI / UX Design

**Colour palette (Tamil Nadu / Marathi inspired):**
- Primary: Deep saffron `#FF6B35`
- Accent: Peacock green `#1A936F`
- Background: Warm cream `#FDF8F0`
- Text: Charcoal `#2D2D2D`

---

## Future Scope (Post-MVP)

| Feature | Description |
|---|---|
| History & Timeline | Interactive timeline of TMD migration (1673) |
| Grammar guide | Basic TMD grammar rules |
| Phrasebook | Curated common situation phrases |
| Gamification | Vocabulary flashcard quiz, daily word challenge |
| Community | User-submitted word corrections / additions |
| Audio pronunciation | Record native speaker audio per entry |
| PWA | Offline usage via service worker |

---

## Development Milestones

| Milestone | Deliverable |
|---|---|
| M1 | Scraper script + `dictionary.json` (≥500 entries) |
| M2 | Vite + React scaffold + JSON import working |
| M3 | Translation search (text input) working end-to-end |
| M4 | Voice input integrated |
| M5 | Full UI polish + mobile responsive |
| M6 | Deployment |

---

## Notes on Scraping Ethics

The site `tanjoremarathis.blogspot.com` carries a copyright notice.
The data scraped is used solely for linguistic preservation and educational
purposes, consistent with the blog author's own mission. The app credits
the source prominently in the UI and README.