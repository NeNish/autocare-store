import Link from 'next/link';

const columns = [
  {
    title: 'Collection',
    links: [
      ['/products?q=Wiper%20Blades', 'Wiper blades'],
      ['/products?q=Rain%20Repellent', 'Rain repellent'],
      ['/products?q=Washer%20Fluid', 'Washer fluid'],
      ['/products?q=Microfiber%20Towel', 'Microfiber towels'],
    ],
  },
  {
    title: 'House',
    links: [
      ['/#ritual', 'The ritual'],
      ['/#signature', 'Signature piece'],
      ['/account/orders', 'Your orders'],
      ['/cart', 'Your bag'],
    ],
  },
];

// A cinematic close: a final invitation, then the wordmark set in light.
export default function Footer() {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line bg-obsidian">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[520px]"
        style={{ background: 'radial-gradient(60% 70% at 50% 0%, #d4b27a1f, transparent 70%)' }}
      />
      <div className="container-page relative pt-28">
        <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow" data-reveal>Your next drive</p>
            <h2 className="display mt-6 text-[clamp(3rem,7vw,6.5rem)] text-ivory" data-reveal="line">
              <span>
                Step into <em className="gold-text">clarity.</em>
              </span>
            </h2>
            <div className="mt-12" data-reveal style={{ '--delay': '200ms' }}>
              <Link href="/products" data-magnetic className="btn-primary h-14 px-10">
                Enter the collection
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10 self-end">
            {columns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <p className="text-[11px] uppercase tracking-[0.3em] text-dim">{c.title}</p>
                <ul className="mt-6 space-y-4">
                  {c.links.map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="text-[15px] text-mute transition-colors duration-300 hover:text-gold-light">
                        {label}
                      </Link>
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
          className="display select-none whitespace-nowrap pt-10 text-center text-[clamp(4.5rem,19vw,19rem)] italic leading-[0.8] text-transparent"
          style={{
            WebkitTextStroke: '1px #d4b27a59',
            backgroundImage: 'linear-gradient(100deg, transparent 30%, #f1dfb833 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: 'shimmer 9s linear infinite',
          }}
        >
          AutoCare
        </p>

        <div className="flex flex-col gap-4 border-t border-line py-8 text-[11px] uppercase tracking-[0.26em] text-dim sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AutoCare · The atelier of clarity</p>
          <p>Free delivery on orders from ₹999</p>
          <a href="#main" className="link-lux self-start sm:self-auto">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
