export const KINDLE_GROUP_METADATA_KIND = 39000;
export const KINDLE_GROUP_MESSAGE_KIND = 9;

export interface KindleGroup {
  readonly id: string;
  readonly name: string;
  readonly about: string | null;
  readonly relay: string;
  readonly updatedAt: number;
  readonly isPublic: boolean;
  readonly isOpen: boolean;
  readonly parent: string | null;
  readonly channelKind: 'text' | 'voice' | 'voice-sfu' | 'forum';
}

export interface KindleMessage {
  readonly id: string;
  readonly groupId: string;
  readonly pubkey: string;
  readonly content: string;
  readonly createdAt: number;
  readonly replyToId: string | null;
}

export interface NostrLikeEvent {
  readonly id?: unknown;
  readonly pubkey?: unknown;
  readonly created_at?: unknown;
  readonly kind?: unknown;
  readonly tags?: unknown;
  readonly content?: unknown;
}

type Tag = readonly string[];

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeTags(tags: unknown): Tag[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag): tag is unknown[] => Array.isArray(tag))
    .map((tag) => tag.filter((item): item is string => typeof item === 'string'));
}

function firstTag(tags: readonly Tag[], name: string): string | null {
  for (const tag of tags) {
    if (tag[0] === name && tag[1]) return tag[1];
  }
  return null;
}

function parseChannelKind(tags: readonly Tag[]): KindleGroup['channelKind'] {
  let hasVoice = false;
  let hasForum = false;

  for (const tag of tags) {
    if (tag[0] !== 't') continue;
    if (tag[1] === 'voice-sfu') return 'voice-sfu';
    if (tag[1] === 'voice') hasVoice = true;
    if (tag[1] === 'forum') hasForum = true;
  }

  if (hasVoice) return 'voice';
  if (hasForum) return 'forum';
  return 'text';
}

export function parseKindleGroupEvent(event: NostrLikeEvent, relay: string): KindleGroup | null {
  if (event.kind !== KINDLE_GROUP_METADATA_KIND) return null;

  const tags = normalizeTags(event.tags);
  const id = firstTag(tags, 'd');
  const createdAt = asNumber(event.created_at);
  if (!id || createdAt === null) return null;

  const name = firstTag(tags, 'name') ?? id;
  return {
    id,
    name,
    about: firstTag(tags, 'about'),
    relay,
    updatedAt: createdAt,
    isPublic: tags.some((tag) => tag[0] === 'public'),
    isOpen: tags.some((tag) => tag[0] === 'open'),
    parent: firstTag(tags, 'parent'),
    channelKind: parseChannelKind(tags),
  };
}

export function latestKindleGroups(events: readonly NostrLikeEvent[], relay: string): KindleGroup[] {
  const byId = new Map<string, KindleGroup>();

  for (const event of events) {
    const group = parseKindleGroupEvent(event, relay);
    if (!group) continue;

    const existing = byId.get(group.id);
    if (!existing || group.updatedAt >= existing.updatedAt) {
      byId.set(group.id, group);
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const nameOrder = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    return nameOrder === 0 ? a.id.localeCompare(b.id) : nameOrder;
  });
}

export function parseKindleMessageEvent(event: NostrLikeEvent): KindleMessage | null {
  if (event.kind !== KINDLE_GROUP_MESSAGE_KIND) return null;

  const id = asString(event.id);
  const pubkey = asString(event.pubkey);
  const content = typeof event.content === 'string' ? event.content : null;
  const createdAt = asNumber(event.created_at);
  const tags = normalizeTags(event.tags);
  const groupId = firstTag(tags, 'h');

  if (!id || !pubkey || content === null || createdAt === null || !groupId) return null;

  return {
    id,
    groupId,
    pubkey,
    content,
    createdAt,
    replyToId: firstTag(tags, 'e'),
  };
}

export function latestKindleMessages(events: readonly NostrLikeEvent[], groupId: string): KindleMessage[] {
  const byId = new Map<string, KindleMessage>();

  for (const event of events) {
    const message = parseKindleMessageEvent(event);
    if (!message || message.groupId !== groupId) continue;
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.id.localeCompare(b.id);
  });
}

export function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey;
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
}

export function formatUnixTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '';
  return `${new Date(seconds * 1000).toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

