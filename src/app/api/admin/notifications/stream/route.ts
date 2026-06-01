import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const notifications = await prisma.adminNotification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
          const unreadCount = notifications.filter((n) => !n.isRead).length
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ notifications, unreadCount })}\n\n`)
          )
        } catch {
          // Ignore DB errors during stream
        }
      }

      await send()

      const interval = setInterval(send, 15000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
