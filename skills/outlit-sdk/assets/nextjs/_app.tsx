// pages/_app.tsx (Next.js Pages Router)
import { OutlitProvider } from '@outlit/browser/react'
import type { AppProps } from 'next/app'
// TODO: Import your auth solution
import { useSession } from 'next-auth/react'

function OutlitWrapper({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  return (
    <OutlitProvider
      publicKey={process.env.NEXT_PUBLIC_OUTLIT_KEY!}
      user={session?.user ? {
        email: session.user.email!,
        traits: {
          name: session.user.name,
          image: session.user.image,
          // Add other relevant user traits
        }
      } : null}
    >
      {children}
    </OutlitProvider>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <OutlitWrapper>
      <Component {...pageProps} />
    </OutlitWrapper>
  )
}
