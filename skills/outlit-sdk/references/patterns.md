# Common Implementation Patterns

Best practices and common patterns for implementing Outlit tracking.

## Table of Contents

- [Event Taxonomy](#event-taxonomy)
- [Server-Side Tracking](#server-side-tracking)
- [Identity Resolution](#identity-resolution)
- [Webhooks](#webhooks)
- [Background Jobs](#background-jobs)
- [Error Handling](#error-handling)

---

## Event Taxonomy

### Naming Conventions

Use snake_case for event names and be descriptive:

```ts
✅ Good
track('subscription_upgraded')
track('feature_enabled')
track('export_completed')

❌ Bad
track('upgrade')
track('feature')
track('export')
```

### Recommended Events by Category

#### Authentication & User Lifecycle
```ts
track('user_registered', { method: 'email' | 'google' | 'github' })
track('user_logged_in', { method: 'password' | 'sso' })
track('user_logged_out')
track('password_reset_requested')
track('password_changed')
track('email_verified')

user.activate({ milestone: 'onboarding_complete' })
user.engaged({ session_count: 10 })
user.inactive({ reason: 'no_activity_30_days' })
```

#### Subscription & Billing
```ts
customer.trialing({ plan: 'pro', trial_ends: '2024-02-01' })
customer.paid({ plan: 'pro', mrr: 99, interval: 'monthly' })
customer.churned({ reason: 'pricing', mrr_lost: 99 })

track('subscription_created', { plan, price, interval })
track('subscription_upgraded', { from_plan, to_plan, delta_mrr })
track('subscription_downgraded', { from_plan, to_plan, delta_mrr })
track('subscription_cancelled', { plan, reason })
track('payment_succeeded', { amount, currency })
track('payment_failed', { amount, reason })
track('trial_started', { plan, trial_days })
track('trial_ending_soon', { plan, days_remaining })
```

#### Feature Usage
```ts
track('feature_used', { feature: 'export', format: 'csv' })
track('dashboard_viewed', { dashboard_type: 'analytics' })
track('report_generated', { report_type: 'monthly', rows: 1500 })
track('api_key_created', { key_name: 'production' })
track('integration_connected', { provider: 'stripe' })
track('file_uploaded', { file_type: 'csv', size_mb: 2.5 })
```

#### Collaboration & Teams
```ts
track('team_created', { team_size: 1 })
track('team_member_invited', { role: 'admin' | 'member' })
track('team_member_joined', { role: 'member' })
track('team_member_removed', { role: 'member' })
track('workspace_created', { name: 'Marketing' })
```

#### Content & Engagement
```ts
track('article_viewed', { article_id, category })
track('video_played', { video_id, duration_seconds })
track('search_performed', { query, results_count })
track('filter_applied', { filter_type, value })
track('export_downloaded', { format: 'csv', rows: 500 })
```

### Property Naming

Use consistent property names across events:

```ts
// User properties
{
  email: 'user@example.com',
  userId: 'usr_123',
  name: 'John Doe',
  plan: 'pro',
  role: 'admin'
}

// Event context
{
  page: '/dashboard',
  section: 'analytics',
  source: 'web' | 'api' | 'mobile'
}

// Metrics
{
  duration_ms: 1500,
  count: 10,
  size_mb: 2.5,
  amount: 99,
  currency: 'USD'
}
```

---

## Server-Side Tracking

### API Endpoints

Track server-side events in API routes:

```ts
// app/api/subscription/route.ts
import { Outlit } from '@outlit/node'

const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

export async function POST(req: Request) {
  const { userId, plan } = await req.json()
  const user = await db.users.findUnique({ where: { id: userId } })

  // Track subscription creation
  outlit.track({
    email: user.email,
    eventName: 'subscription_created',
    properties: {
      plan,
      source: 'web',
      trial_days: 14
    }
  })

  // Update customer status
  outlit.customer.trialing({
    email: user.email,
    properties: { plan }
  })

  await outlit.flush()

  return Response.json({ success: true })
}
```

### Background Processing

```ts
// jobs/process-payment.ts
import { Outlit } from '@outlit/node'

const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

export async function processPayment(paymentId: string) {
  const payment = await db.payments.findUnique({ where: { id: paymentId } })
  const user = await db.users.findUnique({ where: { id: payment.userId } })

  try {
    await chargeCustomer(payment)

    outlit.track({
      email: user.email,
      eventName: 'payment_succeeded',
      properties: {
        amount: payment.amount,
        currency: payment.currency,
        payment_method: payment.method
      }
    })

    outlit.customer.paid({
      email: user.email,
      properties: {
        plan: user.plan,
        mrr: payment.amount
      }
    })
  } catch (error) {
    outlit.track({
      email: user.email,
      eventName: 'payment_failed',
      properties: {
        amount: payment.amount,
        error: error.message
      }
    })
  } finally {
    await outlit.flush()
  }
}
```

### Middleware Pattern

```ts
// middleware/outlit.ts
import { Outlit } from '@outlit/node'

export const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

// Express
export function trackRequest(req, res, next) {
  res.on('finish', async () => {
    if (req.user?.email) {
      outlit.track({
        email: req.user.email,
        eventName: 'api_request',
        properties: {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration_ms: Date.now() - req.startTime
        }
      })
    }
  })
  next()
}

// Fastify
export async function trackRequestFastify(request, reply) {
  const startTime = Date.now()

  reply.addHook('onSend', async () => {
    if (request.user?.email) {
      outlit.track({
        email: request.user.email,
        eventName: 'api_request',
        properties: {
          method: request.method,
          url: request.url,
          status: reply.statusCode,
          duration_ms: Date.now() - startTime
        }
      })
    }
  })
}
```

---

## Identity Resolution

### Multi-Email Handling

When users have multiple emails, use the primary email for tracking:

```ts
// On user update
function updateUserEmail(userId: string, newEmail: string, isPrimary: boolean) {
  if (isPrimary) {
    // Re-identify with new primary email
    outlit.identify({
      userId,
      email: newEmail,
      traits: {
        secondary_emails: user.otherEmails
      }
    })
  } else {
    // Store as secondary email in traits
    outlit.identify({
      userId,
      email: user.primaryEmail,
      traits: {
        secondary_emails: [...user.otherEmails, newEmail]
      }
    })
  }
}
```

### Cross-Device Tracking

Link behavior across devices by identifying with the same email/userId:

```ts
// Device 1: Desktop (anonymous)
// -> Visitor ID: vis_abc123
// -> Events: pageview, form_submitted

// User signs up
outlit.identify({
  email: 'user@example.com'
})
// -> Links vis_abc123 history to user@example.com

// Device 2: Mobile (anonymous)
// -> Visitor ID: vis_xyz789
// -> Events: pageview

// User logs in
outlit.identify({
  email: 'user@example.com'
})
// -> Links vis_xyz789 history to user@example.com
// -> Both devices now part of same customer timeline
```

### Server-Side Identity Resolution

```ts
// When creating user server-side
async function createUser(data: SignupData) {
  const user = await db.users.create({ data })

  // Identify user immediately
  outlit.identify({
    email: user.email,
    userId: user.id,
    traits: {
      name: user.name,
      created_at: user.createdAt.toISOString(),
      signup_method: data.method
    }
  })

  outlit.user.activate({
    email: user.email,
    properties: { milestone: 'account_created' }
  })

  await outlit.flush()

  return user
}
```

---

## Webhooks

### Stripe Webhooks

```ts
// app/api/webhooks/stripe/route.ts
import { Outlit } from '@outlit/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const subscription = event.data.object as Stripe.Subscription
  const customer = await stripe.customers.retrieve(subscription.customer as string)
  const email = (customer as Stripe.Customer).email

  if (!email) {
    console.warn('No email found for customer:', subscription.customer)
    return new Response('OK', { status: 200 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
      outlit.customer.trialing({
        email,
        stripeCustomerId: subscription.customer as string,
        properties: {
          plan: subscription.items.data[0].price.lookup_key,
          trial_ends: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null
        }
      })
      break

    case 'customer.subscription.updated':
      const status = subscription.status
      if (status === 'active') {
        outlit.customer.paid({
          email,
          stripeCustomerId: subscription.customer as string,
          properties: {
            plan: subscription.items.data[0].price.lookup_key,
            mrr: subscription.items.data[0].price.unit_amount! / 100
          }
        })
      }
      break

    case 'customer.subscription.deleted':
      outlit.customer.churned({
        email,
        stripeCustomerId: subscription.customer as string,
        properties: {
          cancellation_reason: subscription.cancellation_details?.reason,
          churned_at: new Date().toISOString()
        }
      })
      break

    case 'invoice.payment_succeeded':
      const invoice = event.data.object as Stripe.Invoice
      outlit.track({
        email,
        eventName: 'payment_succeeded',
        properties: {
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          invoice_id: invoice.id
        }
      })
      break

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice
      outlit.track({
        email,
        eventName: 'payment_failed',
        properties: {
          amount: failedInvoice.amount_due / 100,
          currency: failedInvoice.currency,
          attempt_count: failedInvoice.attempt_count
        }
      })
      break
  }

  await outlit.flush()

  return new Response('OK', { status: 200 })
}
```

### Cal.com Webhooks

```ts
// app/api/webhooks/cal/route.ts
import { Outlit } from '@outlit/node'

const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

export async function POST(req: Request) {
  const body = await req.json()

  const { triggerEvent, payload } = body

  if (triggerEvent === 'BOOKING_CREATED') {
    const { attendees, eventType } = payload

    for (const attendee of attendees) {
      outlit.track({
        email: attendee.email,
        eventName: 'calendar_booking_created',
        properties: {
          event_type: eventType.title,
          provider: 'cal.com',
          start_time: payload.startTime,
          duration_minutes: eventType.length,
          timezone: attendee.timeZone
        }
      })

      // Mark as engaged
      outlit.user.engaged({
        email: attendee.email,
        properties: { milestone: 'demo_booked' }
      })
    }

    await outlit.flush()
  }

  return new Response('OK', { status: 200 })
}
```

---

## Background Jobs

### Bull Queue Example

```ts
// queues/analytics.ts
import Bull from 'bull'
import { Outlit } from '@outlit/node'

const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

const analyticsQueue = new Bull('analytics', {
  redis: process.env.REDIS_URL
})

analyticsQueue.process(async (job) => {
  const { email, eventName, properties } = job.data

  outlit.track({
    email,
    eventName,
    properties
  })

  await outlit.flush()
})

// Usage: Add jobs to queue
export function trackEvent(email: string, eventName: string, properties?: any) {
  analyticsQueue.add({ email, eventName, properties })
}
```

### Serverless Functions

Always flush before function completes:

```ts
// AWS Lambda
export const handler = async (event) => {
  const outlit = new Outlit({ publicKey: process.env.OUTLIT_KEY! })

  outlit.track({
    email: event.email,
    eventName: 'lambda_processed',
    properties: event.data
  })

  // Critical: Flush before returning
  await outlit.flush()

  return { statusCode: 200, body: 'OK' }
}
```

---

## Error Handling

### Graceful Degradation

Never let tracking errors break your application:

```ts
function trackSafely(eventName: string, properties?: any) {
  try {
    outlit.track(eventName, properties)
  } catch (error) {
    console.error('Tracking error:', error)
    // Don't throw - tracking should never break user experience
  }
}
```

### Retry Logic

Outlit SDK handles retries internally, but for critical events:

```ts
async function trackCriticalEvent(
  email: string,
  eventName: string,
  properties?: any,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      outlit.track({ email, eventName, properties })
      await outlit.flush()
      return
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error('Failed to track after retries:', error)
        // Log to error tracking service
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### Process Exit Handling

```ts
// Node.js
process.on('SIGTERM', async () => {
  console.log('Flushing Outlit events before shutdown...')
  await outlit.flush()
  await outlit.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Flushing Outlit events before shutdown...')
  await outlit.flush()
  await outlit.shutdown()
  process.exit(0)
})
```
