// lib/outlit.ts
import { Outlit } from '@outlit/node'

export const outlit = new Outlit({
  publicKey: process.env.OUTLIT_KEY!,
  flushInterval: 10000,  // Flush every 10 seconds
  maxBatchSize: 100,      // Max 100 events per batch
  timeout: 10000,         // 10 second timeout
})

// Flush on process exit
process.on('SIGTERM', async () => {
  console.log('Flushing Outlit events before shutdown...')
  await outlit.flush()
  await outlit.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Flushing Outlit events before shutdown...')
  await outlit.flush()
  await outlit.shutdown()
  process.exit(0)
})
