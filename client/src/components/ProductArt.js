// Simple illustrated placeholders per product type, used when a product has no image URL.
const palettes = {
  'Wiper Blades': ['#e6eef7', '#0b5cad'],
  'Washer Fluid': ['#e5f5f3', '#0f8a7d'],
  'Rain Repellent': ['#eaf0ff', '#3b5bdb'],
  'Microfiber Towel': ['#fff4e0', '#d98a00'],
};

function Shape({ type, color }) {
  switch (type) {
    case 'Wiper Blades':
      return (
        <g stroke={color} strokeLinecap="round" fill="none">
          <path d="M28 92 Q70 30 140 22" strokeWidth="7" />
          <path d="M40 104 Q86 48 156 42" strokeWidth="7" opacity=".55" />
          <circle cx="28" cy="92" r="6" fill={color} />
          <circle cx="40" cy="104" r="6" fill={color} opacity=".55" />
        </g>
      );
    case 'Washer Fluid':
      return (
        <g fill={color}>
          <circle cx="62" cy="70" r="22" />
          <circle cx="104" cy="58" r="22" opacity=".7" />
          <circle cx="98" cy="98" r="18" opacity=".45" />
          <path d="M140 30 q8 12 0 18 q-8 -6 0 -18z" opacity=".6" />
        </g>
      );
    case 'Rain Repellent':
      return (
        <g fill={color}>
          <rect x="62" y="40" width="40" height="76" rx="8" />
          <rect x="72" y="26" width="20" height="16" rx="3" opacity=".7" />
          {[[124, 38], [138, 62], [120, 84], [142, 100]].map(([x, y]) => (
            <path key={`${x}-${y}`} d={`M${x} ${y} q6 9 0 13 q-6 -4 0 -13z`} opacity=".55" />
          ))}
        </g>
      );
    case 'Microfiber Towel':
      return (
        <g>
          <rect x="44" y="30" width="96" height="80" rx="6" fill={color} opacity=".85" />
          <g stroke="#fff" strokeOpacity=".55" strokeWidth="2">
            {[46, 62, 78, 94].map((y) => (
              <line key={y} x1="48" x2="136" y1={y} y2={y} />
            ))}
            {[64, 84, 104, 124].map((x) => (
              <line key={x} y1="34" y2="106" x1={x} x2={x} />
            ))}
          </g>
        </g>
      );
    default:
      return <circle cx="92" cy="70" r="30" fill={color} />;
  }
}

export default function ProductArt({ product, className = '' }) {
  if (product.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image} alt={product.name} className={`h-full w-full object-cover ${className}`} />;
  }
  const [bg, fg] = palettes[product.type] || ['#eef3f8', '#0b5cad'];
  return (
    <svg viewBox="0 0 184 140" role="img" aria-label={product.name} className={`h-full w-full ${className}`}>
      <rect width="184" height="140" fill={bg} />
      <Shape type={product.type} color={fg} />
    </svg>
  );
}
