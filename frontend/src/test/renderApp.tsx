import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { RequestHandler } from 'msw'
import { App } from '../App'
import { AppProviders } from '../AppProviders'
import { server } from './server'

/**
 * Renders the whole app the way a user sees it, against the MSW fake API.
 * Every call gets a fresh QueryClient (no cache shared between tests) and
 * the given handlers for this test only.
 */
export function renderApp({ handlers = [] }: { handlers?: RequestHandler[] } = {}) {
  server.use(...handlers)
  const queryClient = new QueryClient({
    defaultOptions: {
      // Fail fast in tests instead of retrying with back-off.
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const result = render(
    <AppProviders queryClient={queryClient}>
      <App />
    </AppProviders>,
  )
  // The QueryClient lets a test check what the app holds as server data.
  return { ...result, queryClient }
}
