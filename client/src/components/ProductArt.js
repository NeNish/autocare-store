// Fine-line champagne illustrations on a midnight ground, one per product line.
// Used wherever a product has no photograph (set an image URL in Admin to replace it).
import { useId } from 'react';

const LABELS = {
  'Wiper Blades': 'Wiper blades illustration',
  'Washer Fluid': 'Washer fluid tablets illustration',
  'Rain Repellent': 'Rain-repellent atomiser illustration',
  'Microfiber Towel': 'Microfiber drying towel illustration',
};

function Lines({ type, gold }) {
  switch (type) {
    case 'Wiper Blades':
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M62 196 Q118 92 236 70" stroke={gold} strokeWidth="2.2" />
          <path d="M84 214 Q150 118 262 102" stroke={gold} strokeWidth="1.2" opacity="0.55" />
          <path d="M62 196 L150 196" stroke="#d4b27a" strokeOpacity="0.25" />
          <circle cx="62" cy="196" r="7" stroke={gold} strokeWidth="1.2" />
          <circle cx="62" cy="196" r="2" fill="#f1dfb8" />
          <path d="M40 228 Q150 40 300 50" stroke="#c9cdd4" strokeOpacity="0.12" strokeDasharray="2 6" />
        </g>
      );
    case 'Washer Fluid':
      return (
        <g fill="none">
          <ellipse cx="138" cy="170" rx="46" ry="14" stroke={gold} strokeWidth="1.4" />
          <path d="M92 170 v-14 a46 14 0 0 1 92 0 v14" stroke={gold} strokeWidth="1.4" />
          <ellipse cx="138" cy="156" rx="46" ry="14" stroke="#f1dfb8" strokeOpacity="0.35" />
          <ellipse cx="206" cy="134" rx="34" ry="10" stroke={gold} strokeWidth="1.1" opacity="0.7" />
          <path d="M172 134 v-10 a34 10 0 0 1 68 0 v10" stroke={gold} strokeWidth="1.1" opacity="0.7" />
          {[[150, 120, 4], [168, 98, 3], [190, 84, 5], [214, 64, 3], [232, 92, 2.5], [128, 104, 2.5], [250, 54, 4]].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} stroke="#f1dfb8" strokeOpacity="0.7" />
          ))}
        </g>
      );
    case 'Rain Repellent':
      return (
        <g fill="none">
          <rect x="122" y="96" width="56" height="128" rx="14" stroke={gold} strokeWidth="1.4" />
          <rect x="138" y="70" width="24" height="26" rx="4" stroke={gold} strokeWidth="1.2" />
          <path d="M162 80 h20" stroke={gold} strokeWidth="1.2" />
          <path d="M134 126 v70" stroke="#f1dfb8" strokeOpacity="0.4" />
          {[[204, 70], [220, 84], [214, 102], [236, 66], [244, 94], [230, 116], [256, 80]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} q4 6 0 9 q-4 -3 0 -9z`} fill="#f1dfb8" fillOpacity={0.35 + (i % 3) * 0.15} />
          ))}
        </g>
      );
    case 'Microfiber Towel':
      return (
        <g fill="none">
          <path d="M84 92 L236 80 L250 206 L96 220 Z" stroke={gold} strokeWidth="1.4" />
          <path d="M96 220 Q104 236 124 234 L250 206" stroke={gold} strokeWidth="1" opacity="0.6" />
          <g stroke="#f1dfb8" strokeOpacity="0.28">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={`h${i}`} d={`M${86 + i * 2} ${110 + i * 18} L${238 + i * 2} ${98 + i * 18}`} />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={`v${i}`} d={`M${106 + i * 20} ${90 - i * 1.6} L${118 + i * 20} ${216 - i * 1.6}`} />
            ))}
          </g>
        </g>
      );
    default:
      return <circle cx="160" cy="140" r="50" stroke={gold} fill="none" />;
  }
}

export default function ProductArt({ product, className = '' }) {
  // Unique gradient ids per instance: shared ids break when the first copy is hidden
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ids = { bg: `pa-bg-${uid}`, gold: `pa-gold-${uid}`, glow: `pa-glow-${uid}` };
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.name} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <svg
      viewBox="0 0 320 280"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={LABELS[product.type] || product.name}
      className={`h-full w-full ${className}`}
    >
      <defs>
        <radialGradient id={ids.bg} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#1a2136" />
          <stop offset="0.6" stopColor="#0d111b" />
          <stop offset="1" stopColor="#07080b" />
        </radialGradient>
        <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e7c6" />
          <stop offset="0.55" stopColor="#d4b27a" />
          <stop offset="1" stopColor="#8f6f3e" />
        </linearGradient>
        <radialGradient id={ids.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d4b27a" stopOpacity="0.18" />
          <stop offset="1" stopColor="#d4b27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="280" fill={`url(#${ids.bg})`} />
      <circle cx="170" cy="140" r="120" fill={`url(#${ids.glow})`} />
      <circle cx="170" cy="140" r="104" fill="none" stroke="#d4b27a" strokeOpacity="0.08" />
      <Lines type={product.type} gold={`url(#${ids.gold})`} />
      <g stroke="#d4b27a" strokeOpacity="0.3" strokeWidth="0.8">
        <path d="M16 16 h14 M16 16 v14 M304 16 h-14 M304 16 v14 M16 264 h14 M16 264 v-14 M304 264 h-14 M304 264 v-14" />
      </g>
    </svg>
  );
}
