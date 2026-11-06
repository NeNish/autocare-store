'use client';

export default function Error({ error, reset }) {
  return (
    <div className="container-page flex min-h-[80svh] flex-col items-center justify-center pt-32 text-center">
      <p className="eyebrow">A momentary interruption</p>
      <h1 className="display mt-6 text-[clamp(3rem,6vw,5.5rem)] text-ivory">Something went <em className="gold-text">astray.</em></h1>
      <p className="mt-6 max-w-md text-mute">
        {error?.message?.includes('fetch') ? 'We couldn’t reach the store server. Is the API running?' : 'Please try again in a moment.'}
      </p>
      <button onClick={() => reset()} className="btn-primary mt-12">Try again</button>
    </div>
  );
}
