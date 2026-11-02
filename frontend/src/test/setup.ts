import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// Any request without a matching handler fails the test, so a test can never
// silently depend on an endpoint it did not set up.
//
// MSW's plain `onUnhandledFrame: 'error'` only logs and makes the fetch
// reject; the app catches that as a query error and the test still passes.
// So we also record each unhandled request and fail the test after it ends.
const unhandledRequests: string[] = []

beforeAll(() =>
  server.listen({
    onUnhandledFrame({ frame, defaults }) {
      defaults.error()
      const data = frame.data as { request?: Request }
      unhandledRequests.push(
        data.request ? `${data.request.method} ${data.request.url}` : `${frame.protocol} frame`,
      )
    },
  }),
)

afterEach(() => {
  cleanup()
  server.resetHandlers()
  const unhandled = unhandledRequests.splice(0)
  if (unhandled.length > 0) {
    throw new Error(`Request(s) with no MSW handler:\n  ${unhandled.join('\n  ')}`)
  }
})

afterAll(() => server.close())
