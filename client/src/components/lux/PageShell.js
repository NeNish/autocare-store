// Shared frame for inner pages: atmospheric glow, an eyebrow and an editorial
// headline with an electric-blue accent.
export default function PageShell({ eyebrow, title, accent, aside, children, narrow = false }) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{ background: 'radial-gradient(60% 75% at 85% 0%, #0c1726 0%, #050608 70%)' }}
      />
      <div className={`container-page pb-16 pt-40 sm:pt-44 ${narrow ? 'max-w-[1000px]' : ''}`}>
        <header className="mb-16 flex flex-wrap items-end justify-between gap-8">
          <div>
            {eyebrow && <p className="eyebrow animate-rise">{eyebrow}</p>}
            <h1 className="display mt-5 animate-rise text-[clamp(3rem,7vw,6.5rem)] [animation-delay:120ms]">
              <span className="chrome-text">{title}</span>
              {accent && <> <span className="accent-text">{accent}</span></>}
            </h1>
          </div>
          {aside && <div className="animate-rise [animation-delay:240ms]">{aside}</div>}
        </header>
        <div className="animate-rise [animation-delay:200ms]">{children}</div>
      </div>
    </div>
  );
}
