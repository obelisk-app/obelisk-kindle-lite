import 'server-only';

import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent, generateSecretKey, getPublicKey, nip19, type Filter } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils.js';
import { buildKindleAccountMetadataEvent, KINDLE_ACCOUNT_NAME } from './profile';
import { KINDLE_DEFAULT_RELAYS } from './demo';
import { getFixedKindleGroup, getFixedKindleGroupId, getKindleGroupRelayTag, isAllowedKindleGroupId } from './channel';
import {
  KINDLE_GROUP_MESSAGE_KIND,
  latestKindleMessages,
  type KindleGroup,
  type KindleMessage,
} from './nostr';

const DEFAULT_KEY_PATH = process.env.KINDLE_SERVER_NSEC_FILE || '/root/obelisk-kindle-lite/.paper-nsec';
const MAX_MESSAGE_LENGTH = 500;

export interface KindleRelaySnapshot {
  readonly relays: readonly string[];
  readonly groups: KindleGroup[];
  readonly selectedGroup: KindleGroup | null;
  readonly messages: KindleMessage[];
  readonly error: string | null;
}

interface QueryOptions {
  readonly maxWait?: number;
}

interface RelayPool {
  querySync(relays: string[], filter: Filter, options?: QueryOptions): Promise<unknown[]>;
  publish(relays: string[], event: unknown): Promise<unknown>[];
  close(relays: string[]): void;
}

async function createPool(): Promise<RelayPool> {
  return new SimplePool() as RelayPool;
}

function closePool(pool: RelayPool, relays: readonly string[]) {
  try {
    pool.close([...relays]);
  } catch {
    // Best-effort socket cleanup.
  }
}

export async function fetchKindleSnapshot(groupId?: string | null): Promise<KindleRelaySnapshot> {
  const relays = KINDLE_DEFAULT_RELAYS;
  const pool = await createPool();

  try {
    const groups = [getFixedKindleGroup()];
    const selectedGroup = groups[0];

    const messageEvents = await pool.querySync(
      [...relays],
      { kinds: [KINDLE_GROUP_MESSAGE_KIND], '#h': [selectedGroup.id], limit: 40 },
      { maxWait: 4500 },
    );
    const messages = latestKindleMessages(messageEvents, selectedGroup.id);

    return { relays, groups, selectedGroup, messages, error: null };
  } catch (error) {
    return {
      relays,
      groups: [],
      selectedGroup: null,
      messages: [],
      error: error instanceof Error ? error.message : 'Relay read failed.',
    };
  } finally {
    closePool(pool, relays);
  }
}

function loadSecretKey(path = DEFAULT_KEY_PATH): Uint8Array {
  if (existsSync(path)) {
    const raw = readFileSync(path, 'utf8').trim();
    if (raw.startsWith('nsec')) return nip19.decode(raw).data as Uint8Array;
    if (/^[0-9a-f]{64}$/i.test(raw)) return hexToBytes(raw);
    throw new Error(`Unsupported key format in ${path}`);
  }

  const sk = generateSecretKey();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${nip19.nsecEncode(sk)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
  return sk;
}

export function getKindleServerSigner() {
  const sk = loadSecretKey();
  const pubkey = getPublicKey(sk);
  return {
    sk,
    pubkey,
    npub: nip19.npubEncode(pubkey),
    name: KINDLE_ACCOUNT_NAME,
  };
}

export async function publishKindleAccountMetadata() {
  const signer = getKindleServerSigner();
  const event = finalizeEvent(buildKindleAccountMetadataEvent(), signer.sk);
  const pool = await createPool();

  try {
    const settled = await Promise.allSettled(pool.publish([...KINDLE_DEFAULT_RELAYS], event));
    const ok = settled.some((item) => item.status === 'fulfilled');
    if (!ok) {
      const reason = settled.map((item) => (item.status === 'rejected' ? String(item.reason) : '')).join('; ');
      throw new Error(reason || 'Relay rejected profile metadata.');
    }

    return {
      eventId: event.id,
      pubkey: signer.pubkey,
      npub: signer.npub,
      name: KINDLE_ACCOUNT_NAME,
    };
  } finally {
    closePool(pool, KINDLE_DEFAULT_RELAYS);
  }
}

export async function publishKindleMessage(groupId: string, content: string) {
  const cleanGroupId = getFixedKindleGroupId();
  const cleanContent = content.replace(/\r\n/g, '\n').trim().slice(0, MAX_MESSAGE_LENGTH);

  if (!isAllowedKindleGroupId(groupId.trim())) throw new Error('Kindle posting is locked to Obelisk General.');
  if (!cleanContent) throw new Error('Missing message.');

  const signer = getKindleServerSigner();
  const event = finalizeEvent(
    {
      kind: KINDLE_GROUP_MESSAGE_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['h', cleanGroupId, getKindleGroupRelayTag()],
        ['-'],
      ],
      content: cleanContent,
    },
    signer.sk,
  );

  const pool = await createPool();
  try {
    const settled = await Promise.allSettled(pool.publish([...KINDLE_DEFAULT_RELAYS], event));
    const ok = settled.some((item) => item.status === 'fulfilled');
    if (!ok) {
      const reason = settled.map((item) => (item.status === 'rejected' ? String(item.reason) : '')).join('; ');
      throw new Error(reason || 'Relay rejected publish.');
    }

    const verify = await pool.querySync(
      [...KINDLE_DEFAULT_RELAYS],
      { kinds: [KINDLE_GROUP_MESSAGE_KIND], '#h': [cleanGroupId], limit: 1 },
      { maxWait: 3500 },
    );
    return {
      eventId: event.id,
      verified: verify.length === 1,
      pubkey: signer.pubkey,
      npub: signer.npub,
    };
  } finally {
    closePool(pool, KINDLE_DEFAULT_RELAYS);
  }
}
