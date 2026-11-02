import { setupServer } from 'msw/node'

// The fake API: plays the Go backend at `/api` for every frontend test.
// Each test registers the handlers it needs with `server.use(...)`
// (or via `renderApp({ handlers })`); they are reset after every test.
export const server = setupServer()
