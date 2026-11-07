import { Suspense } from 'react';
import FitFinder from '@/components/vision/FitFinder';

export const metadata = {
  title: 'Compatibility finder',
  description: 'Find wiper blades that fit: by verified vehicle data, or by measuring your current blades.',
};

export default function FitPage() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[620px]" style={{ background: 'radial-gradient(60% 75% at 15% 0%, #0c1a30 0%, #050608 70%)' }} />
      <div className="container-page pb-16 pt-36 sm:pt-40">
        <header className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow animate-rise">Compatibility finder</p>
            <h1 className="display mt-6 animate-rise text-[clamp(3rem,8vw,7.5rem)] [animation-delay:120ms]">
              <span className="chrome-text">The right blade.</span>
              <br />
              <span className="accent-text">Nothing guessed.</span>
            </h1>
          </div>
          <p className="max-w-sm animate-rise text-[15px] leading-[1.8] text-mute [animation-delay:240ms]">
            Choose a vehicle with verified fitment data, or measure your current blades. We only recommend pairs whose recorded lengths match.
          </p>
        </header>
        <div className="animate-rise [animation-delay:300ms]">
          <Suspense fallback={<p className="hud">Loading…</p>}>
            <FitFinder />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
