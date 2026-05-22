'use client';

import { useCallback, useMemo, useState } from 'react';
import { fetchKindleGroups, fetchKindleMessages } from '@/lib/kindle/client';
import { KINDLE_DEFAULT_RELAYS, KINDLE_DEMO_GROUPS, KINDLE_DEMO_MESSAGES } from '@/lib/kindle/demo';
import { formatUnixTime, shortPubkey, type KindleGroup, type KindleMessage } from '@/lib/kindle/nostr';
import styles from './KindlePage.module.css';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type DataSource = 'demo' | 'relay';

function sourceLabel(source: DataSource): string {
  return source === 'relay' ? 'Relay data' : 'Demo data';
}

export default function KindleClient() {
  const [groups, setGroups] = useState<KindleGroup[]>(KINDLE_DEMO_GROUPS);
  const [messages, setMessages] = useState<KindleMessage[]>(KINDLE_DEMO_MESSAGES);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(KINDLE_DEMO_GROUPS[0]?.id ?? '');
  const [groupState, setGroupState] = useState<LoadState>('idle');
  const [messageState, setMessageState] = useState<LoadState>('idle');
  const [source, setSource] = useState<DataSource>('demo');
  const [notice, setNotice] = useState('Static fallback loaded. Press Refresh for the public relay.');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null,
    [groups, selectedGroupId],
  );

  const selectedMessages = useMemo(
    () => messages.filter((message) => message.groupId === selectedGroup?.id),
    [messages, selectedGroup?.id],
  );

  const loadMessages = useCallback(async (groupId: string, nextSource: DataSource) => {
    if (!groupId) return;

    if (nextSource === 'demo') {
      setMessages(KINDLE_DEMO_MESSAGES.filter((message) => message.groupId === groupId));
      setMessageState('ready');
      return;
    }

    setMessageState('loading');
    try {
      const nextMessages = await fetchKindleMessages(KINDLE_DEFAULT_RELAYS, groupId);
      setMessages(nextMessages);
      setMessageState('ready');
      if (nextMessages.length === 0) {
        setNotice('Relay returned the group list, but no recent messages for this group.');
      }
    } catch (error) {
      setMessageState('error');
      setMessages([]);
      setNotice(error instanceof Error ? error.message : 'Could not read messages from the relay.');
    }
  }, []);

  const refresh = useCallback(async () => {
    setGroupState('loading');
    setMessageState('loading');
    setNotice('Reading public relay...');

    try {
      const nextGroups = await fetchKindleGroups(KINDLE_DEFAULT_RELAYS);
      if (nextGroups.length === 0) {
        setGroups(KINDLE_DEMO_GROUPS);
        setSelectedGroupId(KINDLE_DEMO_GROUPS[0]?.id ?? '');
        setSource('demo');
        setGroupState('ready');
        setNotice('Relay returned no public groups. Showing demo data.');
        setUpdatedAt(formatUnixTime(Math.floor(Date.now() / 1000)));
        await loadMessages(KINDLE_DEMO_GROUPS[0]?.id ?? '', 'demo');
        return;
      }

      const nextSelected = nextGroups.some((group) => group.id === selectedGroupId)
        ? selectedGroupId
        : nextGroups[0].id;

      setGroups(nextGroups);
      setSelectedGroupId(nextSelected);
      setSource('relay');
      setGroupState('ready');
      setNotice(`Loaded ${nextGroups.length} public groups from relay.`);
      setUpdatedAt(formatUnixTime(Math.floor(Date.now() / 1000)));
      await loadMessages(nextSelected, 'relay');
    } catch (error) {
      setGroups(KINDLE_DEMO_GROUPS);
      setSelectedGroupId(KINDLE_DEMO_GROUPS[0]?.id ?? '');
      setSource('demo');
      setGroupState('error');
      setUpdatedAt(formatUnixTime(Math.floor(Date.now() / 1000)));
      setNotice(error instanceof Error ? error.message : 'Could not read from the relay. Showing demo data.');
      await loadMessages(KINDLE_DEMO_GROUPS[0]?.id ?? '', 'demo');
    }
  }, [loadMessages, selectedGroupId]);

  const selectGroup = useCallback(
    async (groupId: string) => {
      setSelectedGroupId(groupId);
      await loadMessages(groupId, source);
    },
    [loadMessages, source],
  );

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <p className={styles.kicker}>Obelisk</p>
        <h1>Kindle Lite</h1>
        <p className={styles.summary}>Read-only NIP-29 group view. No login, no posting, no realtime stream.</p>
        <button className={styles.refreshButton} type="button" onClick={refresh} disabled={groupState === 'loading'}>
          <svg aria-hidden="true" className={styles.refreshIcon} viewBox="0 0 16 16">
            <path
              d="M13 3v4H9l1.6-1.6A4 4 0 1 0 12 8h2A6 6 0 1 1 12 3.8L13 3z"
              fill="currentColor"
            />
          </svg>
          {groupState === 'loading' ? 'Refreshing' : 'Refresh'}
        </button>
        <p className={styles.statusLine}>
          {sourceLabel(source)}
          {updatedAt ? ` - ${updatedAt}` : ''}
        </p>
        <p className={styles.notice}>{notice}</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Servers and groups">
          <section className={styles.panel}>
            <h2>Servers</h2>
            <ul className={styles.serverList}>
              {KINDLE_DEFAULT_RELAYS.map((relay) => (
                <li key={relay}>{relay}</li>
              ))}
            </ul>
          </section>

          <section className={styles.panel}>
            <h2>Groups</h2>
            {groupState === 'loading' ? <p className={styles.muted}>Loading groups...</p> : null}
            <ul className={styles.groupList}>
              {groups.map((group) => (
                <li key={group.id}>
                  <button
                    className={group.id === selectedGroup?.id ? styles.groupButtonActive : styles.groupButton}
                    type="button"
                    onClick={() => {
                      void selectGroup(group.id);
                    }}
                  >
                    <span className={styles.groupName}>{group.name}</span>
                    <span className={styles.groupMeta}>
                      {group.channelKind}
                      {group.isPublic ? ' public' : ''}
                      {group.isOpen ? ' open' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className={styles.messages} aria-live="polite">
          <div className={styles.messagesHeader}>
            <h2>{selectedGroup?.name ?? 'No group selected'}</h2>
            {selectedGroup?.about ? <p>{selectedGroup.about}</p> : null}
          </div>

          {messageState === 'loading' ? <p className={styles.muted}>Loading messages...</p> : null}
          {messageState === 'error' ? <p className={styles.muted}>Messages unavailable.</p> : null}
          {messageState !== 'loading' && selectedMessages.length === 0 ? (
            <p className={styles.muted}>No recent messages to show.</p>
          ) : null}

          <ol className={styles.messageList}>
            {selectedMessages.map((message) => (
              <li key={message.id} className={styles.message}>
                <p className={styles.messageMeta}>
                  {shortPubkey(message.pubkey)} - {formatUnixTime(message.createdAt)}
                </p>
                <p className={styles.messageContent}>{message.content}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

