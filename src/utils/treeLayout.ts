import type { RelationNode, RelationEdge } from '../data/relations';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 760;

// Node pill dimensions
export const NODE_W = 100;
export const NODE_H = 46;

/** Build an SVG cubic-bezier path string between two node centers. */
export function buildEdgePath(
  from: RelationNode,
  to: RelationNode,
): string {
  const x1 = from.x;
  const y1 = from.y;
  const x2 = to.x;
  const y2 = to.y;

  // Control points: pull each handle 40% of the vertical distance toward the midpoint
  const dy = y2 - y1;
  const dx = x2 - x1;

  let cx1: number;
  let cy1: number;
  let cx2: number;
  let cy2: number;

  // Predominantly vertical connection
  if (Math.abs(dy) >= Math.abs(dx)) {
    cx1 = x1;
    cy1 = y1 + dy * 0.5;
    cx2 = x2;
    cy2 = y2 - dy * 0.5;
  } else {
    // Predominantly horizontal connection
    cx1 = x1 + dx * 0.5;
    cy1 = y1;
    cx2 = x2 - dx * 0.5;
    cy2 = y2;
  }

  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

/** Return Tailwind-compatible stroke color and dash config for each edge type. */
export function edgeStyle(type: RelationEdge['type']): {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity: number;
} {
  switch (type) {
    case 'blood':
      return { stroke: '#ffa47a', strokeWidth: 2, opacity: 0.85 };   // saffron-300
    case 'marriage':
      return { stroke: '#72c9a5', strokeWidth: 2, opacity: 0.85 };   // peacock-300
    case 'step':
      return { stroke: '#9ca3af', strokeWidth: 1.5, strokeDasharray: '5 4', opacity: 0.7 }; // gray-400
    case 'sibling':
      return { stroke: '#93c5fd', strokeWidth: 2, opacity: 0.75 };   // blue-300
    default:
      return { stroke: '#d1d5db', strokeWidth: 1.5, opacity: 0.6 };
  }
}

/** Returns Tailwind class strings (bg + border + text) per group. */
export function groupStyle(group: RelationNode['group']): {
  bg: string;
  border: string;
  text: string;
  label: string;
} {
  switch (group) {
    case 'you':
      return { bg: 'bg-saffron-500', border: 'border-saffron-600', text: 'text-white', label: 'You' };
    case 'spouse':
      return { bg: 'bg-peacock-500', border: 'border-peacock-600', text: 'text-white', label: 'Spouse' };
    case 'core':
      return { bg: 'bg-saffron-100', border: 'border-saffron-400', text: 'text-saffron-900', label: 'Core Family' };
    case 'paternal':
      return { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', label: "Father's Side" };
    case 'maternal':
      return { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', label: "Mother's Side" };
    case 'siblings':
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', label: 'Siblings' };
    case 'spouse_side':
      return { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', label: "Spouse's Family" };
    case 'inlaws':
      return { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-900', label: 'In-Laws' };
    case 'childrens_inlaw':
      return { bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-900', label: "Children's In-Laws" };
    case 'step':
      return { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900', label: 'Step Relations' };
    default:
      return { bg: 'bg-white', border: 'border-gray-300', text: 'text-gray-900', label: 'Other' };
  }
}

export const GROUP_ORDER: RelationNode['group'][] = [
  'you',
  'spouse',
  'core',
  'paternal',
  'maternal',
  'siblings',
  'spouse_side',
  'inlaws',
  'childrens_inlaw',
  'step',
];
