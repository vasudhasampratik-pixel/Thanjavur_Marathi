import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://tanjoremarathirecipes.blogspot.com';
const MAX_LIST_PAGES = 20;
const REQUEST_DELAY_MS = 450;

type RecipeCategory = 'breakfast' | 'festive' | 'everyday' | 'sweets' | 'quick';

interface RecipeRecord {
  id: string;
  title: string;
  ingredients: string[];
  method: string[];
  category: RecipeCategory;
  source_url: string;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function toAbsoluteUrl(href: string): string {
  if (!href) return BASE_URL;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('/')) return `${BASE_URL}${href}`;
  return `${BASE_URL}/${href}`;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/[\t\r]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

function normalizeTitle(title: string): string {
  return normalizeWhitespace(title)
    .replace(/\s*\|\s*tanjore marathi madhva-authentic recipes\s*$/i, '')
    .replace(/\s*[-–]\s*tanjore marathi madhva-authentic recipes\s*$/i, '')
    .trim();
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function classifyRecipe(title: string): RecipeCategory {
  const t = title.toLowerCase();

  if (/(\bpayasam\b|\bkheer\b|\bladoo\b|\bhalwa\b|\bkesari\b|\bsweet\b|\bshira\b|\bpoli\b)/.test(t)) {
    return 'sweets';
  }

  if (/(\bchutney\b|\bpowder\b|\bpodi\b|\bmethkut\b|\bpickle\b)/.test(t)) {
    return 'quick';
  }

  if (/(\bfestival\b|\bvrat\b|\bpooja\b|\bsanaach\b|\bnaivedyam\b)/.test(t)) {
    return 'festive';
  }

  if (/(\bbreakfast\b|\bidli\b|\bdosa\b|\bupma\b|\bpoha\b|\bpongal\b)/.test(t)) {
    return 'breakfast';
  }

  return 'everyday';
}

function extractPostLinks($: cheerio.CheerioAPI): string[] {
  const links = new Set<string>();

  $('a').each((_i, el) => {
    const href = ($(el).attr('href') ?? '').trim();
    if (!href) return;

    if (!href.includes('tanjoremarathirecipes.blogspot.com')) return;
    if (!/\/\d{4}\/\d{2}\/.+\.html$/.test(href)) return;
    if (href.includes('#')) return;

    links.add(href);
  });

  return [...links];
}

function findOlderPageUrl($: cheerio.CheerioAPI): string | null {
  const olderHref =
    $('a.blog-pager-older-link').attr('href') ||
    $('a:contains("Older Posts")').attr('href') ||
    $('a:contains("Older")').attr('href');

  if (!olderHref) return null;
  return toAbsoluteUrl(olderHref);
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map(line => normalizeWhitespace(line))
    .filter(Boolean);
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^[\u2022\-*]+\s*/, '')
    .replace(/^\d+[.):-]?\s*/, '')
    .trim();
}

function pruneLine(line: string): string {
  return stripListPrefix(
    line
      .replace(/^ingredients\s*:?\s*/i, '')
      .replace(/^method\s*:?\s*/i, '')
      .trim()
  );
}

function extractSections(bodyText: string): { ingredients: string[]; method: string[] } {
  const lines = splitLines(bodyText);
  const ingredientsIdx = lines.findIndex(line => /^ingredients\b\s*:?/i.test(line));
  const methodIdx = lines.findIndex((line, idx) => idx > ingredientsIdx && /^method\b\s*:?/i.test(line));

  if (ingredientsIdx === -1 || methodIdx === -1 || methodIdx <= ingredientsIdx) {
    return { ingredients: [], method: [] };
  }

  const ingredients = lines
    .slice(ingredientsIdx + 1, methodIdx)
    .map(pruneLine)
    .filter(line => line.length > 1)
    .filter(line => !/^(my grandma|whose authentic recipes|daughter of)/i.test(line));

  const stopPattern = /^(posted by|no comments|email this|share to x|side dish|eating procedure|accompaniments?)/i;
  const likelyNotesPattern = /^(this |it |add ghee|mix thickly|can be used|can be mixed|for best taste|the .* is ready)/i;

  const method: string[] = [];
  for (const line of lines.slice(methodIdx + 1)) {
    const cleaned = pruneLine(line);
    if (!cleaned) continue;
    if (stopPattern.test(cleaned)) break;
    if (/^(ingredients\b|method\b)/i.test(cleaned)) continue;
    if (likelyNotesPattern.test(cleaned)) continue;
    method.push(cleaned);
  }

  return {
    ingredients,
    method,
  };
}

