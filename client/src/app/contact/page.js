import Link from 'next/link';
import PageShell from '@/components/lux/PageShell';
import { business } from '@/lib/business';

export const metadata = { title: 'Contact', description: 'Get help with an order, a return or choosing the right wiper blades.' };

function Row({ label, value, href }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-6 border-b border-line py-5">
      <dt className="hud self-center">{label}</dt>
      <dd className="text-[16px] text-frost">
        {value ? (href ? <a href={href} className="link-tech">{value}</a> : value) : <span className="text-dim">To be added</span>}
      </dd>
    </div>
  );
}

export default function ContactPage() {
  return (
    <PageShell eyebrow="Help" title="Talk to" accent="us." narrow>
      <div className="grid gap-16 lg:grid-cols-[1fr_320px]">
        <dl className="border-t border-line">
          <Row label="Email" value={business.email} href={business.email ? `mailto:${business.email}` : null} />
          <Row label="Phone" value={business.phone} href={business.phone ? `tel:${business.phone.replace(/\s/g, '')}` : null} />
          <Row label="Hours" value={business.hours} />
          <Row label="Address" value={business.address} />
          <Row label="Business" value={business.legalName} />
          {business.gstin && <Row label="GSTIN" value={business.gstin} />}
        </dl>
        <div className="card h-fit p-7 text-[14px] leading-relaxed text-mute">
          <p className="hud text-accent-light">Faster answers</p>
          <p className="mt-3">Questions about fit, streaks or noisy wipers? The care assistant (bottom right) answers instantly.</p>
          <p className="mt-3">For an order, include your order number from <Link href="/account/orders" className="link-tech">Your orders</Link>.</p>
        </div>
      </div>
    </PageShell>
  );
}
