export const KINDLE_ACCOUNT_NAME = "LLopo's Kindle";
export const KINDLE_ACCOUNT_ABOUT = 'Kindle bridge for Obelisk General.';

export interface KindleAccountMetadataDraft {
  readonly kind: 0;
  readonly created_at: number;
  readonly tags: [];
  readonly content: string;
}

export function buildKindleAccountMetadataEvent(createdAt = Math.floor(Date.now() / 1000)): KindleAccountMetadataDraft {
  return {
    kind: 0,
    created_at: createdAt,
    tags: [],
    content: JSON.stringify({
      name: KINDLE_ACCOUNT_NAME,
      display_name: KINDLE_ACCOUNT_NAME,
      about: KINDLE_ACCOUNT_ABOUT,
    }),
  };
}
