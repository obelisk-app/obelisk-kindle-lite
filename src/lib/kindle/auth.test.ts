import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
  COOKIE_NAME,
  createKindleSessionToken,
  getKindlePasswordHash,
  isKindleSessionCookieValid,
  verifyKindlePassword,
} from './auth';

describe('kindle auth', () => {
  it('verifies a password against the configured sha256 hash', () => {
    const password = 'paper-1234';
    const hash = createHash('sha256').update(password).digest('hex');

    expect(verifyKindlePassword(password, hash)).toBe(true);
    expect(verifyKindlePassword('wrong', hash)).toBe(false);
  });

  it('treats auth as disabled until a password hash is configured', () => {
    expect(getKindlePasswordHash({ KINDLE_PASSWORD_SHA256: undefined })).toBe(null);
    expect(verifyKindlePassword('anything', null)).toBe(false);
  });

  it('creates a Kindle-safe session cookie token from the configured hash', () => {
    const hash = createHash('sha256').update('paper-1234').digest('hex');
    const token = createKindleSessionToken(hash);

    expect(token).toHaveLength(64);
    expect(isKindleSessionCookieValid(`${COOKIE_NAME}=${token}`, hash)).toBe(true);
    expect(isKindleSessionCookieValid(`${COOKIE_NAME}=bad`, hash)).toBe(false);
  });
});
