import { describe, expect, it } from 'vitest';
import {
  formatUnixTime,
  latestKindleGroups,
  latestKindleMessages,
  parseKindleGroupEvent,
  parseKindleMessageEvent,
  shortPubkey,
} from './nostr';

describe('kindle nostr parsing', () => {
  it('parses NIP-29 group metadata tags', () => {
    const group = parseKindleGroupEvent(
      {
        kind: 39000,
        created_at: 1700000001,
        tags: [
          ['d', 'general'],
          ['name', 'General'],
          ['about', 'Public chat'],
          ['public'],
          ['open'],
          ['t', 'forum'],
        ],
      },
      'wss://relay.example',
    );

    expect(group).toEqual({
      id: 'general',
      name: 'General',
      about: 'Public chat',
      relay: 'wss://relay.example',
      updatedAt: 1700000001,
      isPublic: true,
      isOpen: true,
      parent: null,
      channelKind: 'forum',
    });
  });

  it('keeps the newest metadata event per group', () => {
    const groups = latestKindleGroups(
      [
        { kind: 39000, created_at: 1, tags: [['d', 'chat'], ['name', 'Old']] },
        { kind: 39000, created_at: 3, tags: [['d', 'other'], ['name', 'Other']] },
        { kind: 39000, created_at: 2, tags: [['d', 'chat'], ['name', 'New']] },
      ],
      'wss://relay.example',
    );

    expect(groups.map((group) => [group.id, group.name])).toEqual([
      ['chat', 'New'],
      ['other', 'Other'],
    ]);
  });

  it('parses and sorts kind 9 group messages', () => {
    const message = parseKindleMessageEvent({
      id: 'event-1',
      pubkey: 'abcdef',
      kind: 9,
      created_at: 1700000002,
      content: 'hello',
      tags: [
        ['h', 'general'],
        ['e', 'parent'],
      ],
    });

    expect(message).toEqual({
      id: 'event-1',
      groupId: 'general',
      pubkey: 'abcdef',
      content: 'hello',
      createdAt: 1700000002,
      replyToId: 'parent',
    });

    const messages = latestKindleMessages(
      [
        { id: 'b', pubkey: 'pk', kind: 9, created_at: 2, content: 'second', tags: [['h', 'general']] },
        { id: 'a', pubkey: 'pk', kind: 9, created_at: 1, content: 'first', tags: [['h', 'general']] },
        { id: 'c', pubkey: 'pk', kind: 9, created_at: 3, content: 'wrong', tags: [['h', 'other']] },
      ],
      'general',
    );

    expect(messages.map((item) => item.content)).toEqual(['first', 'second']);
  });

  it('formats compact display helpers', () => {
    expect(shortPubkey('1234567890abcdef1234')).toBe('12345678...1234');
    expect(shortPubkey('short')).toBe('short');
    expect(formatUnixTime(0)).toBe('1970-01-01 00:00 UTC');
  });
});

