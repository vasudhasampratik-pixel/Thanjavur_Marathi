/**
 * Thanjavur Marathi Dictionary Scraper
 * Scrapes tanjoremarathis.blogspot.com and outputs src/data/dictionary.json
 *
 * Usage: npx tsx scripts/scraper.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://tanjoremarathis.blogspot.com';

const TARGET_URLS: { url: string; category: string; label: string }[] = [
  { url: '/2012/01/try-your-grocery-list-in-thanjavur.html',        category: 'food',        label: 'Grocery List' },
  { url: '/2013/02/about-oons-and-vegetables-and-fruits.html',      category: 'food',        label: 'Vegetables & Fruits' },
  { url: '/2011/09/from-trees-to-fruits-and-finally-to.html',       category: 'nature',      label: 'Trees & Fruits' },
  { url: '/2018/11/different-tastes.html',                          category: 'food',        label: 'Tastes' },
  { url: '/2012/12/kitchen-utensils-in-tmd.html',                   category: 'household',   label: 'Kitchen Utensils' },
  { url: '/2013/05/emotions-and-characterization-in-tmd.html',      category: 'emotions',    label: 'Emotions' },
  { url: '/2013/10/tmd-words-for-sickness.html',                    category: 'body',        label: 'Sickness' },
  { url: '/2010/12/people-and-professions.html',                    category: 'professions', label: 'Professions' },
  { url: '/2010/11/interesting-take-on-colours-and-metals.html',    category: 'colours',     label: 'Colours & Metals' },
  { url: '/2010/02/relatives.html',                                  category: 'relations',   label: 'Relatives' },
  { url: '/2010/10/days-and-months.html',                            category: 'time',        label: 'Days & Months' },
  { url: '/2020/01/opposites-in-thanjavur-marathi.html',            category: 'misc',        label: 'Opposites' },
  { url: '/2010/11/idioms-and-phrases-in-thanjavur-marathi.html',   category: 'idioms',      label: 'Idioms' },
  { url: '/2010/10/recalling-common-phrases-in-thanjavur.html',     category: 'misc',        label: 'Common Phrases' },
  { url: '/2012/01/pests-around-house.html',                        category: 'nature',      label: 'Pests' },
  { url: '/2013/09/puja-terminology.html',                          category: 'ceremonies',  label: 'Puja Terms' },
  { url: '/2018/09/tmds-or-dakshini-marathis-as-we-call.html',     category: 'household',   label: 'Ornaments' },
  { url: '/2012/07/more-tmd-wordsfrom-generation-past.html',       category: 'misc',        label: 'Forgotten Words 1' },
  { url: '/2010/10/forgotten-thanjavur-marathi-words1.html',       category: 'misc',        label: 'Forgotten Words 2' },
  { url: '/2010/11/forgotten-thanjavur-marathi-words2.html',       category: 'misc',        label: 'Forgotten Words 3' },
  { url: '/2011/02/on-rain.html',                                   category: 'nature',      label: 'Rain / Weather' },
  { url: '/2012/09/tm-words-from-our-readers.html',                category: 'misc',        label: 'Reader Words' },
];

// Devanagari Unicode range: \u0900-\u097F
const DEVANAGARI_RE = /[\u0900-\u097F]+(?:\s[\u0900-\u097F]+)*/g;

// Separators used on the blog
const SEP_RE = /\.{2,}|—|–|\s{3,}/;

interface RawEntry {
  english: string;
  tm_romanized: string;
  tm_devanagari: string;
  category: string;
  type: string;
  notes: string;
  source_url: string;
}

function devanagariScript(text: string): string {
  const matches = text.match(DEVANAGARI_RE);
  return matches ? matches.join(' ') : '';
}

