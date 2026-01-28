# Authentication Provider Integrations

Patterns for integrating Outlit with popular authentication providers.

## Table of Contents

- [Clerk](#clerk)
- [NextAuth / Auth.js](#nextauth--authjs)
- [Supabase Auth](#supabase-auth)
- [Auth0](#auth0)
- [Firebase Auth](#firebase-auth)
- [Custom Auth Solution](#custom-auth-solution)

---

## Clerk

### Next.js App Router

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { OutlitProvider } from '@outlit/browser/react'
import { auth } from '@clerk/nextjs/server'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  const user = userId ? await clerkClient.users.getUser(userId) : null

  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <OutlitProvider
            publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
            user={user ? {
              email: user.emailAddresses[0]?.emailAddress,
              userId: user.id,
              traits: {
                name: `${user.firstName} ${user.lastName}`.trim(),
                createdAt: user.createdAt
              }
            } : null}
          >
            {children}
          </OutlitProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { ClerkProvider, useUser } from '@clerk/nextjs'
import { OutlitProvider } from '@outlit/browser/react'
import type { AppProps } from 'next/app'

function OutlitWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  return (
    <OutlitProvider
      publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
      user={user ? {
        email: user.emailAddresses[0]?.emailAddress,
        userId: user.id,
        traits: {
          name: user.fullName,
          username: user.username
        }
      } : null}
    >
      {children}
    </OutlitProvider>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <OutlitWrapper>
        <Component {...pageProps} />
      </OutlitWrapper>
    </ClerkProvider>
  )
}
```

### React (non-Next.js)

```tsx
import { ClerkProvider, useUser } from '@clerk/clerk-react'
import { OutlitProvider } from '@outlit/browser/react'

function OutlitWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  return (
    <OutlitProvider
      publicKey={import.meta.env.VITE_OUTLIT_KEY}
      user={user ? {
        email: user.primaryEmailAddress?.emailAddress,
        userId: user.id,
        traits: { name: user.fullName }
      } : null}
    >
      {children}
    </OutlitProvider>
  )
}

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_KEY}>
      <OutlitWrapper>
        <YourApp />
      </OutlitWrapper>
    </ClerkProvider>
  )
}
```

---

## NextAuth / Auth.js

### Next.js App Router

```tsx
// app/layout.tsx
import { OutlitProvider } from '@outlit/browser/react'
import { auth } from '@/auth' // your auth.ts config

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
            traits: {
              name: session.user.name,
              image: session.user.image
            }
          } : null}
        >
          {children}
        </OutlitProvider>
      </body>
    </html>
  )
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { SessionProvider, useSession } from 'next-auth/react'
import { OutlitProvider } from '@outlit/browser/react'
import type { AppProps } from 'next/app'

function OutlitWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  return (
    <OutlitProvider
      publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
      user={session?.user ? {
        email: session.user.email!,
        traits: {
          name: session.user.name,
          image: session.user.image
        }
      } : null}
    >
      {children}
    </OutlitProvider>
  )
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <OutlitWrapper>
        <Component {...pageProps} />
      </OutlitWrapper>
    </SessionProvider>
  )
}
```

### Tracking Login/Logout Events

```tsx
// components/LoginButton.tsx
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useOutlit } from '@outlit/browser/react'

export function AuthButtons() {
  const { data: session } = useSession()
  const { track } = useOutlit()

  const handleLogin = async () => {
    await signIn()
    // Outlit will auto-identify when user prop changes
    track('user_logged_in', { method: 'credentials' })
  }

  const handleLogout = async () => {
    track('user_logged_out')
    await signOut()
  }

  return session ? (
    <button onClick={handleLogout}>Sign Out</button>
  ) : (
    <button onClick={handleLogin}>Sign In</button>
  )
}
```

---

## Supabase Auth

### Next.js App Router

```tsx
// app/layout.tsx
import { OutlitProvider } from '@outlit/browser/react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body>
        <OutlitProvider
          publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
          user={user ? {
            email: user.email!,
            userId: user.id,
            traits: {
              name: user.user_metadata?.full_name,
              avatar: user.user_metadata?.avatar_url
            }
          } : null}
        >
          {children}
        </OutlitProvider>
      </body>
    </html>
  )
}
```

### React with Supabase

```tsx
import { createClient } from '@supabase/supabase-js'
import { OutlitProvider } from '@outlit/browser/react'
import { useEffect, useState } from 'react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <OutlitProvider
      publicKey={import.meta.env.VITE_OUTLIT_KEY}
      user={user ? {
        email: user.email!,
        userId: user.id,
        traits: {
          name: user.user_metadata?.full_name
        }
      } : null}
    >
      <YourApp />
    </OutlitProvider>
  )
}
```

### Tracking Supabase Auth Events

```tsx
'use client'

