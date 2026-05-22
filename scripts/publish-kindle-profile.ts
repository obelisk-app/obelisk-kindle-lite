import { existsSync, readFileSync } from 'node:fs';
import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent, nip19 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils.js';
import { buildKindleAccountMetadataEvent } from '../src/lib/kindle/profile';
import { KINDLE_DEFAULT_RELAYS } from '../src/lib/kindle/demo';

async function main() {
  const keyPath = process.env.KINDLE_SERVER_NSEC_FILE || '/root/obelisk-kindle-lite/.paper-nsec';
  if (!existsSync(keyPath)) throw new Error(`Missing key file: ${keyPath}`);

  const raw = readFileSync(keyPath, 'utf8').trim();
  const sk = raw.startsWith('nsec') ? (nip19.decode(raw).data as Uint8Array) : hexToBytes(raw);
  const event = finalizeEvent(buildKindleAccountMetadataEvent(), sk);
  const pool = new SimplePool();

  try {
    const settled = await Promise.allSettled(pool.publish([...KINDLE_DEFAULT_RELAYS], event));
    const ok = settled.some((item) => item.status === 'fulfilled');
    if (!ok) throw new Error(JSON.stringify(settled));
    console.log(JSON.stringify({ eventId: event.id, relays: KINDLE_DEFAULT_RELAYS, content: event.content }, null, 2));
  } finally {
    pool.close([...KINDLE_DEFAULT_RELAYS]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
