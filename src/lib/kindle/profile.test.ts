import { describe, expect, it } from 'vitest';
import { KINDLE_ACCOUNT_NAME, buildKindleAccountMetadataEvent } from './profile';

describe('kindle account profile metadata', () => {
  it('uses the requested account name', () => {
    expect(KINDLE_ACCOUNT_NAME).toBe("LLopo's Kindle");
  });

  it('builds a kind 0 metadata event draft for the server signer account', () => {
    expect(buildKindleAccountMetadataEvent(123)).toEqual({
      kind: 0,
      created_at: 123,
      tags: [],
      content: JSON.stringify({
        name: "LLopo's Kindle",
        display_name: "LLopo's Kindle",
        about: 'Kindle bridge for Obelisk General.',
      }),
    });
  });
});
