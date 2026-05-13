import { TreeCanvas } from '../components/familytree/TreeCanvas';
import { GroupLegend } from '../components/familytree/GroupLegend';

export function FamilyTreePage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 pb-24 sm:pb-10">

      {/* Page heading */}
      <div className="text-center py-6 sm:py-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
          Naati — Kinship
        </h2>
        <p className="devanagari text-3xl text-saffron-500 mt-1 leading-snug">नाटी</p>

      </div>

      {/* Legend */}
      <GroupLegend />

      {/* Animated family tree canvas */}
      <TreeCanvas />

      {/* Saavatr disclaimer */}
      <div className="mt-6 rounded-2xl border border-orange-100 bg-saffron-50 px-5 py-4 text-sm text-gray-900 leading-relaxed">
        <p className="font-semibold text-saffron-700 mb-1">
          ⧧ Saavatr (सावत्र) — Step Relations
        </p>
        <p>
          The prefix <span className="font-semibold text-gray-900">Saavatr (सावत्र)</span> is
          added to any relation word to indicate a <em>step</em> relationship.
          For example: <span className="italic">Saavatr Bappa</span> = step-father,{' '}
          <span className="italic">Saavatr Aayi</span> = step-mother,{' '}
          <span className="italic">Saavatr Bhau</span> = step-brother, and so on.
          Conversely, <span className="font-semibold text-gray-900">Sakka (सक्का)</span> means
          "one's own". It is used to clarify a relation is a blood relative, not a step one
          (e.g., <span className="italic">Sakka Bhau</span> = your own brother).
        </p>
      </div>

    </div>
  );
}
