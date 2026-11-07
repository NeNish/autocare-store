import WeatherSimulator from '@/components/vision/WeatherSimulator';

export const metadata = {
  title: 'Weather simulator',
  description: 'See how rain, fog, wiper speed, blade condition and rain repellent change what you can see through a windshield.',
};

export default function SimulatorPage() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[620px]" style={{ background: 'radial-gradient(60% 75% at 80% 0%, #0c1a30 0%, #050608 70%)' }} />
      <div className="container-page pb-16 pt-36 sm:pt-40">
        <header className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow animate-rise">Weather simulator</p>
            <h1 className="display mt-6 animate-rise text-[clamp(3rem,8vw,7.5rem)] [animation-delay:120ms]">
              <span className="chrome-text">Any weather.</span>
              <br />
              <span className="accent-text">Total clarity.</span>
            </h1>
          </div>
          <p className="max-w-sm animate-rise text-[15px] leading-[1.8] text-mute [animation-delay:240ms]">
            Change the weather, the wiper speed and the state of your blades, and watch how the view through the glass changes.
          </p>
        </header>
        <div className="animate-rise [animation-delay:300ms]">
          <WeatherSimulator />
        </div>
      </div>
    </div>
  );
}
