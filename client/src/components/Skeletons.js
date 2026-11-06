export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/4.6] animate-pulse rounded-[22px] border border-line bg-white/[0.02]" />
          <div className="mt-6 h-6 w-3/4 animate-pulse rounded bg-white/[0.04]" />
          <div className="mt-3 h-4 w-1/4 animate-pulse rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}
