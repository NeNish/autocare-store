import Link from 'next/link';

const columns = [
  {
    title: 'Products',
    links: [
      ['/products?q=Wiper%20Blades', 'Beam wiper blades'],
      ['/products?q=Rain%20Repellent', 'Rain repellent'],
      ['/products?q=Washer%20Fluid', 'Washer fluid'],
      ['/products?q=Microfiber%20Towel', 'Microfiber care'],
    ],
  },
  {
    title: 'Technology',
    links: [
      ['/simulator', 'Weather simulator'],
      ['/fit', 'Compatibility finder'],
      ['/compare', 'Compare products'],
      ['/account/orders', 'Your orders'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line bg-obsidian">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[520px]" style={{ background: 'radial-gradient(55% 70% at 50% 0%, #2f8cff1f, transparent 70%)' }} />
      <div className="container-page relative pt-28">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow" data-reveal>Every drive</p>
            <h2 className="display mt-6 text-[clamp(3rem,7.5vw,7rem)] text-frost" data-reveal="line">
              <span>See <span className="accent-text">everything.</span></span>
            </h2>
            <div className="mt-12 flex flex-wrap gap-4" data-reveal style={{ '--delay': '200ms' }}>
              <Link href="/fit" data-magnetic className="btn-primary h-14 px-9">Find your blades →</Link>
              <Link href="/simulator" data-magnetic className="btn-secondary h-14 px-8">Try the simulator</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 self-end">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="hud">{c.title}</p>
                <ul className="mt-6 space-y-4">
                  {c.links.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="text-[15px] text-mute transition-colors duration-300 hover:text-ice">{label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="hairline mt-24" />
        <p
          aria-hidden="true"
          className="select-none whitespace-nowrap pt-10 text-center font-sans text-[clamp(4rem,17vw,17rem)] font-semibold uppercase leading-[0.8] tracking-[-0.06em] text-transparent"
          style={{
            WebkitTextStroke: '1px #c3cad54d',
            backgroundImage: 'linear-gradient(100deg, transparent 30%, #8fd0ff33 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: 'shimmer 9s linear infinite',
          }}
        >
          AutoCare
        </p>
        <div className="flex flex-col gap-4 border-t border-line py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="hud">© 2026 AutoCare · Visibility, engineered</p>
          <p className="hud">Free delivery from ₹999 · Cash on delivery</p>
          <a href="#main" className="link-tech self-start sm:self-auto">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
