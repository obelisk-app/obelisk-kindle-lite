import type { KindleGroup } from './nostr';

export const KINDLE_FIXED_GROUP_ID = '26a9cceda473cb1b';
export const KINDLE_FIXED_GROUP_NAME = 'General';
export const KINDLE_FIXED_RELAY_HOST = 'public.obelisk.ar';
export const KINDLE_FIXED_RELAY = `wss://${KINDLE_FIXED_RELAY_HOST}`;
export const KINDLE_FIXED_RELAYS = [KINDLE_FIXED_RELAY] as const;

export function getFixedKindleGroupId(): string {
  return KINDLE_FIXED_GROUP_ID;
}

export function isAllowedKindleGroupId(groupId: string | null | undefined): boolean {
  return groupId === KINDLE_FIXED_GROUP_ID;
}

export function getFixedKindleRelayUrl(): string {
  return KINDLE_FIXED_RELAY;
}

export function getKindleGroupRelayTag(): string {
  return KINDLE_FIXED_RELAY_HOST;
}

export function getFixedKindleGroup(): KindleGroup {
  return {
    id: KINDLE_FIXED_GROUP_ID,
    name: KINDLE_FIXED_GROUP_NAME,
    about: 'Obelisk public chat general.',
    relay: KINDLE_FIXED_RELAY,
    updatedAt: 0,
    isPublic: true,
    isOpen: true,
    parent: null,
    channelKind: 'text',
  };
}
