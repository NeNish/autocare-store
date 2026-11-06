import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[85svh] items-center overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(50% 60% at 50% 45%, #18213a 0%, #07080b 75%)' }} />
      <p
        aria-hidden="true"
        className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[clamp(14rem,42vw,34rem)] italic leading-none text-transparent"
        style={{ WebkitTextStroke: '1px #d4b27a33' }}
      >
        404
      </p>
      <div className="container-page relative pt-32 text-center">
        <p className="eyebrow animate-rise">Lost in the rain</p>
        <h1 className="display mt-6 animate-rise text-[clamp(3rem,7vw,6rem)] text-ivory [animation-delay:120ms]">
          This page has <em className="gold-text">drifted away.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-md animate-rise text-mute [animation-delay:240ms]">The page or piece you&apos;re looking for doesn&apos;t exist.</p>
        <div className="mt-12 animate-rise [animation-delay:360ms]">
          <Link href="/products" data-magnetic className="btn-primary h-14 px-9">Return to the collection</Link>
        </div>
      </div>
    </div>
  );
}
