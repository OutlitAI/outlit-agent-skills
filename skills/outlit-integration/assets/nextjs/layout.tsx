// app/layout.tsx (Next.js App Router)
import { OutlitProvider } from '@outlit/browser/react'
import { ReactNode } from 'react'
// TODO: Import your auth solution
import { auth } from '@/auth'

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  // Get current session server-side
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <OutlitProvider
          publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
          trackPageviews
          user={session?.user ? {
            email: session.user.email!,
            userId: session.user.id,
            traits: {
              name: session.user.name,
              // Add other relevant user traits
            }
          } : null}
        >
          {children}
        </OutlitProvider>
      </body>
    </html>
  )
}
