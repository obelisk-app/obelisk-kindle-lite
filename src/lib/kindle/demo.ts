import type { KindleGroup, KindleMessage } from './nostr';

export const KINDLE_DEFAULT_RELAYS = ['wss://relay.obelisk.ar'];

export const KINDLE_DEMO_GROUPS: KindleGroup[] = [
  {
    id: 'obelisk-kindle-demo',
    name: 'Obelisk Kindle Demo',
    about: 'Static fallback data shown until a relay refresh succeeds.',
    relay: KINDLE_DEFAULT_RELAYS[0],
    updatedAt: 1_700_000_000,
    isPublic: true,
    isOpen: true,
    parent: null,
    channelKind: 'text',
  },
];

export const KINDLE_DEMO_MESSAGES: KindleMessage[] = [
  {
    id: 'kindle-demo-1',
    groupId: 'obelisk-kindle-demo',
    pubkey: '0000000000000000000000000000000000000000000000000000000000000000',
    content: 'This is the read-only Kindle prototype. Press Refresh to try the public NIP-29 relay.',
    createdAt: 1_700_000_000,
    replyToId: null,
  },
];

