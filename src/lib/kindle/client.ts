import {
  KINDLE_GROUP_MESSAGE_KIND,
  KINDLE_GROUP_METADATA_KIND,
  latestKindleGroups,
  latestKindleMessages,
  type KindleGroup,
  type KindleMessage,
  type NostrLikeEvent,
} from './nostr';
import type { Filter } from 'nostr-tools';

interface QueryOptions {
  readonly maxWait?: number;
}

async function queryRelay(
  relays: readonly string[],
  filter: Filter,
  options: QueryOptions = {},
): Promise<NostrLikeEvent[]> {
  const { SimplePool } = await import('nostr-tools/pool');
  const pool = new SimplePool();

  try {
    return await pool.querySync([...relays], filter, { maxWait: options.maxWait ?? 4000 });
  } finally {
    try {
      pool.close([...relays]);
    } catch {
      // Best-effort socket cleanup only.
    }
  }
}

export async function fetchKindleGroups(relays: readonly string[]): Promise<KindleGroup[]> {
  const relay = relays[0] ?? '';
  const events = await queryRelay(
    relays,
    {
      kinds: [KINDLE_GROUP_METADATA_KIND],
      limit: 64,
    },
    { maxWait: 4500 },
  );

  return latestKindleGroups(events, relay);
}

export async function fetchKindleMessages(
  relays: readonly string[],
  groupId: string,
): Promise<KindleMessage[]> {
  const events = await queryRelay(
    relays,
    {
      kinds: [KINDLE_GROUP_MESSAGE_KIND],
      '#h': [groupId],
      limit: 40,
    },
    { maxWait: 4500 },
  );

  return latestKindleMessages(events, groupId);
}