import { createClient } from '@supabase/supabase-js'
import { useOutlit } from '@outlit/browser/react'
import { useEffect } from 'react'

const supabase = createClient(...)

export function SupabaseAuthListener() {
  const { track } = useOutlit()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'SIGNED_IN':
            track('user_signed_in', {
              provider: session?.user.app_metadata.provider
            })
            break
          case 'SIGNED_OUT':
            track('user_signed_out')
            break
          case 'USER_UPDATED':
            track('user_profile_updated')
            break
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [track])

  return null
}
```

---

## Auth0

### Next.js with @auth0/nextjs-auth0

```tsx
// app/layout.tsx
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { OutlitProvider } from '@outlit/browser/react'
import { getSession } from '@auth0/nextjs-auth0'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="en">
      <body>
        <UserProvider>
          <OutlitProvider
            publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
            user={session?.user ? {
              email: session.user.email,
              userId: session.user.sub,
              traits: {
                name: session.user.name,
                picture: session.user.picture
              }
            } : null}
          >
            {children}
          </OutlitProvider>
        </UserProvider>
      </body>
    </html>
  )
}
```

### React with auth0-react

```tsx
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import { OutlitProvider } from '@outlit/browser/react'

function OutlitWrapper({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth0()

  return (
    <OutlitProvider
      publicKey={import.meta.env.VITE_OUTLIT_KEY}
      user={isAuthenticated && user ? {
        email: user.email!,
        userId: user.sub,
        traits: {
          name: user.name,
          picture: user.picture
        }
      } : null}
    >
      {children}
    </OutlitProvider>
  )
}

function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <OutlitWrapper>
        <YourApp />
      </OutlitWrapper>
    </Auth0Provider>
  )
}
```

---

## Firebase Auth

### React

```tsx
import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { OutlitProvider } from '@outlit/browser/react'
import { useEffect, useState } from 'react'

const app = initializeApp({
  // your config
})

const auth = getAuth(app)

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })

    return unsubscribe
  }, [])

  return (
    <OutlitProvider
      publicKey={import.meta.env.VITE_OUTLIT_KEY}
      user={user ? {
        email: user.email!,
        userId: user.uid,
        traits: {
          name: user.displayName,
          photoURL: user.photoURL
        }
      } : null}
    >
      <YourApp />
    </OutlitProvider>
  )
}
```

---

## Custom Auth Solution

### Pattern: Using Context

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { OutlitProvider } from '@outlit/browser/react'

interface User {
  id: string
  email: string
  name: string
}

const AuthContext = createContext<{ user: User | null }>({ user: null })

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Your custom auth logic
    fetchCurrentUser().then(setUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user }}>
      <OutlitProvider
        publicKey={import.meta.env.VITE_OUTLIT_KEY}
        user={user ? {
          email: user.email,
          userId: user.id,
          traits: { name: user.name }
        } : null}
      >
        {children}
      </OutlitProvider>
    </AuthContext.Provider>
  )
}
```

### Pattern: Manual Identity Management

```tsx
import outlit from '@outlit/browser'

// Initialize without user
outlit.init({ publicKey: 'pk_xxx' })

// On login
async function handleLogin(email: string, password: string) {
  const user = await loginUser(email, password)

  // Manually set user identity
  outlit.setUser({
    email: user.email,
    userId: user.id,
    traits: { name: user.name }
  })

  outlit.track('user_logged_in', { method: 'password' })
}

// On logout
function handleLogout() {
  outlit.track('user_logged_out')
  outlit.clearUser()
}
```

---

## General Patterns

### Tracking Registration

```tsx
import { useOutlit } from '@outlit/browser/react'

function SignUpForm() {
  const { identify, track, user } = useOutlit()

  const handleSubmit = async (formData) => {
    const newUser = await registerUser(formData)

    // Identify the user (links anonymous history)
    identify({
      email: newUser.email,
      traits: {
        name: newUser.name,
        signupMethod: 'email',
        signupDate: new Date().toISOString()
      }
    })

    // Mark as activated
    user.activate({ milestone: 'signed_up' })

    // Track registration event
    track('user_registered', {
      method: 'email',
      plan: formData.plan
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Tracking Profile Updates

```tsx
function ProfileForm() {
  const { identify, track } = useOutlit()

  const handleUpdate = async (updates) => {
    await updateUserProfile(updates)

    // Re-identify with updated traits
    identify({
      email: currentUser.email,
      traits: updates
    })

    track('profile_updated', { fields: Object.keys(updates) })
  }

  return <form onSubmit={handleUpdate}>...</form>
}
```
