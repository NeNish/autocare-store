// Shared frame for inner pages: atmospheric glow, an eyebrow and an editorial
// serif title with an optional italic gold flourish.
export default function PageShell({ eyebrow, title, accent, aside, children, narrow = false }) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{ background: 'radial-gradient(60% 75% at 85% 0%, #18213a 0%, #07080b 70%)' }}
      />
      <div className={`container-page pb-16 pt-40 sm:pt-44 ${narrow ? 'max-w-[1000px]' : ''}`}>
        <header className="mb-16 flex flex-wrap items-end justify-between gap-8">
          <div>
            {eyebrow && <p className="eyebrow animate-rise">{eyebrow}</p>}
            <h1 className="display mt-5 animate-rise text-[clamp(3rem,7vw,6.5rem)] text-ivory [animation-delay:120ms]">
              {title}
              {accent && <> <em className="gold-text">{accent}</em></>}
            </h1>
          </div>
          {aside && <div className="animate-rise [animation-delay:240ms]">{aside}</div>}
        </header>
        <div className="animate-rise [animation-delay:200ms]">{children}</div>
      </div>
    </div>
  );
}
