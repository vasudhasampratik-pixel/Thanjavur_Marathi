import type { Category } from '../types';

const categoryConfig: Record<Category, { label: string; color: string }> = {
  food:        { label: 'Food',        color: 'bg-amber-100 text-amber-800 border-amber-200' },
  emotions:    { label: 'Emotions',    color: 'bg-pink-100 text-pink-800 border-pink-200' },
  body:        { label: 'Body',        color: 'bg-red-100 text-red-800 border-red-200' },
  nature:      { label: 'Nature',      color: 'bg-green-100 text-green-800 border-green-200' },
  professions: { label: 'Professions', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  relations:   { label: 'Relations',   color: 'bg-purple-100 text-purple-800 border-purple-200' },
  colours:     { label: 'Colours',     color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  numbers:     { label: 'Numbers',     color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  time:        { label: 'Time',        color: 'bg-sky-100 text-sky-800 border-sky-200' },
  household:   { label: 'Household',   color: 'bg-orange-100 text-orange-800 border-orange-200' },
  idioms:      { label: 'Idiom',       color: 'bg-teal-100 text-teal-800 border-teal-200' },
  proverbs:    { label: 'Proverb',     color: 'bg-lime-100 text-lime-800 border-lime-200' },
  ceremonies:  { label: 'Ceremonies',  color: 'bg-rose-100 text-rose-800 border-rose-200' },
  misc:        { label: 'Misc',        color: 'bg-gray-100 text-gray-900 border-gray-200' },
};

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? categoryConfig.misc;
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
