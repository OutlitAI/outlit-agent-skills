// middleware/outlit.ts
import { Request, Response, NextFunction } from 'express'
import { outlit } from '@/lib/outlit'

export function outlitMiddleware(req: Request, res: Response, next: NextFunction) {
  // Attach outlit instance to request
  req.outlit = outlit

  // Track API requests after response
  res.on('finish', () => {
    if (req.user?.email) {
      outlit.track({
        email: req.user.email,
        eventName: 'api_request',
        properties: {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration_ms: Date.now() - req.startTime,
        }
      })
    }
  })

  next()
}

// Track request timing
export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  req.startTime = Date.now()
  next()
}

// Declare custom properties on Express Request
declare global {
  namespace Express {
    interface Request {
      outlit: typeof outlit
      startTime: number
      user?: {
        email: string
        id: string
      }
    }
  }
}
