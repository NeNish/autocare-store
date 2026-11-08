'use client';

import { useEffect, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function RemindersPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [show, setShow] = useState('due');

  const load = () => clientApi('/reminders').then((d) => setData({ ...d, fetchedAt: Date.now() })).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);

  if (!data) return <p className="text-sm text-dim">{error || 'Loading reminders…'}</p>;
  const now = data.fetchedAt;
  const scheduled = data.reminders.filter((r) => r.status === 'scheduled');
  const due = scheduled.filter((r) => new Date(r.dueAt).getTime() <= now);
  const list = show === 'due' ? due : show === 'upcoming' ? scheduled.filter((r) => new Date(r.dueAt).getTime() > now) : data.reminders;

  async function markSent(id) {
    try {
      await clientApi(`/reminders/${id}/sent`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function exportCsv() {
    const rows = [['Name', 'Email', 'Products', 'Due', 'Status'], ...list.map((r) => [r.name, r.email, r.products.join('; '), formatDate(r.dueAt), r.status])];
    const blob = new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `blade-reminders-${show}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-mute">
        Customers who tick &ldquo;remind me&rdquo; at checkout get one email when their blades are due for a check.
        {data.emailEnabled
          ? ' Emails go out automatically each day.'
          : ' Automatic email is off (add RESEND_API_KEY and EMAIL_FROM to the API to turn it on). Until then, export the due list and contact customers yourself, then mark them sent.'}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {[['due', `Due now (${due.length})`], ['upcoming', `Upcoming (${scheduled.length - due.length})`], ['all', 'All']].map(([k, l]) => (
          <button key={k} type="button" aria-pressed={show === k} onClick={() => setShow(k)} className={`chip ${show === k ? 'border-accent text-accent-light' : ''}`}>{l}</button>
        ))}
        <button type="button" className="btn-secondary ml-auto h-10 px-5" onClick={exportCsv} disabled={!list.length}>Export CSV</button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
      {list.length === 0 ? (
        <p className="card p-8 text-center text-sm text-dim">Nothing here yet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-white/[0.03] text-xs uppercase text-dim">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Bought</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3">{r.name}<span className="block text-xs text-dim">{r.email}</span></td>
                  <td className="px-4 py-3 text-xs text-mute">{r.products.join(', ')}</td>
                  <td className="px-4 py-3">{formatDate(r.dueAt)}</td>
                  <td className="px-4 py-3 capitalize">{r.status}{r.sentAt ? ` · ${formatDate(r.sentAt)}` : ''}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'scheduled' && <button className="link-tech text-xs" onClick={() => markSent(r._id)}>Mark sent</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
