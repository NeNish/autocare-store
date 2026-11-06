'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';
import RainCanvas from '@/components/lux/RainCanvas';

// Only allow redirects to same-site paths
function safeNext(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (isRegister && form.name.trim().length === 0) return setError('Name is required');
    if (isRegister && !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
      return setError('Password must be at least 8 characters with a letter and a number');
    }
    setBusy(true);
    try {
      if (isRegister) await register(form.name.trim(), form.email.trim(), form.password);
      else await login(form.email.trim(), form.password);
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-line lg:block">
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(80% 70% at 30% 30%, #18213a 0%, #0b1020 45%, #07080b 85%)' }} />
        <div aria-hidden="true" className="absolute inset-0 opacity-70"><RainCanvas /></div>
        <div className="relative flex h-full flex-col justify-end p-16 pb-20">
          <p className="eyebrow">The house of AutoCare</p>
          <p className="display mt-8 text-[clamp(3rem,5vw,5.5rem)] text-ivory">
            {isRegister ? 'Begin your' : 'Welcome'}
            <br />
            <em className="gold-text">{isRegister ? 'membership.' : 'back.'}</em>
          </p>
          <p className="mt-8 max-w-sm text-[15px] leading-[1.8] text-mute">
            Your orders, your bag and your preferred pieces, kept in one place.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 pb-20 pt-36 sm:px-10">
        <form onSubmit={onSubmit} className="w-full max-w-md animate-rise space-y-7" noValidate>
          <div>
            <p className="eyebrow">{isRegister ? 'Create an account' : 'Sign in'}</p>
            <h1 className="display mt-5 text-6xl text-ivory">{isRegister ? 'Join the house' : 'Sign in'}</h1>
          </div>
          {error && (
            <p role="alert" className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</p>
          )}

          {isRegister && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" className="input" autoComplete="name" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={set('password')}
              aria-describedby={isRegister ? 'password-hint' : undefined}
              required
            />
            {isRegister && <p id="password-hint" className="mt-2 text-xs text-dim">At least 8 characters, with a letter and a number.</p>}
          </div>

          <button type="submit" data-magnetic="0.2" className="btn-primary h-14 w-full" disabled={busy}>
            {busy ? 'One moment…' : isRegister ? 'Create account' : 'Sign in'}
          </button>

          <p className="text-center text-[14px] text-mute">
            {isRegister ? 'Already a member? ' : 'New to AutoCare? '}
            <Link href={`${isRegister ? '/login' : '/register'}?next=${encodeURIComponent(next)}`} className="text-gold-light underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
