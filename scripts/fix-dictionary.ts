/**
 * fix-dictionary.ts
 * Swaps `english` ↔ `tm_romanized` for entries where the fields were reversed
 * by the scraper, and fixes obvious category/garbage errors.
 *
 * Detection heuristic:
 *   An entry needs swapping when `tm_romanized` looks like English
 *   (or `english` looks like TM romanized).
 *
 * Run: npx tsx scripts/fix-dictionary.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// A broad set of English words and patterns likely to appear in the data.
// We check whether a given string "looks English" vs "looks TM romanized".
// ---------------------------------------------------------------------------
const ENGLISH_WORDS = new Set([
  // common foods
  'rice','wheat','salt','sugar','oil','water','milk','tamarind','coconut','pepper',
  'flour','lentil','lentils','chilli','chillies','chili','mustard','coriander',
  'fenugreek','cumin','sesame','turmeric','asafoetida','jaggery','ghee','butter',
  'onion','garlic','ginger','tomato','potato','eggplant','brinjal','spinach',
  'greens','vegetable','vegetables','curry','rasam','sambhar','pickle',
  'banana','mango','jackfruit','guava','lemon','lime','orange','grape','fig',
  'papaya','pineapple','pomegranate','sapota','custard','apple','berry',
  'puffed','grain','spice','powder','mixture','mix','dry','fresh','raw',
  'palm','coconut palm','betel','areca','neem','bamboo','banyan','teak',
  'flowers','leaves','seeds','root','bark','stem','trunk','branch',
  'pods','peas','beans','chickpeas','gram','black','green','split','whole',
  // tastes
  'spicy','hot','bitter','sweet','sour','salty','bland','tasteless','tangy',
  'pungent','astringent','oily','rich','creamy',
  // emotions / character
  'anger','angry','happiness','happy','joy','joyful','sad','sadness','sorrow',
  'fear','afraid','scared','jealousy','jealous','love','affection','shame',
  'embarrassment','surprise','surprised','shocked','astonished','shy',
  'proud','pride','frustration','frustrated','confused','lonely','lonely',
  'brave','cowardly','greedy','generous','kind','cruel','honest','lazy',
  'hardworking','stubborn','humble','arrogant','patient','impatient',
  // body / sickness
  'fever','temperature','cough','coughing','cold','pain','ache','hurt',
  'wound','cut','injury','headache','stomach','vomiting','nausea','diarrhoea',
  'diarrhea','constipation','fatigue','tired','weak','dizzy','swelling',
  'rash','itching','infection','disease','sick','ill','healthy',
  'eye','ear','nose','mouth','tongue','teeth','tooth','throat','neck',
  'chest','heart','lung','stomach','kidney','liver','hand','arm','leg',
  'foot','finger','toe','skin','hair','head','back','shoulder','knee',
  'elbow','wrist','ankle','hip','spine','brain','blood',
  // professions
  'teacher','tutor','master','tailor','lawyer','advocate','attorney',
  'clerk','doctor','physician','washerman','laundry','blacksmith','ironsmith',
  'carpenter','goldsmith','silversmith','potter','priest','farmer','weaver',
  'cook','servant','guard','soldier','merchant','trader','moneylender',
  'astrologer','midwife','barber',
  // relations
  'father','mother','brother','sister','son','daughter','husband','wife',
  'grandfather','grandmother','uncle','aunt','nephew','niece','cousin',
  'father-in-law','mother-in-law','brother-in-law','sister-in-law',
  'grandson','granddaughter','elder','younger','paternal','maternal',
  // colours / materials
  'red','white','black','yellow','green','blue','violet','purple','pink',
  'orange','brown','grey','grey','golden','silver','copper','iron','steel',
  'brass','bronze','gold','platinum',
  // numbers
  'one','two','three','four','five','six','seven','eight','nine','ten',
  'eleven','twelve','hundred','thousand','million','half','quarter',
  // time
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
  'january','february','march','april','may','june','july','august',
  'september','october','november','december','morning','afternoon','evening',
  'night','midnight','noon','today','tomorrow','yesterday','day','week',
  'month','year','hour','minute','second','time','dawn','dusk','season',
  // household
  'pillow','broom','pot','plate','cup','glass','bowl','spoon','ladle',
  'vessel','utensil','pan','lid','mat','floor','ceiling','wall','door',
  'window','roof','stair','well','lamp','light','fire','smoke','ash',
  'bed','chair','table','shelf','box','bag','basket','cloth','thread',
  'needle','rope','stone','wood','mud','sand','iron','lock','key',
  // ceremonies / rituals
  'wedding','marriage','birth','death','ritual','ceremony','festival',
  'prayer','worship','offering','lamp','incense','flower','garland','vow',
  'blessing','auspicious','holy','sacred','idol','temple','god','goddess',
  // nature / pests
  'rat','mouse','cockroach','ant','mosquito','fly','bee','wasp','spider',
  'lizard','snake','scorpion','frog','crow','sparrow','parrot','pigeon',
  'dog','cat','cow','buffalo','goat','sheep','horse','monkey','elephant',
  'pests','insects','pest','insect',
  // misc common
  'yes','no','come','go','eat','drink','sleep','wake','sit','stand','run',
  'walk','talk','speak','listen','see','look','give','take','put','keep',
  'open','close','wash','clean','cook','make','do','say','tell','ask',
  'what','where','when','how','who','why','which','this','that','here',
  'there','now','then','again','always','never','sometimes','often',
  'very','too','also','not','good','bad','big','small','tall','short',
  'old','new','young','long','wide','narrow','heavy','light','hot','cold',
  'early','late','fast','slow','near','far','more','less','all','some',
  'many','much','few','little','only','just','still','already','yet',
  'innocent','blameless','pack','send','dismiss','away','pure','clean',
  // body actions
  'cover','pillow cover','wash','boil','grind','cut','slice','peel',
  'fry','steam','roast','bake','stir','mix','pour','strain',
  // descriptors that appear as translations
  'paste','pulp','liquid','powder','seeds','whole','dried','fresh',
  'cooked','raw','boiled','fried','steamed','roasted',
]);

// Patterns that strongly suggest TM romanized (not English)
// Double vowels, typical TM endings, etc.
const TM_PATTERN = /\b(?:aach|ach|acha|ii|aa|oo|ee|kh|gh|ch|th|dh|bh|ph|ng|ch|sh)\b|[aeiou]{2}/i;

function looksEnglish(s: string): number {
  const words = s.toLowerCase().split(/\s+/);
  let score = 0;
  for (const w of words) {
    if (ENGLISH_WORDS.has(w)) score += 2;
    // English word patterns: common suffixes, simple structure
    if (/^[a-z]+(ing|tion|er|ed|ly|ness|ful|less|al|ous|ic|ary|ment|ance|ence|ist|ism)$/.test(w)) score += 1;
    // TM-typical patterns reduce score
    if (TM_PATTERN.test(w)) score -= 1;
  }
  return score;
}

function looksLikeJunk(s: string): boolean {
  // Drop entries where english or tm_romanized is clearly garbage
  if (!s || s.length < 2) return true;
  if (/^\d+$/.test(s)) return true;
  // Strings that are purely Devanagari characters in a romanized field
  if (/^[\u0900-\u097F\s]+$/.test(s)) return true;
  return false;
}

interface Entry {
  id: string;
  english: string;
  english_variants: string[];
  tm_romanized: string;
  tm_devanagari: string;
  category: string;
  type: string;
  notes: string;
  source_url: string;
}

interface Dictionary {
  meta: { version: string; totalEntries: number; lastUpdated: string; source: string };
  entries: Entry[];
}

const dictPath = path.resolve(process.cwd(), 'src/data/dictionary.json');
const dict: Dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));

let swapped = 0;
let removed = 0;
const fixed: Entry[] = [];

for (const entry of dict.entries) {
  // Drop obviously garbage entries
  if (looksLikeJunk(entry.english) && looksLikeJunk(entry.tm_romanized)) {
    removed++;
    continue;
  }

  // Detect swap: tm_romanized looks more English than english
  const englishScore = looksEnglish(entry.english);
  const tmScore = looksEnglish(entry.tm_romanized);

  if (tmScore > englishScore) {
    // Swap the fields
    const tmp = entry.english;
    entry.english = entry.tm_romanized;
    entry.tm_romanized = tmp;
    swapped++;
  }

  // Clean up english field: lowercase, strip leading/trailing punctuation
  entry.english = entry.english
    .toLowerCase()
    .replace(/^[^a-z]+/, '')
    .replace(/[^a-z\s/()'-]+$/, '')
    .trim();

  entry.tm_romanized = entry.tm_romanized.toLowerCase().trim();

  if (!entry.english || !entry.tm_romanized) {
    removed++;
    continue;
  }

  fixed.push(entry);
}

// Re-ID entries to be clean
const categoryCounters: Record<string, number> = {};
for (const entry of fixed) {
  const cat = entry.category;
  categoryCounters[cat] = (categoryCounters[cat] || 0) + 1;
  entry.id = `${cat}_${String(categoryCounters[cat]).padStart(3, '0')}`;
}

dict.entries = fixed;
dict.meta.totalEntries = fixed.length;
dict.meta.lastUpdated = new Date().toISOString().split('T')[0];

fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2), 'utf-8');

console.log(`✅ Fixed dictionary:`);
console.log(`   Swapped fields : ${swapped}`);
console.log(`   Removed junk   : ${removed}`);
console.log(`   Final entries  : ${fixed.length}`);
console.log(`   Written to     : ${dictPath}`);
