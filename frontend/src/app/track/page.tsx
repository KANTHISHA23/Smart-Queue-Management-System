'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Copy, Search, Ticket, Link2 } from 'lucide-react';

function extractTokenId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const sharedLinkMatch = trimmed.match(/\/track\/([^/?#]+)/i);
  return decodeURIComponent(sharedLinkMatch?.[1] || trimmed);
}

export default function TrackTokenPage() {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');

  const normalizedPreview = useMemo(() => extractTokenId(tokenInput), [tokenInput]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tokenId = extractTokenId(tokenInput);

    if (!tokenId) {
      setError('Enter a token number, token ID, or a shared tracking link.');
      return;
    }

    setError('');
    router.push(`/track/${encodeURIComponent(tokenId)}`);
  };

  return (
    <div className="min-h-screen bg-hero-gradient pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -left-16 w-72 h-72 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-10 w-80 h-80 rounded-full bg-cyan-300/15 blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="section-label mx-auto w-fit mb-5">
            <Search size={14} className="text-[var(--primary)]" />
            Public Tracking
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--secondary)] leading-tight mb-4">
            Track Any Queue Token
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-light">
            No login required. Enter a token number, internal token ID, or paste a shared tracking link to see live queue progress.
          </p>
        </div>

        <div className="max-w-3xl mx-auto card-static border border-indigo-100 shadow-xl animate-fade-in-up stagger-1">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="tokenId" className="label">Token number or tracking link</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    id="tokenId"
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder="Example: G014 or /track/G014"
                    className="input w-full !pl-12"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <button type="submit" className="btn-primary justify-center sm:min-w-40">
                  Track Now
                  <ArrowRight size={16} />
                </button>
              </div>
              {error ? (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              ) : (
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  The tracker is read-only and only exposes safe queue information.
                </p>
              )}
            </div>

            {normalizedPreview ? (
              <div className="rounded-2xl bg-[var(--primary-50)] border border-[var(--primary-100)] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--primary)]">Resolved tracking token</p>
                  <p className="text-base font-black text-[var(--secondary)]">{normalizedPreview}</p>
                </div>
                <Link href={`/track/${encodeURIComponent(normalizedPreview)}`} className="btn-secondary justify-center">
                  Open Tracker
                  <Link2 size={16} />
                </Link>
              </div>
            ) : null}
          </form>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            {
              icon: <Search size={20} className="text-indigo-600" />,
              title: 'Instant lookup',
              description: 'Open a token directly from a shared URL or a visible token number.',
            },
            {
              icon: <Copy size={20} className="text-emerald-600" />,
              title: 'Easy sharing',
              description: 'Send a public tracker link so family or staff can follow the queue too.',
            },
            {
              icon: <Ticket size={20} className="text-cyan-600" />,
              title: 'Live queue status',
              description: 'See the token state, current serving token, position, and estimated wait time.',
            },
          ].map((item) => (
            <div key={item.title} className="card">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h2 className="text-lg font-bold text-[var(--secondary)] mb-2">{item.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
