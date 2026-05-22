import type { Metadata } from 'next';
import { KINDLE_DEMO_GROUPS, KINDLE_DEMO_MESSAGES, KINDLE_DEFAULT_RELAYS } from '@/lib/kindle/demo';
import { formatUnixTime, shortPubkey } from '@/lib/kindle/nostr';
import './plain.css';

export const metadata: Metadata = {
  title: 'Obelisk Paper',
  description: 'Plain text read-only Obelisk view for Kindle browsers.',
  alternates: { canonical: '/kindle' },
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

export default function KindlePage() {
  const group = KINDLE_DEMO_GROUPS[0];
  const messages = KINDLE_DEMO_MESSAGES.filter((message) => message.groupId === group.id);

  return (
    <main className="paper-page">
      <header className="paper-header">
        <ObeliskMark />
        <h1>Obelisk Paper</h1>
        <p>Plain read-only Kindle view. No login. No posting. No realtime. No app shell.</p>
        <p>
          <a href="/kindle">Refresh</a>
        </p>
      </header>

      <section className="paper-section">
        <h2>Servers</h2>
        <ul>
          {KINDLE_DEFAULT_RELAYS.map((relay) => (
            <li key={relay}>{relay}</li>
          ))}
        </ul>
      </section>

      <section className="paper-section">
        <h2>Groups</h2>
        <ul>
          {KINDLE_DEMO_GROUPS.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`}>{item.name}</a>
              {item.about ? ` — ${item.about}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="paper-section" id={group.id}>
        <h2>{group.name}</h2>
        {group.about ? <p>{group.about}</p> : null}
        <ol className="paper-messages">
          {messages.map((message) => (
            <li key={message.id}>
              <p className="paper-meta">
                {shortPubkey(message.pubkey)} — {formatUnixTime(message.createdAt)}
              </p>
              <p>{message.content}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
