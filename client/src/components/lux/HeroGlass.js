// The hero centrepiece: a sculpted pane of windshield glass floating in space.
// Raindrops bead on it until a gold wiper blade sweeps them away; the whole
// object tilts in 3D with the pointer (driven by data-tilt in MotionRuntime).

const DROPS = [
  [118, 92, 7], [164, 70, 4.5], [212, 112, 6], [262, 84, 3.5], [300, 128, 8], [352, 96, 5],
  [402, 132, 4], [440, 98, 6.5], [150, 150, 5.5], [204, 178, 3.5], [248, 154, 7.5], [296, 188, 4.5],
  [344, 166, 6], [392, 192, 3.5], [430, 168, 5], [176, 224, 4], [226, 236, 6.5], [276, 226, 3.5],
  [324, 242, 5.5], [372, 230, 7], [418, 238, 4], [132, 196, 3], [470, 140, 3.5], [96, 140, 4],
];

export default function HeroGlass() {
  return (
    <div
      data-tilt="9"
      className="group relative mx-auto aspect-[5/4] w-full max-w-[640px] [perspective:1400px]"
      style={{ '--rx': '0deg', '--ry': '0deg', '--mx': '50%', '--my': '50%' }}
    >
      <div
        className="relative h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] [transform-style:preserve-3d]"
        style={{ transform: 'rotateX(calc(var(--rx) + 8deg)) rotateY(calc(var(--ry) - 14deg))' }}
      >
        {/* Atmospheric glow behind the glass */}
        <div
          aria-hidden="true"
          className="absolute inset-[-12%] rounded-full blur-3xl"
          style={{
            transform: 'translateZ(-120px)',
            background: 'radial-gradient(closest-side, #d4b27a40, #1b2440 55%, transparent 75%)',
          }}
        />

        {/* The glass pane */}
        <svg
          viewBox="0 0 560 360"
          className="absolute inset-x-0 top-[10%] h-auto w-full drop-shadow-[0_60px_80px_rgba(0,0,0,0.6)]"
          style={{ transform: 'translateZ(0px)' }}
          role="img"
          aria-label="A pane of windshield glass with raindrops being swept clear by a gold wiper blade"
        >
          <defs>
            <linearGradient id="hg-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E9EEF7" stopOpacity="0.16" />
              <stop offset="0.45" stopColor="#9AA6BD" stopOpacity="0.06" />
              <stop offset="1" stopColor="#D4B27A" stopOpacity="0.12" />
            </linearGradient>
            <linearGradient id="hg-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#F6E7C6" stopOpacity="0.2" />
              <stop offset="0.5" stopColor="#F6E7C6" stopOpacity="0.9" />
              <stop offset="1" stopColor="#D4B27A" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="hg-streak" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="hg-drop" cx="0.35" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="0.35" stopColor="#E3E8F2" stopOpacity="0.35" />
              <stop offset="1" stopColor="#8E9AB3" stopOpacity="0.08" />
            </radialGradient>
            <linearGradient id="hg-blade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F6E7C6" />
              <stop offset="1" stopColor="#8F6F3E" />
            </linearGradient>
            <clipPath id="hg-clip">
              <path d="M70 34 Q280 6 490 34 Q520 38 524 70 L548 300 Q550 334 516 336 Q280 352 44 336 Q10 334 12 300 L36 70 Q40 38 70 34Z" />
            </clipPath>
          </defs>

          <path
            d="M70 34 Q280 6 490 34 Q520 38 524 70 L548 300 Q550 334 516 336 Q280 352 44 336 Q10 334 12 300 L36 70 Q40 38 70 34Z"
            fill="url(#hg-glass)"
            stroke="url(#hg-edge)"
            strokeWidth="1.2"
          />
          <g clipPath="url(#hg-clip)">
            {/* reflections */}
            <rect x="-120" y="40" width="240" height="18" fill="url(#hg-streak)" transform="rotate(-24 0 0)" />
            <rect x="60" y="210" width="420" height="6" fill="url(#hg-streak)" transform="rotate(-24 280 180)" opacity="0.6" />
            {/* raindrops: bead, vanish as the blade passes, return */}
            <g style={{ animation: 'bead 7s cubic-bezier(.65,0,.35,1) infinite' }}>
              {DROPS.map(([cx, cy, r]) => (
                <g key={`${cx}-${cy}`}>
                  <ellipse cx={cx} cy={cy} rx={r} ry={r * 1.12} fill="url(#hg-drop)" />
                  <circle cx={cx - r * 0.35} cy={cy - r * 0.4} r={r * 0.22} fill="#fff" opacity="0.9" />
                </g>
              ))}
            </g>
            {/* the wiper: pivots at the base and sweeps the glass */}
            <g style={{ transformOrigin: '280px 360px', animation: 'wiper 7s cubic-bezier(.65,0,.35,1) infinite' }}>
              <line x1="280" y1="360" x2="280" y2="56" stroke="#D4B27A" strokeOpacity="0.35" strokeWidth="2" />
              <rect x="276" y="70" width="8" height="270" rx="4" fill="url(#hg-blade)" />
              <rect x="279.2" y="70" width="1.6" height="270" fill="#fff" opacity="0.5" />
            </g>
          </g>
        </svg>

        {/* Floating caption chips at different depths */}
        <div
          className="glass absolute left-[2%] top-[4%] rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-gold-light"
          style={{ transform: 'translateZ(90px)' }}
        >
          Rain-repellent · up to 3 months
        </div>
        <div
          className="glass absolute bottom-[6%] right-[4%] rounded-2xl px-5 py-4"
          style={{ transform: 'translateZ(140px)' }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-dim">Blade fit</p>
          <p className="display mt-1 text-3xl text-ivory">16″ – 26″</p>
        </div>
        <div
          aria-hidden="true"
          className="absolute right-[12%] top-[2%] h-16 w-16 rounded-full border border-gold/40"
          style={{ transform: 'translateZ(60px)', animation: 'drift 9s ease-in-out infinite' }}
        />

        {/* Pointer-following specular light */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            transform: 'translateZ(40px)',
            background: 'radial-gradient(240px circle at var(--mx) var(--my), #f1dfb81f, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}
