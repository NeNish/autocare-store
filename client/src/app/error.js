'use client';

export default function Error({ error, reset }) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-slate-600">
        {error?.message?.includes('fetch') ? 'We couldn’t reach the store server. Is the API running?' : 'Please try again.'}
      </p>
      <button onClick={() => reset()} className="btn-primary mt-6">Try again</button>
    </div>
  );
}
