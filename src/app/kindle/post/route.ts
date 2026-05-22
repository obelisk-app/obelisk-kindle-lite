import { redirect } from 'next/navigation';
import { publishKindleMessage } from '@/lib/kindle/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const groupId = String(form.get('groupId') ?? '');
  const content = String(form.get('content') ?? '');

  try {
    const result = await publishKindleMessage(groupId, content);
    redirect(`/kindle?group=${encodeURIComponent(groupId)}&posted=${encodeURIComponent(result.eventId)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    redirect(`/kindle?group=${encodeURIComponent(groupId)}&error=${encodeURIComponent(message)}`);
  }
}
