import { redirect } from 'next/navigation';
import { createKindleSessionCookie, isKindleSessionCookieValid, verifyKindlePassword } from '@/lib/kindle/auth';
import { publishKindleMessage } from '@/lib/kindle/server';

function redirectToKindle(groupId: string, params: Record<string, string>): never {
  const search = new URLSearchParams({ group: groupId, ...params });
  redirect(`/kindle?${search.toString()}`);
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
    redirectToKindle(groupId, { error: 'Password required' });
  }

  try {
    const result = await publishKindleMessage(groupId, content);
    redirectToKindle(groupId, { posted: result.eventId });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) throw error;
    const message = error instanceof Error ? error.message : 'Publish failed';
    redirectToKindle(groupId, { error: message });
  }
}
