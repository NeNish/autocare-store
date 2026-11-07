import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[85svh] items-center overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'radial-gradient(50% 60% at 50% 45%, #0c1726 0%, #050608 75%)' }} />
      <p
        aria-hidden="true"
        className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center text-[clamp(14rem,42vw,34rem)] leading-none text-transparent"
        style={{ WebkitTextStroke: '1px #2f8cff33' }}
      >
        404
      </p>
      <div className="container-page relative pt-32 text-center">
        <p className="eyebrow animate-rise">Signal lost</p>
        <h1 className="display mt-6 animate-rise text-[clamp(3rem,7vw,6rem)] text-frost [animation-delay:120ms]">
          <span className="chrome-text">Out of</span> <span className="accent-text">view.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md animate-rise text-mute [animation-delay:240ms]">The page or piece you&apos;re looking for doesn&apos;t exist.</p>
        <div className="mt-12 animate-rise [animation-delay:360ms]">
          <Link href="/products" data-magnetic className="btn-primary h-14 px-9">Back to products</Link>
        </div>
      </div>
    </div>
  );
}