function stripDevanagari(text: string): string {
  return text.replace(/[\u0900-\u097F\s]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseLine(line: string, sourceUrl: string, category: string): RawEntry | null {
  const raw = line.trim();
  if (raw.length < 3) return null;

  const devanagari = devanagariScript(raw);
  const withoutDev = stripDevanagari(raw).trim();

  if (!withoutDev) return null;

  // Split by separator
  const parts = withoutDev.split(SEP_RE).map(p => p.trim()).filter(Boolean);

  if (parts.length < 2) return null;

  // Heuristic: if first part is ALL CAPS or looks like a TM romanized word, and last part is English
  const firstUpper = parts[0] === parts[0].toUpperCase() && /[A-Z]/.test(parts[0]);
  const lastLower  = parts[parts.length - 1] !== parts[parts.length - 1].toUpperCase();

  let english = '';
  let tmRomanized = '';

  if (firstUpper && lastLower) {
    // Pattern B: TM ROMANIZED ... english meaning
    tmRomanized = parts[0].toLowerCase();
    english = parts[parts.length - 1].toLowerCase();
  } else {
    // Pattern A / C: English or romanized first, meaning last
    // Try to detect English by checking if it only has ASCII letters
    const firstIsAscii = /^[a-zA-Z\s]+$/.test(parts[0]);
    if (firstIsAscii && parts.length >= 2) {
      const firstWordEnglish = /^(the |a |an |some |many |my |our )/i.test(parts[0]) ||
        /\b(and|or|of|in|at|for|to|is|are|was|were)\b/i.test(parts[0]);

      if (firstWordEnglish || parts[0].split(' ').length <= 2) {
        english = parts[0].toLowerCase();
        tmRomanized = parts[1].toLowerCase();
      } else {
        tmRomanized = parts[0].toLowerCase();
        english = parts[parts.length - 1].toLowerCase();
      }
    } else {
      tmRomanized = parts[0].toLowerCase();
      english = parts[parts.length - 1].toLowerCase();
    }
  }

  // Validate: english should be ASCII only
  if (!/^[a-z\s/()'-]+$/.test(english)) {
    english = parts[parts.length - 1].replace(/[^a-z\s/()'-]/gi, '').toLowerCase().trim();
  }

  if (!english || !tmRomanized) return null;

  // Determine type
  const wordCount = english.split(' ').length;
  const type = category === 'idioms' ? 'idiom'
    : category === 'proverbs' ? 'proverb'
    : wordCount > 3 ? 'phrase' : 'word';

  return {
    english,
    tm_romanized: tmRomanized,
    tm_devanagari: devanagari,
    category,
    type,
    notes: '',
    source_url: sourceUrl,
  };
}

async function scrapePage(
  url: string,
  category: string
): Promise<RawEntry[]> {
  const fullUrl = `${BASE_URL}${url}`;
  console.log(`  Fetching: ${fullUrl}`);

  try {
    const { data } = await axios.get<string>(fullUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TMD-Scraper/1.0; linguistic research)' },
    });

    const $ = cheerio.load(data);
    const entries: RawEntry[] = [];

    // Extract all text from the post body
    const postBody = $('.post-body, .entry-content, article').first();
    if (!postBody.length) return entries;

    // Process each text node / paragraph
    postBody.find('p, div, br, li, span').addBack().each((_i, el) => {
      const text = $(el).text();
      const lines = text.split(/\n|\r|<br>/).map(l => l.trim()).filter(l => l.length > 5);

      for (const line of lines) {
        // Skip lines that are mostly Devanagari prose (likely narrative, not vocab)
        const devanagariChars = (line.match(/[\u0900-\u097F]/g) || []).length;
        const totalChars = line.replace(/\s/g, '').length;
        if (totalChars > 0 && devanagariChars / totalChars > 0.7) continue;

        // Must contain at least one separator pattern to be a vocab line
        if (!SEP_RE.test(line)) continue;

        const entry = parseLine(line, url, category);
        if (entry) entries.push(entry);
      }
    });

    console.log(`    Found ${entries.length} raw entries`);
    return entries;
  } catch (err) {
    console.warn(`    Failed to fetch ${fullUrl}: ${(err as Error).message}`);
    return [];
  }
}

function dedup(entries: RawEntry[]): RawEntry[] {
  const seen = new Set<string>();
  return entries.filter(e => {
    const key = `${e.english.toLowerCase()}|${e.tm_romanized.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log('=== Thanjavur Marathi Dictionary Scraper ===\n');

  const allRaw: RawEntry[] = [];

  for (const target of TARGET_URLS) {
    console.log(`[${target.label}]`);
    const entries = await scrapePage(target.url, target.category);
    allRaw.push(...entries);
    // Be polite — small delay between requests
    await new Promise(r => setTimeout(r, 800));
  }

  const unique = dedup(allRaw);
  console.log(`\nTotal raw: ${allRaw.length}  →  Unique: ${unique.length}`);

  // Build final entries with IDs
  const categoryCounters: Record<string, number> = {};
  const finalEntries = unique.map(e => {
    const cat = e.category;
    categoryCounters[cat] = (categoryCounters[cat] || 0) + 1;
    const id = `${cat}_${String(categoryCounters[cat]).padStart(3, '0')}`;
    return {
      id,
      english: e.english,
      english_variants: [] as string[],
      tm_romanized: e.tm_romanized,
      tm_devanagari: e.tm_devanagari,
      category: e.category,
      type: e.type,
      notes: e.notes,
      source_url: e.source_url,
    };
  });

  const output = {
    meta: {
      version: '1.0.0',
      totalEntries: finalEntries.length,
      lastUpdated: new Date().toISOString().split('T')[0],
      source: BASE_URL,
    },
    entries: finalEntries,
  };

  const outPath = path.resolve(process.cwd(), 'src/data/dictionary.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Wrote ${finalEntries.length} entries to ${outPath}`);
}

main().catch(err => {
  console.error('Scraper failed:', err);
  process.exit(1);
});
