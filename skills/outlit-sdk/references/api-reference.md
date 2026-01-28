# Outlit SDK API Reference

Quick reference for all Outlit SDK methods and types.

## Table of Contents

- [Browser SDK](#browser-sdk)
- [Node.js SDK](#nodejs-sdk)
- [React Hooks](#react-hooks)
- [Configuration Options](#configuration-options)
- [Event Types](#event-types)
- [Type Definitions](#type-definitions)

---

## Browser SDK

### Initialization

#### `new Outlit(options)`

```ts
import { Outlit } from '@outlit/browser'

const outlit = new Outlit({
  publicKey: 'pk_xxx',
  trackPageviews: true,
  trackForms: true,
  autoIdentify: true,
  flushInterval: 5000,
})
```

#### `init(options)` (Singleton)

```ts
import { init } from '@outlit/browser'

init({
  publicKey: 'pk_xxx',
  trackPageviews: true,
})
```

#### `getInstance()`

Get the singleton instance:

```ts
import { getInstance } from '@outlit/browser'

const outlit = getInstance()
```

### Tracking Methods

#### `track(eventName, properties?)`

Track custom events:

```ts
outlit.track('button_clicked', {
  button_id: 'signup',
  page: '/homepage'
})
```

**Parameters:**
- `eventName`: `string` — Event name
- `properties?`: `Record<string, any>` — Event properties

#### `identify(options)`

Identify a user:

```ts
outlit.identify({
  email: 'user@example.com',
  userId: 'usr_123',
  traits: {
    name: 'John Doe',
    plan: 'pro'
  }
})
```

**Parameters:**
- `email?`: `string` — User email
- `userId?`: `string` — User ID
- `traits?`: `Record<string, any>` — User attributes

**Note:** At least one of `email` or `userId` is required.

#### `setUser(identity)`

Set user identity (links anonymous history):

```ts
outlit.setUser({
  email: 'user@example.com',
  userId: 'usr_123',
  traits: { name: 'John' }
})
```

#### `clearUser()`

Clear user identity (logout):

```ts
outlit.clearUser()
```

### User Lifecycle Methods

#### `user.identify(options)`

Same as `identify()`:

```ts
outlit.user.identify({
  email: 'user@example.com',
  traits: { name: 'John' }
})
```

#### `user.activate(properties?)`

Mark user as activated:

```ts
outlit.user.activate({
  milestone: 'onboarding_complete',
  feature: 'dashboard'
})
```

#### `user.engaged(properties?)`

Mark user as engaged:

```ts
outlit.user.engaged({
  session_count: 5,
  days_active: 7
})
```

#### `user.inactive(properties?)`

Mark user as inactive:

```ts
outlit.user.inactive({
  reason: 'low_activity',
  last_seen: '2024-01-15'
})
```

### Customer Billing Methods

#### `customer.trialing(options)`

Mark customer as trialing:

```ts
outlit.customer.trialing({
  domain: 'acme.com',
  customerId: 'cust_123',
  properties: {
    plan: 'pro',
    trial_ends: '2024-02-01'
  }
})
```

**Parameters:**
- `domain?`: `string` — Customer domain
- `customerId?`: `string` — Customer ID
- `stripeCustomerId?`: `string` — Stripe customer ID
- `properties?`: `Record<string, any>` — Additional properties

**Note:** At least one identifier is required.

#### `customer.paid(options)`

Mark customer as paid:

```ts
outlit.customer.paid({
  domain: 'acme.com',
  properties: {
    plan: 'pro',
    mrr: 99
  }
})
```

#### `customer.churned(options)`

Mark customer as churned:

```ts
outlit.customer.churned({
  domain: 'acme.com',
  properties: {
    reason: 'pricing',
    churned_at: new Date().toISOString()
  }
})
```

### Utility Methods

#### `getVisitorId()`

Get the current visitor ID:

```ts
const visitorId = outlit.getVisitorId()
// Returns: string | null
```

#### `isEnabled()`

Check if tracking is enabled:

```ts
const enabled = outlit.isEnabled()
// Returns: boolean
```

#### `enableTracking()`

Enable tracking (for consent management):

```ts
outlit.enableTracking()
```

#### `flush()`

Manually flush pending events:

```ts
await outlit.flush()
```

#### `shutdown()`

Stop tracking and flush events:

```ts
outlit.shutdown()
```

---

## Node.js SDK

### Initialization

```ts
import { Outlit } from '@outlit/node'

const outlit = new Outlit({
  publicKey: 'pk_xxx',
  flushInterval: 10000,
  maxBatchSize: 100,
  timeout: 10000,
})
```

### Tracking Methods

#### `track(options)`

Track server-side event (requires identity):

```ts
outlit.track({
  email: 'user@example.com',
  userId: 'usr_123',
  eventName: 'subscription_created',
  properties: {
    plan: 'pro',
    price: 99
  },
  timestamp: Date.now()
})
```

**Parameters:**
- `email?`: `string` — User email
- `userId?`: `string` — User ID
- `eventName`: `string` — Event name
- `properties?`: `Record<string, any>` — Event properties
- `timestamp?`: `number` — Event timestamp (milliseconds)

**Note:** At least one of `email` or `userId` is required.

#### `identify(options)`

Identify user with traits:

```ts
outlit.identify({
  email: 'user@example.com',
  userId: 'usr_123',
  traits: {
    name: 'John Doe',
    plan: 'pro',
    company: 'Acme Inc'
  },
  timestamp: Date.now()
})
```

### User Lifecycle Methods

```ts
// Activated
outlit.user.activate({
  email: 'user@example.com',
  properties: { milestone: 'trial_started' },
  timestamp: Date.now()
})

// Engaged
outlit.user.engaged({
  userId: 'usr_123',
  properties: { sessions: 10 }
})

// Inactive
outlit.user.inactive({
  email: 'user@example.com',
  properties: { reason: 'low_usage' }
})
```

### Customer Billing Methods

```ts
// Trialing
outlit.customer.trialing({
  domain: 'acme.com',
  customerId: 'cust_123',
  properties: { plan: 'pro' }
})

// Paid
outlit.customer.paid({
  stripeCustomerId: 'cus_xxx',
  properties: { plan: 'enterprise', mrr: 999 }
})

// Churned
outlit.customer.churned({
  domain: 'acme.com',
  properties: { reason: 'cost' }
})
```

### Utility Methods

#### `flush()`

Manually flush all pending events:

```ts
await outlit.flush()
```

#### `shutdown()`

Flush and stop event queue:

```ts
await outlit.shutdown()
```

#### `queueSize`

Get number of pending events:

```ts
const pending = outlit.queueSize
```

---

## React Hooks

### `useOutlit()`

Access Outlit instance in components:

```tsx
import { useOutlit } from '@outlit/browser/react'

function MyComponent() {
  const { track, identify, user, customer, isTrackingEnabled, enableTracking } = useOutlit()

  return <button onClick={() => track('click', { button: 'cta' })}>Click</button>
}
```

**Returns:**
```ts
{
  track: (eventName: string, properties?: Record<string, any>) => void
  identify: (options: BrowserIdentifyOptions) => void
  setUser: (identity: UserIdentity) => void
  clearUser: () => void
  getVisitorId: () => string | null
  user: {
    identify: (options: BrowserIdentifyOptions) => void
    activate: (properties?: Record<string, any>) => void
    engaged: (properties?: Record<string, any>) => void
    inactive: (properties?: Record<string, any>) => void
  }
  customer: {
    trialing: (options: CustomerIdentifier & { properties?: Record<string, any> }) => void
    paid: (options: CustomerIdentifier & { properties?: Record<string, any> }) => void
    churned: (options: CustomerIdentifier & { properties?: Record<string, any> }) => void
  }
  isInitialized: boolean
  isTrackingEnabled: boolean
  enableTracking: () => void
}
```

### `useTrack()`

Convenience hook for tracking events:

```tsx
import { useTrack } from '@outlit/browser/react'

function MyComponent() {
  const track = useTrack()

  return <button onClick={() => track('button_clicked')}>Click</button>
}
```

### `useIdentify()`

Convenience hook for identifying users:

```tsx
import { useIdentify } from '@outlit/browser/react'

function SignUpForm() {
  const identify = useIdentify()

  const handleSubmit = (user) => {
    identify({
      email: user.email,
      traits: { name: user.name }
    })
  }
}
```

---

## Configuration Options

### Browser SDK Options

```ts
interface OutlitOptions {
  publicKey: string              // Required
  apiHost?: string               // Default: 'https://app.outlit.ai'
  autoTrack?: boolean            // Default: true
  trackPageviews?: boolean       // Default: true
  trackForms?: boolean           // Default: true
  formFieldDenylist?: string[]   // Custom field exclusions
  flushInterval?: number         // Default: 5000ms
  autoIdentify?: boolean         // Default: true
  trackCalendarEmbeds?: boolean  // Default: true
  trackEngagement?: boolean      // Default: true
  idleTimeout?: number           // Default: 30000ms
}
```

### Node.js SDK Options

```ts
interface OutlitOptions {
  publicKey: string          // Required
  apiHost?: string           // Default: 'https://app.outlit.ai'
  flushInterval?: number     // Default: 10000ms
  maxBatchSize?: number      // Default: 100
  timeout?: number           // Default: 10000ms
}
```

### React Provider Props

```ts
interface OutlitProviderProps {
  publicKey: string
  apiHost?: string
  trackPageviews?: boolean
  trackForms?: boolean
  formFieldDenylist?: string[]
  flushInterval?: number
  autoTrack?: boolean
  autoIdentify?: boolean
  user?: UserIdentity | null
  children: ReactNode
}
```

---

## Event Types

### Built-in Event Types

```ts
type EventType =
  | 'pageview'      // Page navigation
  | 'form'          // Form submission
  | 'identify'      // User identification
  | 'custom'        // Custom event
  | 'calendar'      // Calendar booking
  | 'engagement'    // Time on page
  | 'stage'         // Journey stage change
  | 'billing'       // Billing status change
```

### Journey Stages

```ts
type ExplicitJourneyStage =
  | 'activated'     // User completed onboarding
  | 'engaged'       // User is actively using product
  | 'inactive'      // User stopped using product
```

### Billing Statuses

```ts
type BillingStatus =
  | 'trialing'      // Customer on trial
  | 'paid'          // Customer is paying
  | 'churned'       // Customer cancelled
```

---

## Type Definitions

### UserIdentity

```ts
interface UserIdentity {
  email?: string
  userId?: string
  traits?: Record<string, any>
}
```

### CustomerIdentifier

```ts
interface CustomerIdentifier {
  domain?: string
  customerId?: string
  stripeCustomerId?: string
}
```

### BrowserTrackOptions

```ts
interface BrowserTrackOptions {
  eventName: string
  properties?: Record<string, any>
}
```

### BrowserIdentifyOptions

```ts
interface BrowserIdentifyOptions {
  email?: string
  userId?: string
  traits?: Record<string, any>
}
```

### ServerTrackOptions

```ts
interface ServerTrackOptions {
  email?: string
  userId?: string
  eventName: string
  properties?: Record<string, any>
  timestamp?: number
}
```

### ServerIdentifyOptions

```ts
interface ServerIdentifyOptions {
  email?: string
  userId?: string
  traits: Record<string, any>
  timestamp?: number
}
```
