#!/usr/bin/env node
import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent, generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils.js';
import { mkdirSync, existsSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';

const relay = process.env.RELAY || 'wss://public.obelisk.ar';
const keyPath = process.env.NSEC_FILE || '/root/obelisk-kindle-lite/.paper-nsec';
const groupId = process.env.GROUP_ID || '48b1f3204cab65fd';
const message = process.env.MESSAGE || `paper.obelisk.ar smoke test ${new Date().toISOString()}`;

function loadOrCreateSecret() {
  if (existsSync(keyPath)) {
    const raw = readFileSync(keyPath, 'utf8').trim();
    if (raw.startsWith('nsec')) return nip19.decode(raw).data;
    if (/^[0-9a-f]{64}$/i.test(raw)) return hexToBytes(raw);
    throw new Error(`Unsupported key format in ${keyPath}`);
  }

  const sk = generateSecretKey();
  mkdirSync(dirname(keyPath), { recursive: true });
  writeFileSync(keyPath, `${nip19.nsecEncode(sk)}\n`, { mode: 0o600 });
  chmodSync(keyPath, 0o600);
  return sk;
}

async function main() {
  const pool = new SimplePool();
  const sk = loadOrCreateSecret();
  const pubkey = getPublicKey(sk);

  const groups = await pool.querySync([relay], { kinds: [39000], limit: 80 }, { maxWait: 5000 });
  const textGroups = groups
    .map((ev) => ({
      id: ev.tags.find((t) => t[0] === 'd')?.[1],
      name: ev.tags.find((t) => t[0] === 'name')?.[1],
      tags: ev.tags,
      created_at: ev.created_at,
    }))
    .filter((g) => g.id && !g.tags.some((t) => t[0] === 't' && (t[1] === 'voice' || t[1] === 'voice-sfu' || t[1] === 'forum')))
    .sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

  const recentBefore = await pool.querySync([relay], { kinds: [9], '#h': [groupId], limit: 10 }, { maxWait: 4000 });

  const profile = finalizeEvent({
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify({ name: 'Obelisk Paper Test', about: 'Throwaway key for testing paper.obelisk.ar Kindle relay connectivity.' }),
  }, sk);

  const note = finalizeEvent({
    kind: 9,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['h', groupId]],
    content: message,
  }, sk);

  const publishOne = async (event) => {
    const pubs = pool.publish([relay], event);
    const settled = await Promise.allSettled(pubs);
    return settled.map((item) => item.status === 'fulfilled' ? { ok: true, value: item.value } : { ok: false, reason: String(item.reason) });
  };

  const profileResult = await publishOne(profile);
  const noteResult = await publishOne(note);

  await new Promise((resolve) => setTimeout(resolve, 1000));
  const verify = await pool.querySync([relay], { ids: [note.id], limit: 1 }, { maxWait: 4000 });
  const recentAfter = await pool.querySync([relay], { kinds: [9], '#h': [groupId], limit: 10 }, { maxWait: 4000 });
  pool.close([relay]);

  console.log(JSON.stringify({
    relay,
    keyPath,
    pubkey,
    npub: nip19.npubEncode(pubkey),
    selectedGroup: groupId,
    textGroups: textGroups.map((g) => ({ id: g.id, name: g.name })).slice(0, 30),
    recentBefore: recentBefore.map((ev) => ({ id: ev.id, at: ev.created_at, content: ev.content, pubkey: `${ev.pubkey.slice(0, 8)}...${ev.pubkey.slice(-4)}` })),
    posted: { id: note.id, content: note.content, tags: note.tags },
    profileResult,
    noteResult,
    verified: verify.length === 1,
    recentAfter: recentAfter.map((ev) => ({ id: ev.id, at: ev.created_at, content: ev.content, pubkey: `${ev.pubkey.slice(0, 8)}...${ev.pubkey.slice(-4)}` })),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
