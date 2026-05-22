# Obelisk Paper signing model

The Kindle browser does not keep Nostr relay WebSockets. It only sends normal HTTP GET/POST requests to `/kindle`.

Current prototype:

1. The Next.js server connects to `wss://public.obelisk.ar` with `nostr-tools/SimplePool`.
2. `/kindle` fetches NIP-29 group metadata and kind 9 messages server-side.
3. The Kindle receives plain HTML only.
4. Posting uses a server-side throwaway nsec stored at `/root/obelisk-kindle-lite/.paper-nsec` by default.

Target remote-signing architecture:

1. Kindle opens `/kindle/login`.
2. Server creates a persistent NIP-46 session secret and local signer key.
3. Kindle displays a plain `nostrconnect://...` link or QR/SVG.
4. User approves the connection in Amber/nsec.app from another device or session.
5. Server keeps the NIP-46 WebSocket/subscription alive.
6. Kindle posts plain HTTP forms to the server.
7. Server requests `sign_event` from the remote signer and publishes the signed event to `wss://public.obelisk.ar`.

Reason: Kindle stays HTTP-only; server absorbs WebSocket and signer complexity.

Security note: never use Fabri's main nsec as the server fallback. The current `.paper-nsec` is a disposable smoke-test identity only.
