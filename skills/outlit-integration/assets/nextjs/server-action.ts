// app/actions/tracking.ts (Next.js Server Actions)
'use server'

import { Outlit } from '@outlit/node'
import { auth } from '@/auth'

const outlit = new Outlit({
  publicKey: process.env.OUTLIT_KEY!
})

export async function trackServerAction(eventName: string, properties?: Record<string, any>) {
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  outlit.track({
    email: session.user.email,
    eventName,
    properties
  })

  await outlit.flush()
}

export async function markUserActivated(milestone: string) {
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  outlit.user.activate({
    email: session.user.email,
    properties: { milestone }
  })

  await outlit.flush()
}
