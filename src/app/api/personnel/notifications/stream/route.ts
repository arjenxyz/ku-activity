import { createAdminClient } from '@/utils/supabase/admin';
import { requirePersonnelSession } from '@/lib/personnel-auth';
import { touchPushSubscriptionLastSeen } from '@/lib/personnel-push-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STREAM_MS = 55_000;
const POLL_MS = 2_500;

export async function GET() {
  try {
    const session = await requirePersonnelSession();
    const admin = createAdminClient();

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const startedAt = Date.now();
        let since = new Date().toISOString();
        let closed = false;

        const send = (event: string, data: unknown) => {
          if (closed) return;
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send('ready', { sessionId: session.sessionId });

        const poll = async () => {
          if (closed) return;

          if (Date.now() - startedAt > STREAM_MS) {
            send('reconnect', {});
            closed = true;
            controller.close();
            return;
          }

          try {
            await touchPushSubscriptionLastSeen(admin, session.sessionId);
          } catch {
            /* */
          }

          const { data, error } = await admin
            .from('personnel_notifications')
            .select('id, type, title, body, href, read_at, created_at')
            .eq('employee_id', session.employeeId)
            .gt('created_at', since)
            .order('created_at', { ascending: true });

          if (!error && data?.length) {
            since = data[data.length - 1].created_at as string;
            send('notifications', { items: data });
          }
        };

        const interval = setInterval(() => void poll(), POLL_MS);
        void poll();

        const heartbeat = setInterval(() => send('ping', {}), 15_000);

        setTimeout(() => {
          clearInterval(interval);
          clearInterval(heartbeat);
          if (!closed) {
            send('reconnect', {});
            closed = true;
            try {
              controller.close();
            } catch {
              /* */
            }
          }
        }, STREAM_MS);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stream başlatılamadı';
    const status = message === 'UNAUTHORIZED' ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