async function fetchHtml(url: string): Promise<string> {
  const response = await axios.get<string>(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; tanjore-cookbook-scraper/1.0; educational use)',
    },
  });

  return response.data;
}

async function collectRecipeLinks(): Promise<string[]> {
  const visitedPages = new Set<string>();
  const recipeLinks = new Set<string>();

  let currentPage = `${BASE_URL}/`;

  for (let i = 0; i < MAX_LIST_PAGES; i += 1) {
    if (visitedPages.has(currentPage)) break;
    visitedPages.add(currentPage);

    console.log(`Scanning list page ${i + 1}: ${currentPage}`);
    const html = await fetchHtml(currentPage);
    const $ = cheerio.load(html);

    for (const postUrl of extractPostLinks($)) {
      recipeLinks.add(postUrl);
    }

    const older = findOlderPageUrl($);
    if (!older) break;

    currentPage = older;
    await sleep(REQUEST_DELAY_MS);
  }

  return [...recipeLinks];
}

async function scrapeRecipe(url: string): Promise<RecipeRecord | null> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const title = normalizeTitle(
      $('.post-title, h3.post-title, h1.post-title').first().text() || $('title').first().text()
    );

    if (!title) return null;

    const postBody = $('.post-body, .entry-content, article').first();
    if (!postBody.length) return null;

    postBody.find('br').replaceWith('\n');

    const bodyText = postBody.text();
    const { ingredients, method } = extractSections(bodyText);

    if (ingredients.length === 0 || method.length === 0) {
      return null;
    }

    const id = toSlug(title);

    return {
      id,
      title,
      ingredients,
      method,
      category: classifyRecipe(title),
      source_url: url,
    };
  } catch (error) {
    console.warn(`Failed to scrape ${url}: ${(error as Error).message}`);
    return null;
  }
}

function dedupeByTitle(recipes: RecipeRecord[]): RecipeRecord[] {
  const byTitle = new Map<string, RecipeRecord>();

  for (const recipe of recipes) {
    const key = recipe.title.toLowerCase();
    if (!byTitle.has(key)) {
      byTitle.set(key, recipe);
    }
  }

  return [...byTitle.values()];
}

async function main() {
  console.log('Starting cookbook scrape...');
  const links = await collectRecipeLinks();
  console.log(`Found ${links.length} candidate post links`);

  const recipes: RecipeRecord[] = [];

  for (const [idx, link] of links.entries()) {
    console.log(`(${idx + 1}/${links.length}) Scraping ${link}`);
    const recipe = await scrapeRecipe(link);
    if (recipe) recipes.push(recipe);
    await sleep(REQUEST_DELAY_MS);
  }

  const uniqueRecipes = dedupeByTitle(recipes)
    .sort((a, b) => a.title.localeCompare(b.title));

  const output = {
    meta: {
      version: '1.0.0',
      totalRecipes: uniqueRecipes.length,
      lastUpdated: new Date().toISOString().split('T')[0],
      source: BASE_URL,
      credits: ['Bhumiie Prahalaad', 'Indira Ramarao'],
    },
    recipes: uniqueRecipes,
  };

  const outPath = path.resolve(process.cwd(), 'src/data/cookbook_recipes.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`Saved ${uniqueRecipes.length} recipes to ${outPath}`);
}

main().catch(error => {
  console.error('Cookbook scrape failed:', error);
  process.exit(1);
});
