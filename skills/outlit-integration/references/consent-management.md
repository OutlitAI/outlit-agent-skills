# Consent Management and GDPR Compliance

Patterns for implementing privacy-compliant tracking with Outlit SDK.

## Overview

Outlit SDK supports GDPR-compliant tracking through deferred initialization. The SDK can be installed but not track any events until the user provides consent.

**Key Methods:**
- `autoTrack: false` — Initialize SDK but don't track events
- `enableTracking()` — Start tracking after consent
- `isTrackingEnabled()` — Check current tracking status

## Table of Contents

- [Browser SDK Patterns](#browser-sdk-patterns)
- [Integration with Consent Management Platforms](#integration-with-consent-management-platforms)
- [Custom Consent Banner Component](#custom-consent-banner-component)
- [Testing Consent Implementation](#testing-consent-implementation)

---

## Browser SDK Patterns

### Pattern 1: Deferred Initialization (Recommended)

Initialize Outlit with `autoTrack: false`, then enable tracking after consent.

#### Script Tag

```html
<!-- Load SDK but don't track automatically -->
<script
  src="https://cdn.outlit.ai/stable/outlit.js"
  data-public-key="pk_xxx"
  data-auto-track="false"
  async
></script>

<!-- Your consent banner -->
<div id="consent-banner">
  <p>We use analytics to improve your experience.</p>
  <button onclick="acceptCookies()">Accept</button>
  <button onclick="rejectCookies()">Reject</button>
</div>

<script>
  function acceptCookies() {
    // Save consent preference
    localStorage.setItem('outlit_consent', 'granted')

    // Enable tracking
    window.outlit.enableTracking()

    // Hide banner
    document.getElementById('consent-banner').style.display = 'none'
  }

  function rejectCookies() {
    localStorage.setItem('outlit_consent', 'denied')
    document.getElementById('consent-banner').style.display = 'none'
  }

  // Check saved consent on load
  if (localStorage.getItem('outlit_consent') === 'granted') {
    window.outlit.enableTracking()
    document.getElementById('consent-banner').style.display = 'none'
  }
</script>
```

#### React Provider

```tsx
import { OutlitProvider } from '@outlit/browser/react'
import { ConsentBanner } from './components/ConsentBanner'

function App() {
  const [hasConsent, setHasConsent] = useState(() => {
    return localStorage.getItem('outlit_consent') === 'granted'
  })

  return (
    <OutlitProvider
      publicKey={process.env.REACT_APP_OUTLIT_KEY!}
      autoTrack={hasConsent}
    >
      {!hasConsent && <ConsentBanner onAccept={() => setHasConsent(true)} />}
      <YourApp />
    </OutlitProvider>
  )
}
```

#### Next.js App Router

```tsx
// app/layout.tsx
import { OutlitProvider } from '@outlit/browser/react'
import { ConsentBanner } from '@/components/ConsentBanner'
import { cookies } from 'next/headers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const consent = cookieStore.get('outlit_consent')?.value === 'granted'

  return (
    <html lang="en">
      <body>
        <OutlitProvider
          publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
          autoTrack={consent}
        >
          <ConsentBanner />
          {children}
        </OutlitProvider>
      </body>
    </html>
  )
}

// components/ConsentBanner.tsx
'use client'

import { useOutlit } from '@outlit/browser/react'
import { useState, useEffect } from 'react'

export function ConsentBanner() {
  const { enableTracking, isTrackingEnabled } = useOutlit()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show banner if no consent decision made
    const consent = document.cookie.includes('outlit_consent=granted')
    setShow(!consent && !isTrackingEnabled)
  }, [isTrackingEnabled])

  const handleAccept = () => {
    document.cookie = 'outlit_consent=granted; max-age=31536000; path=/'
    enableTracking()
    setShow(false)
  }

  const handleReject = () => {
    document.cookie = 'outlit_consent=denied; max-age=31536000; path=/'
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="consent-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={handleAccept}>Accept</button>
      <button onClick={handleReject}>Reject</button>
    </div>
  )
}
```

---

## Integration with Consent Management Platforms

### Cookiebot

```html
<!-- Cookiebot script -->
<script
  id="Cookiebot"
  src="https://consent.cookiebot.com/uc.js"
  data-cbid="YOUR-COOKIEBOT-ID"
  type="text/javascript"
></script>

<!-- Outlit SDK -->
<script
  src="https://cdn.outlit.ai/stable/outlit.js"
  data-public-key="pk_xxx"
  data-auto-track="false"
  async
></script>

<script>
  window.addEventListener('CookiebotOnAccept', function () {
    if (Cookiebot.consent.statistics) {
      window.outlit.enableTracking()
    }
  })

  window.addEventListener('CookiebotOnDecline', function () {
    // Tracking remains disabled
  })

  // Check consent on load
  if (window.Cookiebot && Cookiebot.consent.statistics) {
    window.outlit.enableTracking()
  }
</script>
```

### OneTrust

```html
<!-- OneTrust script -->
<script
  src="https://cdn.cookielaw.org/scripttemplates/otSDKStub.js"
  type="text/javascript"
  charset="UTF-8"
  data-domain-script="YOUR-ONETRUST-ID"
></script>

<!-- Outlit SDK -->
<script
  src="https://cdn.outlit.ai/stable/outlit.js"
  data-public-key="pk_xxx"
  data-auto-track="false"
  async
></script>

<script>
  function OptanonWrapper() {
    // Check for performance/analytics consent (category C0002)
    if (window.OnetrustActiveGroups.includes('C0002')) {
      window.outlit.enableTracking()
    }
  }
</script>
```

### Google Consent Mode v2

```html
<script>
  // Initialize Google Consent Mode
  window.dataLayer = window.dataLayer || []
  function gtag() { dataLayer.push(arguments) }

  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied'
  })

  // Load Outlit with tracking disabled
  window.outlit = window.outlit || { _q: [] }
  window.outlit._config = {
    publicKey: 'pk_xxx',
    autoTrack: false
  }
</script>

<script src="https://cdn.outlit.ai/stable/outlit.js" async></script>

<script>
  function handleConsentUpdate(consent) {
    // Update Google Consent Mode
    gtag('consent', 'update', {
      'analytics_storage': consent ? 'granted' : 'denied'
    })

    // Enable/disable Outlit tracking
    if (consent) {
      window.outlit.enableTracking()
    }
  }

  // Your consent banner callbacks
  document.getElementById('accept').addEventListener('click', () => {
    handleConsentUpdate(true)
  })
</script>
```

---

## Custom Consent Banner Component

### React Implementation

```tsx
// components/ConsentBanner.tsx
import { useOutlit } from '@outlit/browser/react'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function ConsentBanner() {
  const { enableTracking, isTrackingEnabled } = useOutlit()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = getCookie('outlit_consent')
    if (!consent && !isTrackingEnabled) {
      setVisible(true)
    }
  }, [isTrackingEnabled])

  const handleAccept = () => {
    setCookie('outlit_consent', 'granted', 365)
    enableTracking()
    setVisible(false)
  }

  const handleReject = () => {
    setCookie('outlit_consent', 'denied', 365)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Cookie Consent</h3>
          <p className="text-sm text-gray-300">
            We use analytics cookies to understand how you use our site and improve your experience.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

// Cookie utilities
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`
}
```

### Vue Composition API

```vue
<!-- components/ConsentBanner.vue -->
<template>
  <div v-if="visible" class="consent-banner">
    <div class="consent-content">
      <h3>Cookie Consent</h3>
      <p>We use analytics cookies to understand how you use our site.</p>
    </div>
    <div class="consent-actions">
      <button @click="handleReject">Reject</button>
      <button @click="handleAccept">Accept</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import outlit from '@outlit/browser'

const visible = ref(false)

onMounted(() => {
  const consent = getCookie('outlit_consent')
  if (!consent && !outlit.isTrackingEnabled()) {
    visible.value = true
  }
})

function handleAccept() {
  setCookie('outlit_consent', 'granted', 365)
  outlit.enableTracking()
  visible.value = false
}

function handleReject() {
  setCookie('outlit_consent', 'denied', 365)
  visible.value = false
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`
}
</script>

<style scoped>
.consent-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #1f2937;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 9999;
}
</style>
```

---

## Best Practices

### 1. Cookie Expiration

Set consent cookies with appropriate expiration (typically 1 year):

```js
document.cookie = 'outlit_consent=granted; max-age=31536000; path=/'
```

### 2. Respect User Choice

Once the user rejects cookies, don't show the banner again:

```js
const consent = getCookie('outlit_consent')
if (consent === 'denied') {
  // Don't enable tracking or show banner
  return
}
```

### 3. Granular Consent

If your banner offers granular choices (e.g., "Analytics" vs "Marketing"), only enable Outlit for analytics consent:

```tsx
function handleConsentUpdate(preferences: ConsentPreferences) {
  if (preferences.analytics) {
    outlit.enableTracking()
  }

  if (preferences.marketing) {
    // Enable marketing tools
  }
}
```

### 4. Server-Side Consent Checking (Next.js)

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'

export default async function RootLayout({ children }) {
  const cookieStore = await cookies()
  const hasConsent = cookieStore.get('outlit_consent')?.value === 'granted'

  return (
    <OutlitProvider autoTrack={hasConsent}>
      {children}
    </OutlitProvider>
  )
}
```

### 5. EU Geo-Targeting

Only show consent banner to EU visitors:

```tsx
function App() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user is in EU (use geo-IP service)
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']

        if (euCountries.includes(data.country_code)) {
          const consent = getCookie('outlit_consent')
          setShowBanner(!consent)
        } else {
          // Auto-enable for non-EU
          outlit.enableTracking()
        }
      })
  }, [])

  return (
    <OutlitProvider autoTrack={false}>
      {showBanner && <ConsentBanner />}
      <YourApp />
    </OutlitProvider>
  )
}
```

---

## Testing Consent Implementation

### Manual Testing Checklist

1. **Initial Load (No Consent)**
   - [ ] Banner is visible
   - [ ] No tracking events sent
   - [ ] `isTrackingEnabled()` returns `false`

2. **After Accepting**
   - [ ] Banner disappears
   - [ ] Consent cookie is set
   - [ ] Tracking begins (pageview event sent)
   - [ ] `isTrackingEnabled()` returns `true`

3. **After Rejecting**
   - [ ] Banner disappears
   - [ ] Denial cookie is set
   - [ ] No tracking events sent
   - [ ] Banner doesn't reappear on reload

4. **Return Visit (Consent Granted)**
   - [ ] Banner doesn't appear
   - [ ] Tracking works automatically

5. **Return Visit (Consent Denied)**
   - [ ] Banner doesn't appear
   - [ ] No tracking events sent

### DevTools Network Tab

Check for requests to `app.outlit.ai/api/i/v1/...`:

```
✓ Consent granted: Requests appear
✗ Consent denied: No requests
✗ No consent decision: No requests (until accepted)
```
