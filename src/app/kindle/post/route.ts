import { createKindleSessionCookie, isKindleSessionCookieValid, verifyKindlePassword } from '@/lib/kindle/auth';
import { publishKindleMessage } from '@/lib/kindle/server';

function redirectToKindle(request: Request, groupId: string, params: Record<string, string>): Response {
  const search = new URLSearchParams({ group: groupId, ...params });
  return Response.redirect(new URL(`/kindle?${search.toString()}`, request.url), 303);
}

export async function POST(request: Request): Promise<Response | void> {
  const form = await request.formData();
  const action = String(form.get('action') ?? '');
  const groupId = String(form.get('groupId') ?? '');
  const content = String(form.get('content') ?? '');

  if (action === 'login') {
    const password = String(form.get('password') ?? '');
    if (!verifyKindlePassword(password)) {
      return Response.redirect(new URL('/kindle?error=Bad+password', request.url), 303);
    }
    return new Response(null, {
      status: 303,
      headers: {
        location: '/kindle',
        'set-cookie': createKindleSessionCookie(),
      },
    });
  }

  if (!isKindleSessionCookieValid(request.headers.get('cookie'))) {
    return redirectToKindle(request, groupId, { error: 'Password required' });
  }

  try {
    const result = await publishKindleMessage(groupId, content);
    return redirectToKindle(request, groupId, { posted: result.eventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    return redirectToKindle(request, groupId, { error: message });
  }
}
