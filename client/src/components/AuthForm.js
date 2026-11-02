'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

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
    <div className="container-page flex justify-center py-16">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-4 p-8" noValidate>
        <h1 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Log in'}</h1>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

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
            required
          />
          {isRegister && <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>}
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="text-center text-sm text-slate-600">
          {isRegister ? 'Already have an account? ' : 'New here? '}
          <Link href={`${isRegister ? '/login' : '/register'}?next=${encodeURIComponent(next)}`} className="font-medium text-brand hover:underline">
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </div>
  );
}
