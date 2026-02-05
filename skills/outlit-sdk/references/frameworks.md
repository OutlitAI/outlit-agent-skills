# Framework-Specific Integration Patterns

This reference provides detailed integration patterns for various frameworks and environments.

## Table of Contents

- [React](#react)
- [Next.js](#nextjs)
- [Vue 3](#vue-3)
- [Nuxt](#nuxt)
- [Svelte / SvelteKit](#svelte--sveltekit)
- [Node.js / Express](#nodejs--express)
- [Fastify](#fastify)
- [Angular](#angular)
- [Astro](#astro)

---

## React

### Installation
```bash
npm install @outlit/browser
```

### Pattern 1: React Provider (Recommended)

```tsx
// src/App.tsx or src/index.tsx
import { OutlitProvider } from '@outlit/browser/react'

function App() {
  return (
    <OutlitProvider
      publicKey={process.env.REACT_APP_OUTLIT_KEY!}
      trackPageviews
      trackForms
    >
      <YourApp />
    </OutlitProvider>
  )
}
```

### Pattern 2: Custom Hook

```tsx
// src/hooks/useTracking.ts
import { useOutlit } from '@outlit/browser/react'

export function useTracking() {
  const { track, user, customer } = useOutlit()

  const trackButtonClick = (buttonId: string) => {
    track('button_clicked', { button_id: buttonId })
  }

  const activateUser = () => {
    user.activate({ milestone: 'onboarding_complete' })
  }

  return { trackButtonClick, activateUser }
}

// Usage in component
function MyComponent() {
  const { trackButtonClick } = useTracking()

  return <button onClick={() => trackButtonClick('signup')}>Sign Up</button>
}
```

### With Authentication

```tsx
import { OutlitProvider } from '@outlit/browser/react'
import { useAuth } from './auth'

function App() {
  const { user } = useAuth()

  return (
    <OutlitProvider
      publicKey={process.env.REACT_APP_OUTLIT_KEY!}
      user={user ? {
        email: user.email,
        userId: user.id,
        traits: { name: user.name }
      } : null}
    >
      <YourApp />
    </OutlitProvider>
  )
}
```

---

## Next.js

### Installation
```bash
npm install @outlit/browser
```

### App Router (Next.js 13+)

#### app/layout.tsx
```tsx
import { OutlitProvider } from '@outlit/browser/react'
import { auth } from '@/auth' // or your auth solution

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <OutlitProvider
          publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
          user={session?.user ? {
            email: session.user.email!,
            userId: session.user.id,
            traits: { name: session.user.name }
          } : null}
        >
          {children}
        </OutlitProvider>
      </body>
    </html>
  )
}
```

#### Client Component Usage
```tsx
'use client'

import { useOutlit } from '@outlit/browser/react'

export function FeatureButton() {
  const { track } = useOutlit()

  return (
    <button onClick={() => track('feature_used', { feature: 'export' })}>
      Export Data
    </button>
  )
}
```

### Pages Router (Next.js 12 and earlier)

#### pages/_app.tsx
```tsx
import { OutlitProvider } from '@outlit/browser/react'
import { useSession } from 'next-auth/react'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  const { data: session } = useSession()

  return (
    <OutlitProvider
      publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
      user={session?.user ? {
        email: session.user.email!,
        traits: { name: session.user.name, image: session.user.image }
      } : null}
    >
      <Component {...pageProps} />
    </OutlitProvider>
  )
}
```

### Server-Side Tracking (API Routes, Server Actions)

#### API Route Example
```ts
// app/api/subscription/route.ts or pages/api/subscription.ts
import { Outlit } from '@outlit/node'

const outlit = new Outlit({
  publicKey: process.env.OUTLIT_KEY!
})

export async function POST(req: Request) {
  const { email, plan } = await req.json()

  // Track server-side event
  outlit.track({
    email,
    eventName: 'subscription_created',
    properties: { plan, source: 'web' }
  })

  // Update customer status
  outlit.customer.trialing({
    email,
    properties: { plan }
  })

  await outlit.flush()

  return Response.json({ success: true })
}
```

#### Server Action Example (App Router)
```ts
'use server'

import { Outlit } from '@outlit/node'
import { auth } from '@/auth'

const outlit = new Outlit({
  publicKey: process.env.OUTLIT_KEY!
})

export async function upgradeAccount(plan: string) {
  const session = await auth()

  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Your upgrade logic...

  // Track the upgrade
  outlit.user.activate({
    email: session.user.email,
    properties: { milestone: 'upgraded', plan }
  })

  await outlit.flush()
}
```

---

## Vue 3

Vue 3 has first-class support with a dedicated plugin and composables exported from `@outlit/browser/vue`.

### Installation
```bash
npm install @outlit/browser
```

### Plugin Setup

```ts
// main.ts
import { createApp } from 'vue'
import { OutlitPlugin } from '@outlit/browser/vue'
import App from './App.vue'

const app = createApp(App)

app.use(OutlitPlugin, {
  publicKey: import.meta.env.VITE_OUTLIT_KEY,
  trackPageviews: true,
  trackForms: true,
})

app.mount('#app')
```

### With Authentication (Recommended)

Use `useOutlitUser` for automatic reactive user identity sync:

```vue
<!-- App.vue or a top-level component -->
<script setup lang="ts">
import { computed } from 'vue'
import { useOutlitUser } from '@outlit/browser/vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Build user identity from your auth state
const outlitUser = computed(() => {
  if (!auth.user) return null
  return {
    email: auth.user.email,
    userId: auth.user.id,
    traits: {
      name: auth.user.name,
      plan: auth.user.plan
    }
  }
})

// Auto-sync user identity with Outlit (handles login/logout automatically)
useOutlitUser(outlitUser)
</script>

<template>
  <router-view />
</template>
```

### Event Tracking

Use the `useOutlit` composable for full access to tracking methods:

```vue
<script setup lang="ts">
import { useOutlit } from '@outlit/browser/vue'

const { track, user, customer } = useOutlit()

function handleUpgrade() {
  track('subscription_upgraded', { plan: 'pro' })
  user.activate({ milestone: 'upgraded' })
}

function handlePayment() {
  customer.paid({ domain: 'acme.com', plan: 'pro' })
}
</script>

<template>
  <button @click="handleUpgrade">Upgrade</button>
</template>
```

Or use the `useTrack` convenience composable for simple event tracking:

```vue
<script setup lang="ts">
import { useTrack } from '@outlit/browser/vue'

const track = useTrack()

const handleClick = () => {
  track('button_clicked', { button: 'hero_cta' })
}
</script>

<template>
  <button @click="handleClick">Click Me</button>
</template>
```

### Consent Management

For GDPR compliance, disable auto-tracking until consent:

```ts
// main.ts
app.use(OutlitPlugin, {
  publicKey: import.meta.env.VITE_OUTLIT_KEY,
  autoTrack: false, // Don't track until consent
})
```

```vue
<!-- CookieBanner.vue -->
<script setup lang="ts">
import { useOutlit } from '@outlit/browser/vue'

const { enableTracking, isTrackingEnabled } = useOutlit()

function acceptTracking() {
  localStorage.setItem('tracking-consent', 'true')
  enableTracking()
}
</script>

<template>
  <div v-if="!isTrackingEnabled" class="cookie-banner">
    <p>We use cookies to improve your experience.</p>
    <button @click="acceptTracking">Accept</button>
  </div>
</template>
```

### Plugin Options

```ts
app.use(OutlitPlugin, {
  publicKey: 'pk_xxx',              // Required
  apiHost: 'https://app.outlit.ai', // Optional, default API host
  trackPageviews: true,             // Auto-track pageviews (default: true)
  trackForms: true,                 // Auto-capture form submissions (default: true)
  trackEngagement: true,            // Track active time on page (default: true)
  autoTrack: true,                  // Start tracking immediately (default: true)
  autoIdentify: true,               // Auto-identify from form emails (default: true)
  flushInterval: 5000,              // Flush queued events interval in ms (default: 5000)
  formFieldDenylist: ['secret'],    // Fields to exclude from form capture
})
```

---

## Nuxt

### Installation
```bash
npm install @outlit/browser
```

### Plugin Setup

```ts
// plugins/outlit.client.ts
import outlit from '@outlit/browser'

export default defineNuxtPlugin(() => {
  outlit.init({
    publicKey: useRuntimeConfig().public.outlitKey
  })

  return {
    provide: {
      outlit
    }
  }
})

// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      outlitKey: process.env.NUXT_PUBLIC_OUTLIT_KEY
    }
  }
})
```

### Usage

```vue
<script setup lang="ts">
const { $outlit } = useNuxtApp()

const trackFeature = () => {
  $outlit.track('feature_used', { feature: 'export' })
}
</script>
```

---

## Svelte / SvelteKit

### Installation
```bash
npm install @outlit/browser
```

### SvelteKit Setup

```ts
// src/hooks.client.ts
import outlit from '@outlit/browser'

outlit.init({
  publicKey: import.meta.env.VITE_OUTLIT_KEY
})

export { }

// src/routes/+layout.svelte
<script lang="ts">
  import outlit from '@outlit/browser'
  import { page } from '$app/stores'

  // Track page views on route changes
  $: if ($page.url.pathname) {
    // Automatic pageview tracking is enabled by default
  }
</script>
```

### Usage in Components

```svelte
<script lang="ts">
  import outlit from '@outlit/browser'

  function handleClick() {
    outlit.track('button_clicked', { button: 'cta' })
  }
</script>

<button on:click={handleClick}>
  Click Me
</button>
```

---

## Node.js / Express

### Installation
```bash
npm install @outlit/node
```

### Express Middleware

```ts
// middleware/outlit.ts
import { Outlit } from '@outlit/node'

export const outlit = new Outlit({
  publicKey: process.env.OUTLIT_KEY!
})

// Middleware to attach to req
export function outlitMiddleware(req: any, res: any, next: any) {
  req.outlit = outlit
  next()
}

// app.ts
import express from 'express'
import { outlitMiddleware } from './middleware/outlit'

const app = express()
app.use(outlitMiddleware)

// Use in routes
app.post('/api/events', async (req, res) => {
  const { email, eventName, properties } = req.body

  req.outlit.track({
    email,
    eventName,
    properties
  })

  res.json({ success: true })
})

// Flush on shutdown
process.on('SIGTERM', async () => {
  await outlit.flush()
  process.exit(0)
})
```

---

## Fastify

### Installation
```bash
npm install @outlit/node
```

### Plugin

```ts
// plugins/outlit.ts
import { FastifyPluginAsync } from 'fastify'
import { Outlit } from '@outlit/node'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyInstance {
    outlit: Outlit
  }
}

const outlitPlugin: FastifyPluginAsync = async (fastify) => {
  const outlit = new Outlit({
    publicKey: process.env.OUTLIT_KEY!
  })

  fastify.decorate('outlit', outlit)

  fastify.addHook('onClose', async () => {
    await outlit.flush()
  })
}

export default fp(outlitPlugin)

// Usage
fastify.post('/api/subscribe', async (request, reply) => {
  const { email, plan } = request.body

  fastify.outlit.customer.trialing({
    email,
    properties: { plan }
  })

  return { success: true }
})
```

---

## Angular

### Installation
```bash
npm install @outlit/browser
```

### Service

```ts
// src/app/services/outlit.service.ts
import { Injectable } from '@angular/core'
import outlit from '@outlit/browser'

@Injectable({
  providedIn: 'root'
})
export class OutlitService {
  constructor() {
    outlit.init({
      publicKey: environment.outlitKey
    })
  }

  track(eventName: string, properties?: Record<string, any>) {
    outlit.track(eventName, properties)
  }

  identify(email: string, traits?: Record<string, any>) {
    outlit.identify({ email, traits })
  }

  get user() {
    return outlit.user
  }

  get customer() {
    return outlit.customer
  }
}

// Usage in component
export class MyComponent {
  constructor(private outlit: OutlitService) {}

  handleClick() {
    this.outlit.track('button_clicked', { button: 'cta' })
  }
}
```

---

## Astro

### Installation
```bash
npm install @outlit/browser
```

### Script Tag in Layout

```astro
---
// src/layouts/Layout.astro
const { title } = Astro.props
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{title}</title>
  </head>
  <body>
    <slot />

    <script>
      import outlit from '@outlit/browser'

      outlit.init({
        publicKey: import.meta.env.PUBLIC_OUTLIT_KEY
      })
    </script>
  </body>
</html>
```

### Client-Side Component

```astro
---
// src/components/TrackingButton.astro
---

<button id="cta-button">Click Me</button>

<script>
  import outlit from '@outlit/browser'

  document.getElementById('cta-button')?.addEventListener('click', () => {
    outlit.track('button_clicked', { button: 'cta' })
  })
</script>
```
