import { OutlitProvider as BaseOutlitProvider } from '@outlit/browser/react'
import { ReactNode } from 'react'

// TODO: Replace with your actual auth hook
import { useAuth } from '@/hooks/useAuth'

interface OutlitProviderProps {
  children: ReactNode
}

export function OutlitProvider({ children }: OutlitProviderProps) {
  // Get current user from your auth system
  const { user } = useAuth()

  return (
    <BaseOutlitProvider
      publicKey={import.meta.env.VITE_OUTLIT_KEY}
      trackPageviews
      trackForms
      autoIdentify
      user={user ? {
        email: user.email,
        userId: user.id,
        traits: {
          name: user.name,
          // Add other relevant user traits
        }
      } : null}
    >
      {children}
    </BaseOutlitProvider>
  )
}
