import { useMemo, useState } from 'react';
import cookbookData from '../data/cookbook_recipes.json';

const ASSET_BASE = import.meta.env.BASE_URL;

type RecipeCategory = 'breakfast' | 'festive' | 'everyday' | 'sweets' | 'quick';

type CategoryFilter = RecipeCategory | 'all';

interface CookbookRecipe {
  id: string;
  title: string;
  ingredients: string[];
  method: string[];
  category: RecipeCategory;
}

interface CookbookData {
  meta: {
    version: string;
    totalRecipes: number;
    lastUpdated: string;
    source: string;
    credits: string[];
  };
  recipes: CookbookRecipe[];
}

const data = cookbookData as CookbookData;
const recipes = data.recipes;

const CATEGORY_META: Record<RecipeCategory, { label: string; subtitle: string }> = {
  breakfast: { label: 'Breakfast', subtitle: 'Light starts' },
  festive: { label: 'Festive', subtitle: 'Celebration dishes' },
  everyday: { label: 'Everyday', subtitle: 'Home staples' },
  sweets: { label: 'Sweets', subtitle: 'Comfort treats' },
  quick: { label: 'Quick', subtitle: 'Fast accompaniments' },
};

const CATEGORY_ICON: Record<RecipeCategory, string> = {
  breakfast: '🍳',
  festive: '🪔',
  everyday: '🍲',
  sweets: '🍮',
  quick: '🥣',
};

const CATEGORY_GRADIENT: Record<RecipeCategory, string> = {
  breakfast: 'from-amber-200 via-orange-100 to-yellow-50',
  festive: 'from-rose-200 via-orange-100 to-amber-50',
  everyday: 'from-emerald-100 via-lime-50 to-orange-50',
  sweets: 'from-pink-200 via-rose-100 to-orange-50',
  quick: 'from-sky-200 via-cyan-100 to-orange-50',
};

const RECIPE_IMAGE_BY_ID: Record<string, string> = {
  'aalach-chutney': `${ASSET_BASE}cookbook-imgs/aalach_chutney.jpg`,
  'ambat-bhaji-molai-kheere': `${ASSET_BASE}cookbook-imgs/ambhat_bhaji.jpg`,
  'appeech-kheer': `${ASSET_BASE}cookbook-imgs/apeech_kheer.jpg`,
  'edaach-narthangai-gojju': `${ASSET_BASE}cookbook-imgs/edaach_gojju.jpg`,
  'paanak': `${ASSET_BASE}cookbook-imgs/paanak.jpg`,
  'pumpkin-kadi': `${ASSET_BASE}cookbook-imgs/pumpkin_kadhi.jpg`,
  'daangar': `${ASSET_BASE}cookbook-imgs/daangar.jpg`,
  'vangi-dahi-bharit': `${ASSET_BASE}cookbook-imgs/vangyache_bharit.jpg`,
  'gola-unda-sambhar': `${ASSET_BASE}cookbook-imgs/unda_sambhar.jpg`,
  'maatoda-bhaji': `${ASSET_BASE}cookbook-imgs/maatoda_bhaaji.jpg`,
  'waran-bhaath': `${ASSET_BASE}cookbook-imgs/varan_bhaath.PNG`,
};

const PLACEHOLDER_RECIPE_IMAGE = `${ASSET_BASE}cookbook-imgs/placeholder.svg`;

function getRecipeImageSrc(recipe: CookbookRecipe): string {
  return RECIPE_IMAGE_BY_ID[recipe.id] ?? PLACEHOLDER_RECIPE_IMAGE;
}

