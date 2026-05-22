import { createHash, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'obelisk_paper_session';
const SESSION_SALT = 'obelisk-paper-v1';

interface KindleAuthEnv {
  readonly KINDLE_PASSWORD_SHA256?: string;
}

function normalizeHash(value?: string | null): string | null {
  const hash = value?.trim().toLowerCase() ?? '';
  return /^[0-9a-f]{64}$/.test(hash) ? hash : null;
}

export function getKindlePasswordHash(env: KindleAuthEnv = process.env): string | null {
  return normalizeHash(env.KINDLE_PASSWORD_SHA256);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  if (!/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function verifyKindlePassword(password: string, configuredHash = getKindlePasswordHash()): boolean {
  if (!configuredHash) return false;
  return safeEqualHex(sha256(password), configuredHash);
}

export function createKindleSessionToken(configuredHash = getKindlePasswordHash()): string {
  if (!configuredHash) throw new Error('Kindle password is not configured.');
  return sha256(`${SESSION_SALT}:${configuredHash}`);
}

export function isKindleSessionCookieValid(cookieHeader: string | null | undefined, configuredHash = getKindlePasswordHash()): boolean {
  if (!configuredHash || !cookieHeader) return false;
  const expected = createKindleSessionToken(configuredHash);
  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const raw = cookies.find((item) => item.startsWith(`${COOKIE_NAME}=`));
  if (!raw) return false;
  const token = decodeURIComponent(raw.slice(COOKIE_NAME.length + 1));
  return safeEqualHex(token, expected);
}

export function createKindleSessionCookie(configuredHash = getKindlePasswordHash()): string {
  const token = createKindleSessionToken(configuredHash);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/kindle; HttpOnly; SameSite=Lax; Max-Age=2592000`;
}
