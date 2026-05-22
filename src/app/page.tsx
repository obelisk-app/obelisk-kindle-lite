import type { Metadata } from 'next';
import './kindle/plain.css';

const SITE_URL = process.env.CORS_ORIGIN || 'https://paper.obelisk.ar';

export const metadata: Metadata = {
  title: 'Obelisk Paper',
  description: 'Plain black and white Obelisk reader for Kindle browsers.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Obelisk Paper',
    description: 'Plain black and white Obelisk reader for Kindle browsers.',
    url: SITE_URL,
    type: 'website',
  },
};

function ObeliskMark() {
  return (
    <svg aria-label="Obelisk" width="32" height="32" viewBox="0 0 32 32" role="img">
      <rect x="15" y="5" width="2" height="18" fill="black" />
      <path d="M16 2l5 5H11z" fill="black" />
      <rect x="10" y="23" width="12" height="3" fill="black" />
      <rect x="7" y="27" width="18" height="3" fill="black" />
    </svg>
  );
}

export default function Page() {
  return (
    <main className="paper-page">
      <header className="paper-header">
        <ObeliskMark />
        <h1>Obelisk Paper</h1>
        <p>Black and white. Built for Kindle. No app chrome.</p>
        <p>
          <a href="/kindle">Open Kindle reader</a>
        </p>
      </header>

      <section className="paper-section">
        <h2>What this is</h2>
        <p>A simple HTTP page for reading Obelisk channels from old browsers.</p>
        <p>The server talks WebSocket to the Nostr relay. Your Kindle just loads pages.</p>
      </section>

      <section className="paper-section">
        <h2>Start</h2>
        <p>
          Go to <a href="/kindle">/kindle</a>.
        </p>
      </section>
    </main>
  );
}
