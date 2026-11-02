import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/** Wraps the app in the providers it needs. Tests pass their own QueryClient. */
export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: ReactNode
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
