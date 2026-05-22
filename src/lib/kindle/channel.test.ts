import { describe, expect, it } from 'vitest';
import {
  KINDLE_FIXED_GROUP_ID,
  KINDLE_FIXED_GROUP_NAME,
  KINDLE_FIXED_RELAY,
  KINDLE_FIXED_RELAYS,
  getFixedKindleGroup,
  getFixedKindleGroupId,
  getFixedKindleRelayUrl,
  getKindleGroupRelayTag,
  isAllowedKindleGroupId,
} from './channel';

describe('kindle fixed channel binding', () => {
  it('locks Kindle Paper to the requested Obelisk public channel only', () => {
    expect(KINDLE_FIXED_GROUP_ID).toBe('26a9cceda473cb1b');
    expect(KINDLE_FIXED_GROUP_NAME).toBe('General');
    expect(KINDLE_FIXED_RELAY).toBe('wss://public.obelisk.ar');
    expect(KINDLE_FIXED_RELAYS).toEqual(['wss://public.obelisk.ar']);
  });

  it('accepts only the fixed group id even if a different group is requested', () => {
    expect(getFixedKindleGroupId()).toBe('26a9cceda473cb1b');
    expect(isAllowedKindleGroupId('26a9cceda473cb1b')).toBe(true);
    expect(isAllowedKindleGroupId('other-channel')).toBe(false);
    expect(isAllowedKindleGroupId('')).toBe(false);
  });

  it('uses the plain relay host from the Obelisk URL as the NIP-29 relay tag value', () => {
    expect(getFixedKindleRelayUrl()).toBe('wss://public.obelisk.ar');
    expect(getKindleGroupRelayTag()).toBe('public.obelisk.ar');
  });

  it('exposes a single fixed group for the Kindle UI', () => {
    expect(getFixedKindleGroup()).toMatchObject({
      id: '26a9cceda473cb1b',
      name: 'General',
      relay: 'wss://public.obelisk.ar',
      isPublic: true,
      isOpen: true,
      channelKind: 'text',
    });
  });
});
