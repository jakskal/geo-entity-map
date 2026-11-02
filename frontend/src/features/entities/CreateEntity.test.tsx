import { screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { entityKeys } from '../../api/entities'
import {
  createEntityErrorHandler,
  createEntityHandler,
  listEntitiesHandler,
} from '../../test/entityHandlers'
import { renderApp } from '../../test/renderApp'
import type { Entity } from './entity'

async function openCreateForm() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Add Entity' }))
  const form = await screen.findByRole('form', { name: 'New Entity' })
  return { user, form }
}

/** Fills every required field with valid values. */
async function fillValidEntity(user: UserEvent, name = 'Pump Station') {
  await user.type(screen.getByLabelText('Name'), name)
  await user.selectOptions(screen.getByLabelText('Entity Type'), 'Facility')
  await user.selectOptions(screen.getByLabelText('Status'), 'Maintenance')
}

async function addAttribute(user: UserEvent, name: string, value: string) {
  await user.click(screen.getByRole('button', { name: 'Add Attribute' }))
  const rows = screen.getAllByLabelText(/^Attribute \d+ name$/)
  const number = rows.length
  await user.type(screen.getByLabelText(`Attribute ${number} name`), name)
  await user.type(screen.getByLabelText(`Attribute ${number} value`), value)
}

describe('Create Entity', () => {
  it('"Add Entity" opens the form with the Location at the map centre', async () => {
    renderApp({ handlers: [listEntitiesHandler([])] })

    await openCreateForm()

    expect(screen.getByLabelText('Latitude')).toHaveValue(-6.9175)
    expect(screen.getByLabelText('Longitude')).toHaveValue(107.6191)
  })

  describe('blocks invalid input with field messages', () => {
    it('reports an empty name as the operator types', async () => {
      renderApp({ handlers: [listEntitiesHandler([])] })
      const { user } = await openCreateForm()

      await user.type(screen.getByLabelText('Name'), 'a')
      await user.clear(screen.getByLabelText('Name'))

      expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Name is required')
    })

    it('reports a whitespace-only name and missing Entity Type and Status on save, without sending anything', async () => {
      const store: Entity[] = []
      renderApp({ handlers: [listEntitiesHandler([]), createEntityHandler(store)] })
      const { user } = await openCreateForm()

      await user.type(screen.getByLabelText('Name'), '   ')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Name is required')
      expect(screen.getByLabelText('Entity Type')).toHaveAccessibleDescription(
        'Choose an Entity Type',
      )
      expect(screen.getByLabelText('Status')).toHaveAccessibleDescription('Choose a Status')
      expect(store).toHaveLength(0)
    })

    it('reports a latitude of 91', async () => {
      const store: Entity[] = []
      renderApp({ handlers: [listEntitiesHandler([]), createEntityHandler(store)] })
      const { user } = await openCreateForm()
      await fillValidEntity(user)

      await user.clear(screen.getByLabelText('Latitude'))
      await user.type(screen.getByLabelText('Latitude'), '91')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByLabelText('Latitude')).toHaveAccessibleDescription(
        'Latitude must be between -90 and 90',
      )
      expect(screen.getByRole('form', { name: 'New Entity' })).toBeInTheDocument()
      expect(store).toHaveLength(0)
    })

    it('reports more than 20 Attributes', async () => {
      const store: Entity[] = []
      renderApp({ handlers: [listEntitiesHandler([]), createEntityHandler(store)] })
      const { user } = await openCreateForm()
      await fillValidEntity(user)

      for (let i = 1; i <= 21; i++) {
        await user.click(screen.getByRole('button', { name: 'Add Attribute' }))
        await user.type(screen.getByLabelText(`Attribute ${i} name`), `a${i}`)
      }
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByRole('group', { name: 'Attributes' })).toHaveAccessibleDescription(
        'At most 20 Attributes are allowed',
      )
      expect(store).toHaveLength(0)
    })

    it('reports an Attribute name longer than 50 characters', async () => {
      const store: Entity[] = []
      renderApp({ handlers: [listEntitiesHandler([]), createEntityHandler(store)] })
      const { user } = await openCreateForm()
      await fillValidEntity(user)

      await addAttribute(user, 'x'.repeat(51), 'B 1234 XY')
      await user.click(screen.getByRole('button', { name: 'Save' }))

      expect(screen.getByLabelText('Attribute 1 name')).toHaveAccessibleDescription(
        'Attribute name must be at most 50 characters',
      )
      expect(store).toHaveLength(0)
    })
  })

  it('saves a valid Entity: the form closes and the new Entity is in the list data', async () => {
    const store: Entity[] = []
    const { queryClient } = renderApp({
      handlers: [listEntitiesHandler(store), createEntityHandler(store)],
    })
    const { user } = await openCreateForm()
    await fillValidEntity(user, '  Pump Station  ')
    await user.type(screen.getByLabelText('Description'), 'North intake')
    await addAttribute(user, 'capacity', '500 l/min')
    await addAttribute(user, 'temporary', 'x')
    await user.click(screen.getByRole('button', { name: 'Remove Attribute 2' }))

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(screen.queryByRole('form', { name: 'New Entity' })).not.toBeInTheDocument(),
    )
    const list = queryClient.getQueryData<Entity[]>(entityKeys.list({}))
    expect(list).toEqual([
      expect.objectContaining({
        name: 'Pump Station',
        type: 'facility',
        status: 'maintenance',
        latitude: -6.9175,
        longitude: 107.6191,
        description: 'North intake',
        attributes: { capacity: '500 l/min' },
      }),
    ])
  })

  it('disables Save while saving', async () => {
    renderApp({
      handlers: [
        listEntitiesHandler([]),
        http.post('/api/entities', async () => {
          await delay('infinite')
          return HttpResponse.json({})
        }),
      ],
    })
    const { user } = await openCreateForm()
    await fillValidEntity(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('button', { name: 'Saving…' })).toBeDisabled()
  })

  it('Cancel closes the form without saving', async () => {
    const store: Entity[] = []
    renderApp({ handlers: [listEntitiesHandler(store), createEntityHandler(store)] })
    const { user } = await openCreateForm()
    await fillValidEntity(user)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('form', { name: 'New Entity' })).not.toBeInTheDocument()
    expect(store).toHaveLength(0)
  })

  it('shows a server 422 next to the right fields', async () => {
    renderApp({
      handlers: [
        listEntitiesHandler([]),
        createEntityErrorHandler({
          status: 422,
          fields: {
            name: 'must be at most 100 characters',
            longitude: 'must be between -180 and 180',
            attributes: 'at most 20 attributes allowed',
          },
        }),
      ],
    })
    const { user, form } = await openCreateForm()
    await fillValidEntity(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
        'must be at most 100 characters',
      ),
    )
    expect(screen.getByLabelText('Longitude')).toHaveAccessibleDescription(
      'must be between -180 and 180',
    )
    expect(screen.getByRole('group', { name: 'Attributes' })).toHaveAccessibleDescription(
      'at most 20 attributes allowed',
    )
    expect(screen.getByLabelText('Latitude')).not.toHaveAccessibleDescription()
    expect(within(form).queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a server 500 as a general message with the request ID', async () => {
    renderApp({
      handlers: [
        listEntitiesHandler([]),
        createEntityErrorHandler({ status: 500, requestId: 'req-create-500' }),
      ],
    })
    const { user, form } = await openCreateForm()
    await fillValidEntity(user)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'Something went wrong (request id: req-create-500)',
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
