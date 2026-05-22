import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getKindleServerSigner, fetchKindleSnapshot } from '@/lib/kindle/server';
import { isKindleSessionCookieValid } from '@/lib/kindle/auth';
import { formatUnixTime, shortPubkey } from '@/lib/kindle/nostr';
import './plain.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Obelisk Paper',
  description: 'Plain text read-only Obelisk view for Kindle browsers.',
  alternates: { canonical: '/kindle' },
};

interface KindlePageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

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

export default async function KindlePage({ searchParams }: KindlePageProps) {
  const params = (await searchParams) ?? {};
  const selectedGroupId = null;
  const posted = first(params.posted);
  const error = first(params.error);
  const signer = getKindleServerSigner();
  const isUnlocked = isKindleSessionCookieValid((await headers()).get('cookie'));
  const snapshot = await fetchKindleSnapshot(selectedGroupId);
  const group = snapshot.selectedGroup;

  return (
    <main className="paper-page">
      <header className="paper-header">
        <ObeliskMark />
        <h1>Obelisk Paper</h1>
        <p>Kindle talks HTTP only. This server talks WebSocket to the Nostr relay.</p>
        <p>Relay: {snapshot.relays.join(', ')}</p>
        <p>Server signer: {shortPubkey(signer.pubkey)}</p>
        <p>
          <a href={`/kindle${group ? `?group=${encodeURIComponent(group.id)}` : ''}`}>Refresh</a>
        </p>
        {posted ? <p>Posted: {posted}</p> : null}
        {error ? <p>Error: {error}</p> : null}
        {snapshot.error ? <p>Relay error: {snapshot.error}</p> : null}
      </header>

      <section className="paper-section">
        <h2>Access</h2>
        {isUnlocked ? (
          <p>Unlocked. Posting uses the server-side Nostr key.</p>
        ) : (
          <form action="/kindle/post" method="post" className="paper-form">
            <input type="hidden" name="action" value="login" />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" />
            <button type="submit">Unlock posting</button>
          </form>
        )}
      </section>

      <section className="paper-section">
        <h2>Channel</h2>
        <p>{group?.name ?? 'General'} only.</p>
        <p>Group: 26a9cceda473cb1b</p>
      </section>

      {group ? (
        <section className="paper-section" id={group.id}>
          <h2>{group.name}</h2>
          {group.about ? <p>{group.about}</p> : null}

          {isUnlocked ? (
            <form action="/kindle/post" method="post" className="paper-form">
              <input type="hidden" name="groupId" value={group.id} />
              <label htmlFor="content">Write</label>
              <textarea id="content" name="content" maxLength={500} rows={4} />
              <button type="submit">Post to General</button>
            </form>
          ) : (
            <p>Enter password above to post.</p>
          )}

          <h3>Messages</h3>
          {snapshot.messages.length === 0 ? <p>No messages in this channel.</p> : null}
          <ol className="paper-messages">
            {snapshot.messages.map((message) => (
              <li key={message.id}>
                <p className="paper-meta">
                  {shortPubkey(message.pubkey)} — {formatUnixTime(message.createdAt)}
                </p>
                <p>{message.content}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  );
}