function ingredientKey(rawIngredient: string): string {
  return rawIngredient
    .split('-')[0]
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zA-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function prettyIngredientKey(value: string): string {
  return value
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function countByCategory(items: CookbookRecipe[]): Record<RecipeCategory, number> {
  return items.reduce(
    (acc, item) => {
      acc[item.category] += 1;
      return acc;
    },
    {
      breakfast: 0,
      festive: 0,
      everyday: 0,
      sweets: 0,
      quick: 0,
    }
  );
}

function RecipeDetailModal({
  recipe,
  onClose,
}: {
  recipe: CookbookRecipe;
  onClose: () => void;
}) {
  const [cookMode, setCookMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const maxStep = recipe.method.length - 1;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <section
          className="w-full sm:max-w-3xl max-h-[94vh] overflow-hidden bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-orange-100 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={recipe.title}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b border-orange-100 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-peacock-700 font-semibold">
                {CATEGORY_ICON[recipe.category]} {CATEGORY_META[recipe.category].label}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight mt-1">{recipe.title}</h3>
            </div>
            <button
              className="w-9 h-9 rounded-full bg-orange-50 text-gray-900 hover:bg-orange-100"
              onClick={onClose}
              aria-label="Close recipe"
            >
              x
            </button>
          </div>


          <div className="px-5 pt-4 pb-3 border-b border-orange-100 flex flex-wrap items-center gap-3 bg-orange-50/50">
            <button
              className={[
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                cookMode ? 'bg-saffron-500 text-white' : 'bg-orange-50 text-saffron-700 hover:bg-orange-100',
              ].join(' ')}
              onClick={() => {
                setCookMode(v => !v);
                setStepIndex(0);
              }}
            >
              {cookMode ? 'Exit Cook Mode' : 'Enter Cook Mode'}
            </button>
            <span className="text-xs text-gray-900">🍳 Interactive cooking view</span>
          </div>

          <div className="overflow-y-auto px-5 py-5 space-y-6">
            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">🧂 Ingredients</h4>
              <ul className="space-y-2">
                {recipe.ingredients.map(item => (
                  <li
                    key={item}
                    className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-gray-900"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">👩‍🍳 Method</h4>

              {cookMode ? (
                <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-saffron-700 font-semibold mb-2">
                    Step {stepIndex + 1} of {recipe.method.length}
                  </p>
                  <p className="text-base text-gray-900 leading-relaxed">{recipe.method[stepIndex]}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="px-3 py-2 rounded-lg bg-white border border-orange-200 text-sm text-gray-900 disabled:opacity-40"
                      onClick={() => setStepIndex(i => i - 1)}
                      disabled={stepIndex === 0}
                    >
                        ← Previous
                    </button>
                    <button
                      className="px-3 py-2 rounded-lg bg-saffron-500 text-white text-sm disabled:opacity-40"
                      onClick={() => setStepIndex(i => i + 1)}
                      disabled={stepIndex === maxStep}
                    >
                        Next →
                    </button>
                  </div>
                </div>
              ) : (
                <ol className="space-y-2">
                  {recipe.method.map((step, index) => (
                    <li
                      key={`${recipe.id}-step-${index}`}
                      className="rounded-xl border border-orange-100 bg-white px-3 py-3 text-sm text-gray-900"
                    >
                      <span className="font-semibold text-saffron-700 mr-1">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </section>
      </div>
    </>
  );
}

export function CookBookPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<CookbookRecipe | null>(null);
  const [showSambharStory, setShowSambharStory] = useState(false);

  const categoryCount = useMemo(() => countByCategory(recipes), []);

  const ingredientSuggestions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        const key = ingredientKey(ingredient);
        if (!key || key.length < 3) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
      .map(([name]) => name);
  }, []);

  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return recipes.filter(recipe => {
      if (activeCategory !== 'all' && recipe.category !== activeCategory) {
        return false;
      }

      if (selectedIngredients.length > 0) {
        const keys = recipe.ingredients.map(ingredient => ingredientKey(ingredient));
        const hasAll = selectedIngredients.every(selected =>
          keys.some(key => key.includes(selected) || selected.includes(key))
        );
        if (!hasAll) return false;
      }

      if (!q) return true;

      const searchable = [
        recipe.title,
        ...recipe.ingredients,
        ...recipe.method,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [activeCategory, query, selectedIngredients]);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(current =>
      current.includes(ingredient)
        ? current.filter(value => value !== ingredient)
        : [...current, ingredient]
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pb-28 sm:pb-12">

      {/* Page heading */}
      <div className="text-center py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          CookBook — The Living Thali
        </h2>
        <p className="devanagari text-3xl text-saffron-500 mt-1 leading-snug">पाकपुस्तक</p>
      </div>


      <section className="mt-6 rounded-2xl border border-saffron-200 bg-saffron-50 p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-saffron-700 font-semibold">Fun Fact</p>
        <h3 className="text-xl font-bold text-gray-900 mt-1">🍛 Sambhar Was Born In Our Thanjavur Marathi Story</h3>
        <p className="text-sm text-gray-900 mt-2 leading-relaxed">
          Our community history says Sambhar traces back to the Thanjavur Maratha court. A cook is believed to have adapted the Marathi Amti using tur dal and tamarind, and the dish was named after Sambhaji Maharaj.
        </p>

        <button
          onClick={() => setShowSambharStory(v => !v)}
          className="mt-3 px-4 py-2 rounded-full bg-white border border-saffron-300 text-saffron-800 text-sm font-semibold hover:bg-saffron-100 transition-colors"
        >
          {showSambharStory ? 'Hide the full story' : 'Read the full story'}
        </button>

        {showSambharStory && (
          <div className="mt-4 rounded-xl border border-orange-200 bg-white p-4">
            <ol className="space-y-3 text-sm text-gray-900 leading-relaxed">
              <li>
                <span className="font-semibold text-gray-900">1.</span> Marathi settlers had a long presence in northern and central parts of present-day Tamil Nadu, and the Thanjavur Marathi ethno-linguistic community took shape in the 17th century after the Vijayanagar period.
              </li>
              <li>
                <span className="font-semibold text-gray-900">2.</span> In 1674, Thanjavur came under Ekoji (Venkoji) Raje Bhonsale, half-brother of Chhatrapati Shivaji Maharaj, establishing the Thanjavur Maratha Kingdom.
              </li>
              <li>
                <span className="font-semibold text-gray-900">3.</span> During Serfoji I (1712-1726), Marathi Brahmins were invited to settle in Thanjavur with land incentives, and the community deeply contributed to arts, literature, and cuisine.
              </li>
              <li>
                <span className="font-semibold text-gray-900">4.</span> One widely cited tradition says that during Serfoji I's reign, a royal cook modified Amti by using tur dal and tamarind.
              </li>
              <li>
                <span className="font-semibold text-gray-900">5.</span> The dish impressed the court, and with Sambhaji Maharaj as the guest of honor that day, the dish came to be called Sambhar.
              </li>
              <li>
                <span className="font-semibold text-gray-900">6.</span> Over time, many communities adapted it, and today there are 50+ regional Sambhar versions across South India.
              </li>
            </ol>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="text-sm uppercase tracking-[0.16em] text-gray-900 font-semibold mb-3">Recipe Clusters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveCategory('all')}
            className={[
              'rounded-2xl px-3 py-4 border text-left transition-all',
              activeCategory === 'all'
                ? 'bg-saffron-500 border-saffron-500 text-white shadow'
                : 'bg-white border-orange-100 text-gray-900 hover:border-saffron-300',
            ].join(' ')}
          >
            <p className="text-sm font-semibold">All</p>
            <p className="text-xs opacity-80">✨ {recipes.length} dishes</p>
          </button>

          {(Object.keys(CATEGORY_META) as RecipeCategory[]).map(category => {
            const isActive = activeCategory === category;
            const meta = CATEGORY_META[category];
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={[
                  'rounded-2xl px-3 py-4 border text-left transition-all bg-white',
                  isActive
                    ? 'border-saffron-500 text-gray-900 shadow'
                    : 'border-orange-100 text-gray-900 hover:border-saffron-300',
                ].join(' ')}
              >
                <p className="text-sm font-semibold">{CATEGORY_ICON[category]} {meta.label}</p>
                <p className="text-xs opacity-80">{meta.subtitle}</p>
                <p className="text-xs opacity-80 mt-1">{categoryCount[category]} dishes</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-orange-100 bg-white p-4 sm:p-5">
        <h3 className="text-lg font-semibold text-gray-900">🧺 Ingredient Mode</h3>
        <p className="text-sm text-gray-900 mt-1">Tap what you have, and the cookbook narrows to matching recipes.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {ingredientSuggestions.map(item => {
            const isActive = selectedIngredients.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleIngredient(item)}
                className={[
                  'px-3 py-1.5 rounded-full text-xs sm:text-sm border transition-colors',
                  isActive
                    ? 'bg-peacock-500 text-white border-peacock-500'
                    : 'bg-peacock-50 text-peacock-800 border-peacock-100 hover:bg-peacock-100',
                ].join(' ')}
              >
                {prettyIngredientKey(item)}
              </button>
            );
          })}

          {selectedIngredients.length > 0 && (
            <button
              onClick={() => setSelectedIngredients([])}
              className="px-3 py-1.5 rounded-full text-xs sm:text-sm border border-orange-200 text-gray-900 hover:bg-orange-50"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <section className="mt-5">
        <label htmlFor="recipe-search" className="sr-only">
          Search recipes
        </label>
        <input
          id="recipe-search"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search dish, ingredient, or method..."
          className="w-full rounded-xl border-2 border-orange-200 bg-white px-4 py-3 text-sm sm:text-base text-gray-900 placeholder:text-gray-900 focus:outline-none focus:border-saffron-500"
        />
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Recipes</h3>
          <p className="text-sm text-gray-900">{filteredRecipes.length} shown</p>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 px-4 py-8 text-center text-gray-900">
            No recipes match the current filters. Try clearing ingredients or changing category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredRecipes.map(recipe => (
              <button
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="text-left rounded-2xl border border-orange-100 bg-white p-3 hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
              >
                <div
                  className="mb-3 rounded-xl h-32 sm:h-36 border border-orange-100 overflow-hidden relative"
                >
                  <img
                    src={getRecipeImageSrc(recipe)}
                    alt={`${recipe.title} dish preview`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.includes(PLACEHOLDER_RECIPE_IMAGE)) return;
                      target.src = PLACEHOLDER_RECIPE_IMAGE;
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${CATEGORY_GRADIENT[recipe.category]} opacity-20`} />
                </div>
                <p className="text-xs uppercase tracking-[0.16em] text-peacock-700 font-semibold">
                  {CATEGORY_META[recipe.category].label}
                </p>
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mt-1 leading-tight line-clamp-2">{recipe.title}</h4>
                <p className="text-xs sm:text-sm text-gray-900 mt-2 line-clamp-2">
                  {recipe.ingredients.slice(0, 3).join(' | ')}
                </p>
                <p className="text-xs sm:text-sm text-saffron-700 font-medium mt-3">Open ingredients + method</p>
              </button>
            ))}
          </div>
        )}
      </section>


      {selectedRecipe && (
        <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      )}
    </div>
  );
}
