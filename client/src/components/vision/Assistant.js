'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { clientApi, errorMessage } from '@/lib/api';
import { formatPrice } from '@/lib/format';

/*
  The windshield care assistant: a floating panel available on every page.
  Other components can open it with a ready-made question:
    window.dispatchEvent(new CustomEvent('assistant:open', { detail: { prompt: '…' } }))
*/

const STARTERS = ['My wipers leave streaks', 'Wipers chatter on the glass', 'When should I replace blades?', 'Which blades fit my car?', 'Prepare for the monsoon'];

// Minimal, safe formatting: **bold**, numbered and bulleted lines, paragraphs
function Rich({ text }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="font-semibold text-ice">{part.slice(2, -2)}</strong> : part
    );
  return blocks.map((b, i) => {
    const lines = b.split('\n').filter(Boolean);
    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      return (
        <ol key={i} className="ml-5 list-decimal space-y-1.5 marker:text-accent-light">
          {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\.\s/, ''))}</li>)}
        </ol>
      );
    }
    if (lines.every((l) => /^[-•]\s/.test(l))) {
      return (
        <ul key={i} className="ml-5 list-disc space-y-1.5 marker:text-accent-light">
          {lines.map((l, j) => <li key={j}>{inline(l.replace(/^[-•]\s/, ''))}</li>)}
        </ul>
      );
    }
    return <p key={i}>{lines.map((l, j) => <span key={j}>{inline(l)}{j < lines.length - 1 && <br />}</span>)}</p>;
  });
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, products?, link?, mode? }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(STARTERS);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  const send = useCallback(
    async (text) => {
      const content = text.trim();
      if (!content || busy) return;
      setError('');
      const history = [...messages, { role: 'user', content }];
      setMessages(history);
      setInput('');
      setBusy(true);
      try {
        const d = await clientApi('/assistant', {
          method: 'POST',
          body: { messages: history.slice(-12).map(({ role, content: c }) => ({ role, content: c })) },
        });
        setMessages((m) => [...m, { role: 'assistant', content: d.reply, products: d.products, link: d.link, mode: d.mode }]);
        setSuggestions(d.suggestions?.length ? d.suggestions : []);
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [busy, messages]
  );

  useEffect(() => {
    const onOpen = (e) => {
      setOpen(true);
      const prompt = e.detail?.prompt;
      if (prompt) setTimeout(() => send(prompt), 50);
    };
    window.addEventListener('assistant:open', onOpen);
    return () => window.removeEventListener('assistant:open', onOpen);
  }, [send]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const lastMode = [...messages].reverse().find((m) => m.mode)?.mode;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        data-magnetic="0.2"
        aria-label={open ? 'Hide assistant' : 'Ask AutoCare'}
        className="glass fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center gap-3 rounded-full text-ice sm:bottom-5 sm:right-5 sm:w-auto sm:justify-start sm:pl-4 sm:pr-5 transition-colors hover:border-accent/60"
      >
        <span className="relative grid h-7 w-7 place-items-center rounded-full bg-accent/20">
          <span className="h-2 w-2 rounded-full bg-accent-light" style={{ animation: 'pulse-dot 2.4s ease-in-out infinite' }} />
        </span>
        <span aria-hidden="true" className="hidden font-mono text-[11px] uppercase tracking-[0.22em] sm:inline">{open ? 'Close' : 'Ask AutoCare'}</span>
      </button>

      {open && (
        <section
          id="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          className="glass fixed bottom-24 right-3 z-40 flex h-[min(640px,calc(100svh-120px))] w-[min(420px,calc(100vw-24px))] flex-col overflow-hidden rounded-[26px] bg-carbon/90 animate-rise sm:right-5"
        >
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <p id="assistant-title" className="text-[15px] font-medium text-frost">Windshield care assistant</p>
              <p className="hud mt-1 flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${lastMode === 'guide' ? 'bg-silver' : 'bg-accent-light'}`} />
                {lastMode === 'guide' ? 'Care guide mode' : lastMode === 'ai' ? 'AI · grounded in our catalogue' : 'Troubleshooting · care · products'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="grid h-9 w-9 place-items-center rounded-full text-mute hover:bg-white/5 hover:text-frost">
              ✕
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-3 text-[14px] leading-relaxed text-mute">
                <p className="text-[22px] font-light leading-tight tracking-tight text-frost">How can I help you see more clearly?</p>
                <p>Ask about streaks, chatter, fogging or washer problems, when to replace blades, or which products suit your needs.</p>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="ml-10 rounded-2xl rounded-br-md bg-accent/90 px-4 py-3 text-[14px] text-white">{m.content}</div>
              ) : (
                <div key={i} className="mr-4 space-y-3 text-[14px] leading-relaxed text-silver">
                  <Rich text={m.content} />
                  {m.link && (
                    <Link href={m.link.href} onClick={() => setOpen(false)} className="link-tech">{m.link.label} →</Link>
                  )}
                  {m.products?.length > 0 && (
                    <ul className="space-y-2 pt-1">
                      {m.products.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/products/${p.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-accent/60"
                          >
                            <span className="min-w-0">
                              <span className="hud block text-accent-light">{p.type}</span>
                              <span className="block truncate text-[13px] text-frost">{p.name}</span>
                            </span>
                            <span className="shrink-0 font-mono text-[12px] text-ice">{formatPrice(p.price)}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            )}
            {busy && (
              <div className="flex gap-1.5 px-1" aria-label="Assistant is typing">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-accent-light" style={{ animation: `typing 1.2s ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
            {error && <p role="alert" className="text-[13px] text-rose-200">{error}</p>}
          </div>

          {suggestions.length > 0 && !busy && (
            <div className="flex gap-2 overflow-x-auto px-5 pb-3">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[12px] text-mute hover:border-accent/60 hover:text-frost">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <label htmlFor="assistant-input" className="sr-only">Ask a question</label>
            <input
              ref={inputRef}
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1200}
              placeholder="Describe the problem…"
              className="input h-12 rounded-full py-0"
              autoComplete="off"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="btn-primary h-12 w-12 shrink-0 px-0">
              ↑
            </button>
          </form>
          <p className="hud px-5 pb-3 text-center normal-case tracking-normal">General guidance only. For mechanical faults, see a workshop.</p>
        </section>
      )}
    </>
  );
}
