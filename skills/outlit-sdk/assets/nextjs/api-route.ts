// app/api/track/route.ts (Next.js App Router API Route)
import { Outlit } from '@outlit/node'
import { NextRequest, NextResponse } from 'next/server'

const outlit = new Outlit({
  publicKey: process.env.OUTLIT_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { email, eventName, properties } = await request.json()

    if (!email || !eventName) {
      return NextResponse.json(
        { error: 'Email and eventName are required' },
        { status: 400 }
      )
    }

    // Track the event
    outlit.track({
      email,
      eventName,
      properties
    })

    // Flush to ensure event is sent
    await outlit.flush()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
