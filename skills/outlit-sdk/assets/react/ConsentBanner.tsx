import { useOutlit } from '@outlit/browser/react'
import { useState, useEffect } from 'react'

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
            className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded transition"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
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
