import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getKindleServerSigner, fetchKindleSnapshot } from '@/lib/kindle/server';
import { isKindleSessionCookieValid } from '@/lib/kindle/auth';
import { formatUnixTime, shortPubkey } from '@/lib/kindle/nostr';
import './plain.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Obelisk',
  description: 'Plain text Obelisk view for Kindle browsers.',
  alternates: { canonical: '/kindle' },
};

interface KindlePageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function KindlePage({ searchParams }: KindlePageProps) {
  const params = (await searchParams) ?? {};
  const posted = first(params.posted);
  const error = first(params.error);
  const signer = getKindleServerSigner();
  const isUnlocked = isKindleSessionCookieValid((await headers()).get('cookie'));
  const snapshot = await fetchKindleSnapshot(null);
  const group = snapshot.selectedGroup;

  return (
    <main className="paper-page">
      <header className="paper-header">
        <h1>Obelisk</h1>
        <p><a href="/kindle">Refresh</a></p>
        {posted ? <p>Posted: {posted}</p> : null}
        {error ? <p>Error: {error}</p> : null}
        {snapshot.error ? <p>Relay error: {snapshot.error}</p> : null}
      </header>

      <section className="paper-section">
        <h2>Access</h2>
        {isUnlocked ? (
          <div>
            <p>Name: {signer.name}</p>
            <p>Key: {shortPubkey(signer.pubkey)}</p>
          </div>
        ) : (
          <form action="/kindle/post" method="post" className="paper-form">
            <input type="hidden" name="action" value="login" />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" />
            <button type="submit">Unlock</button>
          </form>
        )}
      </section>

      <section className="paper-section">
        <h2>Channel</h2>
        <p>{group?.name ?? 'Not setup'}</p>
        {group ? <p>Group: {group.id}</p> : null}
        <p>Relay: {snapshot.relays.join(', ')}</p>
        <p><a href="/kindle">-&gt; channels</a></p>
      </section>

      {group ? (
        <section className="paper-section" id={group.id}>
          <h2>{group.name}</h2>
          {group.about ? <p>{group.about}</p> : null}

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

          <h3>Write</h3>
          {isUnlocked ? (
            <form action="/kindle/post" method="post" className="paper-form">
              <input type="hidden" name="groupId" value={group.id} />
              <label htmlFor="content">Message</label>
              <textarea id="content" name="content" maxLength={500} rows={4} />
              <button type="submit">Post</button>
            </form>
          ) : (
            <p>Enter password above to write.</p>
          )}
        </section>
      ) : null}
    </main>
  );
}
