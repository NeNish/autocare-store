import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import PageShell from '@/components/lux/PageShell';
import { POLICIES } from '@/lib/policies';
import { business } from '@/lib/business';
import { serverApi } from '@/lib/api';
import { DEFAULT_SETTINGS, formatPrice } from '@/lib/format';

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = POLICIES[slug];
  return p ? { title: p.title, description: p.summary, alternates: { canonical: `/policies/${slug}` } } : {};
}

function Part({ part }) {
  if (typeof part === 'string') return part;
  const value = business[part.f];
  if (value) return `${value}${part.suffix || ''}`;
  if (part.optional) return 'not applicable';
  return <mark className="rounded bg-amber-400/15 px-1.5 text-amber-100">[to be added]</mark>;
}

function Line({ line }) {
  const parts = Array.isArray(line) ? line : [line];
  return <p>{parts.map((part, i) => <Part key={i} part={part} />)}</p>;
}

function deliveryText(s) {
  if (!s.shippingFee) return 'Delivery is free on every order.';
  if (s.freeShippingFrom > 0) return `Delivery is free on orders of ${formatPrice(s.freeShippingFrom)} or more after discounts; below that it costs ${formatPrice(s.shippingFee)}.`;
  return `Delivery costs ${formatPrice(s.shippingFee)} per order.`;
}

async function Policy({ params }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();
  const { settings } = await serverApi('/settings/public').catch(() => ({ settings: DEFAULT_SETTINGS }));
  const sections = policy.sections({ deliveryText: deliveryText(settings) });
  return (
    <PageShell eyebrow="Help" title={policy.title.split(' ')[0]} accent={`${policy.title.split(' ').slice(1).join(' ')}.`.replace(/^\.$/, '')} narrow>
      <div className="grid gap-16 lg:grid-cols-[1fr_220px]">
        <article className="space-y-12">
          {sections.map(([heading, lines]) => (
            <section key={heading}>
              <h2 className="text-[20px] font-normal text-frost">{heading}</h2>
              <div className="mt-4 space-y-3 text-[15px] leading-[1.8] text-mute">
                {lines.map((l, i) => <Line key={i} line={l} />)}
              </div>
            </section>
          ))}
          <p className="hud">Questions? <Link href="/contact" className="link-tech">Contact us</Link></p>
        </article>
        <nav aria-label="Policies" className="h-fit lg:sticky lg:top-32">
          <p className="hud">Policies</p>
          <ul className="mt-5 space-y-3">
            {Object.entries(POLICIES).map(([k, p]) => (
              <li key={k}>
                <Link href={`/policies/${k}`} aria-current={k === slug ? 'page' : undefined} className={`text-[14px] transition-colors hover:text-ice ${k === slug ? 'text-ice' : 'text-mute'}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </PageShell>
  );
}

export default function PolicyPage({ params }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Policy params={params} />
    </Suspense>
  );
}
