import { useOutlit } from '@outlit/browser/react'
import { useCallback } from 'react'

/**
 * Custom hook for common tracking operations
 */
export function useTracking() {
  const { track, user, customer } = useOutlit()

  const trackButtonClick = useCallback((buttonId: string, additionalProps?: Record<string, any>) => {
    track('button_clicked', {
      button_id: buttonId,
      page: window.location.pathname,
      ...additionalProps
    })
  }, [track])

  const trackFeatureUsed = useCallback((feature: string, properties?: Record<string, any>) => {
    track('feature_used', {
      feature,
      ...properties
    })
  }, [track])

  const trackFormSubmitted = useCallback((formName: string, properties?: Record<string, any>) => {
    track('form_submitted', {
      form_name: formName,
      ...properties
    })
  }, [track])

  const activateUser = useCallback((milestone: string, properties?: Record<string, any>) => {
    user.activate({
      milestone,
      ...properties
    })
  }, [user])

  return {
    track,
    trackButtonClick,
    trackFeatureUsed,
    trackFormSubmitted,
    activateUser,
    user,
    customer
  }
}
