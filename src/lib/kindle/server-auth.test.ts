import { describe, expect, it, vi } from 'vitest';
import { generateSecretKey } from 'nostr-tools';

vi.mock('server-only', () => ({}));

import { getKindlePublishAuthHandler } from './server';

describe('Kindle relay auth signing', () => {
  it('signs NIP-42 auth challenges with the server signer key', async () => {
    const sk = generateSecretKey();
    const signAuth = getKindlePublishAuthHandler(sk);

    const signed = await signAuth({
      kind: 22242,
      content: '',
      created_at: 1,
      tags: [['relay', 'wss://public.obelisk.ar'], ['challenge', 'challenge-1']],
    });

    expect(signed.kind).toBe(22242);
    expect(signed.tags).toEqual([['relay', 'wss://public.obelisk.ar'], ['challenge', 'challenge-1']]);
    expect(signed.id).toHaveLength(64);
    expect(signed.sig).toBeTruthy();
    expect(signed.pubkey).toHaveLength(64);
  });
});
