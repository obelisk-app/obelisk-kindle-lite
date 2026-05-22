import { getFixedKindleGroup, KINDLE_FIXED_GROUP_ID, KINDLE_FIXED_RELAYS } from './channel';
import type { KindleGroup, KindleMessage } from './nostr';

export const KINDLE_DEFAULT_RELAYS = [...KINDLE_FIXED_RELAYS];

export const KINDLE_DEMO_GROUPS: KindleGroup[] = [getFixedKindleGroup()];

export const KINDLE_DEMO_MESSAGES: KindleMessage[] = [
  {
    id: 'kindle-demo-1',
    groupId: KINDLE_FIXED_GROUP_ID,
    pubkey: '0000000000000000000000000000000000000000000000000000000000000000',
    content: 'This is the fixed Kindle view for Obelisk General on public.obelisk.ar.',
    createdAt: 1_700_000_000,
    replyToId: null,
  },
];
