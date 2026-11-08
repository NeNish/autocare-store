// Fine-line champagne illustrations on a midnight ground, one per product line.
// Used wherever a product has no photograph (set an image URL in Admin to replace it).
import { useId } from 'react';

const LABELS = {
  'Wiper Blades': 'Wiper blades illustration',
  'Washer Fluid': 'Washer fluid tablets illustration',
  'Rain Repellent': 'Rain-repellent atomiser illustration',
  'Microfiber Towel': 'Microfiber drying towel illustration',
  Kit: 'Care kit illustration',
};

function Lines({ type, accent }) {
  switch (type) {
    case 'Wiper Blades':
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M62 196 Q118 92 236 70" stroke={accent} strokeWidth="2.2" />
          <path d="M84 214 Q150 118 262 102" stroke={accent} strokeWidth="1.2" opacity="0.55" />
          <path d="M62 196 L150 196" stroke="#2f8cff" strokeOpacity="0.25" />
          <circle cx="62" cy="196" r="7" stroke={accent} strokeWidth="1.2" />
          <circle cx="62" cy="196" r="2" fill="#bfe3ff" />
          <path d="M40 228 Q150 40 300 50" stroke="#c3cad5" strokeOpacity="0.12" strokeDasharray="2 6" />
        </g>
      );
    case 'Washer Fluid':
      return (
        <g fill="none">
          <ellipse cx="138" cy="170" rx="46" ry="14" stroke={accent} strokeWidth="1.4" />
          <path d="M92 170 v-14 a46 14 0 0 1 92 0 v14" stroke={accent} strokeWidth="1.4" />
          <ellipse cx="138" cy="156" rx="46" ry="14" stroke="#bfe3ff" strokeOpacity="0.35" />
          <ellipse cx="206" cy="134" rx="34" ry="10" stroke={accent} strokeWidth="1.1" opacity="0.7" />
          <path d="M172 134 v-10 a34 10 0 0 1 68 0 v10" stroke={accent} strokeWidth="1.1" opacity="0.7" />
          {[[150, 120, 4], [168, 98, 3], [190, 84, 5], [214, 64, 3], [232, 92, 2.5], [128, 104, 2.5], [250, 54, 4]].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} stroke="#bfe3ff" strokeOpacity="0.7" />
          ))}
        </g>
      );
    case 'Rain Repellent':
      return (
        <g fill="none">
          <rect x="122" y="96" width="56" height="128" rx="14" stroke={accent} strokeWidth="1.4" />
          <rect x="138" y="70" width="24" height="26" rx="4" stroke={accent} strokeWidth="1.2" />
          <path d="M162 80 h20" stroke={accent} strokeWidth="1.2" />
          <path d="M134 126 v70" stroke="#bfe3ff" strokeOpacity="0.4" />
          {[[204, 70], [220, 84], [214, 102], [236, 66], [244, 94], [230, 116], [256, 80]].map(([x, y], i) => (
            <path key={i} d={`M${x} ${y} q4 6 0 9 q-4 -3 0 -9z`} fill="#bfe3ff" fillOpacity={0.35 + (i % 3) * 0.15} />
          ))}
        </g>
      );
    case 'Microfiber Towel':
      return (
        <g fill="none">
          <path d="M84 92 L236 80 L250 206 L96 220 Z" stroke={accent} strokeWidth="1.4" />
          <path d="M96 220 Q104 236 124 234 L250 206" stroke={accent} strokeWidth="1" opacity="0.6" />
          <g stroke="#bfe3ff" strokeOpacity="0.28">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path key={`h${i}`} d={`M${86 + i * 2} ${110 + i * 18} L${238 + i * 2} ${98 + i * 18}`} />
            ))}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <path key={`v${i}`} d={`M${106 + i * 20} ${90 - i * 1.6} L${118 + i * 20} ${216 - i * 1.6}`} />
            ))}
          </g>
        </g>
      );
    case 'Kit':
      return (
        <g fill="none">
          <path d="M70 140 L160 112 L250 140 L160 168 Z" stroke={accent} strokeWidth="1.2" opacity="0.7" />
          <path d="M70 140 V206 L160 236 L250 206 V140" stroke={accent} strokeWidth="1.4" />
          <path d="M160 168 V236" stroke={accent} strokeWidth="1" opacity="0.6" />
          <rect x="112" y="62" width="30" height="78" rx="9" stroke="#bfe3ff" strokeOpacity="0.8" strokeWidth="1.2" />
          <rect x="121" y="46" width="12" height="16" rx="3" stroke="#bfe3ff" strokeOpacity="0.8" />
          <path d="M156 98 L214 88 L222 132 L164 142 Z" stroke="#bfe3ff" strokeOpacity="0.5" />
          <ellipse cx="196" cy="74" rx="18" ry="6" stroke={accent} strokeWidth="1.1" />
          <path d="M178 74 v-6 a18 6 0 0 1 36 0 v6" stroke={accent} strokeWidth="1.1" />
        </g>
      );
    default:
      return <circle cx="160" cy="140" r="50" stroke={accent} fill="none" />;
  }
}

export default function ProductArt({ product, className = '' }) {
  // Unique gradient ids per instance: shared ids break when the first copy is hidden
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ids = { bg: `pa-bg-${uid}`, accent: `pa-accent-${uid}`, glow: `pa-glow-${uid}` };
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
          <stop offset="0" stopColor="#0e1a2b" />
          <stop offset="0.6" stopColor="#0a0e15" />
          <stop offset="1" stopColor="#050608" />
        </radialGradient>
        <linearGradient id={ids.accent} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#2f8cff" />
          <stop offset="1" stopColor="#1a5fd0" />
        </linearGradient>
        <radialGradient id={ids.glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2f8cff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#2f8cff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="280" fill={`url(#${ids.bg})`} />
      <circle cx="170" cy="140" r="120" fill={`url(#${ids.glow})`} />
      <circle cx="170" cy="140" r="104" fill="none" stroke="#2f8cff" strokeOpacity="0.08" />
      <Lines type={product.type} accent={`url(#${ids.accent})`} />
      <g stroke="#2f8cff" strokeOpacity="0.3" strokeWidth="0.8">
        <path d="M16 16 h14 M16 16 v14 M304 16 h-14 M304 16 v14 M16 264 h14 M16 264 v-14 M304 264 h-14 M304 264 v-14" />
      </g>
    </svg>
  );
}
