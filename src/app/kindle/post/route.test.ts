import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

vi.mock('@/lib/kindle/server', () => ({
  publishKindleMessage: vi.fn(),
}));

vi.mock('@/lib/kindle/auth', async (orig) => {
  const actual = await orig<typeof import('@/lib/kindle/auth')>();
  return {
    ...actual,
    verifyKindlePassword: vi.fn(actual.verifyKindlePassword),
  };
});

import { POST } from './route';
import {
  COOKIE_NAME,
  createKindleSessionCookie,
  createKindleSessionToken,
  verifyKindlePassword,
} from '@/lib/kindle/auth';
import { publishKindleMessage } from '@/lib/kindle/server';

const publishKindleMessageMock = vi.mocked(publishKindleMessage);
const verifyKindlePasswordMock = vi.mocked(verifyKindlePassword);
const passwordHash = 'a'.repeat(64);

describe('/kindle/post', () => {
  beforeEach(() => {
    process.env.KINDLE_PASSWORD_SHA256 = passwordHash;
    publishKindleMessageMock.mockReset();
    verifyKindlePasswordMock.mockReset();
  });

  afterEach(() => {
    delete process.env.KINDLE_PASSWORD_SHA256;
  });

  it('sets a Kindle password session cookie from the easy password form', async () => {
    verifyKindlePasswordMock.mockReturnValueOnce(true);
    const request = new Request('http://paper.test/kindle/post', {
      method: 'POST',
      body: new URLSearchParams({ action: 'login', password: 'paper-1234' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/kindle');
    expect(response.headers.get('set-cookie')).toContain(`${COOKIE_NAME}=${createKindleSessionToken(passwordHash)}`);
    expect(verifyKindlePasswordMock).toHaveBeenCalledWith('paper-1234');
  });

  it('rejects posts without the Kindle password session cookie', async () => {
    const request = new Request('http://paper.test/kindle/post', {
      method: 'POST',
      body: new URLSearchParams({ groupId: 'general', content: 'hello' }),
    });

    await expect(POST(request)).rejects.toThrow('NEXT_REDIRECT:/kindle?group=general&error=Password+required');
    expect(publishKindleMessageMock).not.toHaveBeenCalled();
  });

  it('publishes with the server nsec when the password session cookie is present', async () => {
    publishKindleMessageMock.mockResolvedValue({ eventId: 'event-1', verified: true, pubkey: 'pubkey', npub: 'npub' });
    const request = new Request('http://paper.test/kindle/post', {
      method: 'POST',
      headers: { cookie: createKindleSessionCookie(passwordHash) },
      body: new URLSearchParams({ groupId: 'general', content: 'hello' }),
    });

    await expect(POST(request)).rejects.toThrow('NEXT_REDIRECT:/kindle?group=general&posted=event-1');
    expect(publishKindleMessageMock).toHaveBeenCalledWith('general', 'hello');
  });
});
