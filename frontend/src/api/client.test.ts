import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { ApiError, apiFetch } from './client'

describe('API client', () => {
  it('turns a 422 response into an ApiError with field errors and the request ID', async () => {
    server.use(
      http.post('/api/entities', () =>
        HttpResponse.json(
          {
            error: 'validation_failed',
            message: 'Some fields are invalid',
            fields: { name: 'is required', latitude: 'must be between -90 and 90' },
            requestId: 'req-123',
          },
          { status: 422, headers: { 'X-Request-ID': 'req-123' } },
        ),
      ),
    )

    const error = await apiFetch('/entities', { method: 'POST', body: { name: '' } }).catch(
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'validation_failed',
      message: 'Some fields are invalid',
      fields: { name: 'is required', latitude: 'must be between -90 and 90' },
      requestId: 'req-123',
    })
  })

  it('takes the request ID from the X-Request-ID header when the body has none', async () => {
    server.use(
      http.get('/api/entities/abc', () =>
        HttpResponse.json(
          { error: 'not_found', message: 'Entity not found' },
          { status: 404, headers: { 'X-Request-ID': 'req-from-header' } },
        ),
      ),
    )

    const error = await apiFetch('/entities/abc').catch((e: unknown) => e)

    expect(error).toMatchObject({
      status: 404,
      code: 'not_found',
      fields: {},
      requestId: 'req-from-header',
    })
  })

  it('still produces an ApiError when the error body is not JSON', async () => {
    server.use(
      http.get('/api/entities', () =>
        new HttpResponse('Bad Gateway', {
          status: 502,
          headers: { 'X-Request-ID': 'req-502' },
        }),
      ),
    )

    const error = await apiFetch('/entities').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 502, code: 'internal', requestId: 'req-502' })
  })

  it('returns the parsed JSON body of a successful response', async () => {
    server.use(http.get('/api/entities', () => HttpResponse.json([{ id: '1', name: 'Truck 1' }])))

    await expect(apiFetch('/entities')).resolves.toEqual([{ id: '1', name: 'Truck 1' }])
  })

  it('returns undefined for a 204 response', async () => {
    server.use(http.delete('/api/entities/1', () => new HttpResponse(null, { status: 204 })))

    await expect(apiFetch('/entities/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})
