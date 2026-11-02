import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { entityKeys } from '../../api/entities'
import {
  getEntityHandler,
  listEntitiesHandler,
  makeEntity,
  updateEntityErrorHandler,
  updateEntityHandler,
} from '../../test/entityHandlers'
import { renderApp } from '../../test/renderApp'
import type { Entity } from './entity'
import { formatTimestamp } from './EntityDetailsPanel'

function waterPump(): Entity {
  return makeEntity({
    name: 'Water Pump',
    type: 'iot_device',
    status: 'maintenance',
    latitude: -6.9147,
    longitude: 107.6098,
    description: 'Pumps water for the north block',
    attributes: { serial: 'WP-0042' },
  })
}

/** Selects the Entity's marker (see frontend/AGENTS.md for why fireEvent) and clicks Edit. */
async function openEditForm(name: string) {
  const user = userEvent.setup()
  fireEvent.click(await screen.findByRole('button', { name }))
  const panel = await screen.findByRole('region', { name })
  const actions = await within(panel).findByRole('group', { name: 'Actions' })
  await user.click(within(actions).getByRole('button', { name: 'Edit' }))
  const form = await screen.findByRole('form', { name: 'Edit Entity' })
  return { user, form }
}

describe('Edit Entity', () => {
  it('the edit form starts with the Entity’s current values', async () => {
    const store = [waterPump()]
    renderApp({ handlers: [listEntitiesHandler(store), getEntityHandler(store)] })

    await openEditForm('Water Pump')

    expect(screen.getByLabelText('Name')).toHaveValue('Water Pump')
    expect(screen.getByLabelText('Entity Type')).toHaveValue('iot_device')
    expect(screen.getByLabelText('Status')).toHaveValue('maintenance')
    expect(screen.getByLabelText('Latitude')).toHaveValue(-6.9147)
    expect(screen.getByLabelText('Longitude')).toHaveValue(107.6098)
    expect(screen.getByLabelText('Description')).toHaveValue('Pumps water for the north block')
    expect(screen.getByLabelText('Attribute 1 name')).toHaveValue('serial')
    expect(screen.getByLabelText('Attribute 1 value')).toHaveValue('WP-0042')
  })

  it('a successful edit sends a full update and shows the new values in the details and the list', async () => {
    const store = [waterPump()]
    const { id, createdAt } = store[0]
    const { queryClient } = renderApp({
      handlers: [listEntitiesHandler(store), getEntityHandler(store), updateEntityHandler(store)],
    })
    const { user } = await openEditForm('Water Pump')

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Water Pump North')
    await user.selectOptions(screen.getByLabelText('Status'), 'Active')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const panel = await screen.findByRole('region', { name: 'Water Pump North' })
    expect(screen.queryByRole('form', { name: 'Edit Entity' })).not.toBeInTheDocument()
    expect(panel).toHaveTextContent('Active')
    expect(panel).toHaveTextContent(formatTimestamp('2026-11-02T10:00:00Z'))
    // The fake backend replaces the stored Entity with exactly what was sent.
    expect(store).toEqual([
      {
        id,
        name: 'Water Pump North',
        type: 'iot_device',
        status: 'active',
        latitude: -6.9147,
        longitude: 107.6098,
        description: 'Pumps water for the north block',
        attributes: { serial: 'WP-0042' },
        createdAt,
        updatedAt: '2026-11-02T10:00:00Z',
      },
    ])
    const list = queryClient.getQueryData<Entity[]>(entityKeys.list({}))
    expect(list?.map((entity) => entity.name)).toEqual(['Water Pump North'])
  })

  it('a server 422 shows each reason next to its field and keeps the form open', async () => {
    const store = [waterPump()]
    renderApp({
      handlers: [
        listEntitiesHandler(store),
        getEntityHandler(store),
        updateEntityErrorHandler({
          status: 422,
          fields: {
            name: 'name must be at most 100 characters',
            attributes: 'attribute names must be unique',
          },
        }),
      ],
    })
    const { user, form } = await openEditForm('Water Pump')

    await user.click(within(form).getByRole('button', { name: 'Save' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
        'name must be at most 100 characters',
      ),
    )
    expect(within(form).getByText('attribute names must be unique')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Edit Entity' })).toBeInTheDocument()
  })

  it('a general server error shows the request ID', async () => {
    const store = [waterPump()]
    renderApp({
      handlers: [
        listEntitiesHandler(store),
        getEntityHandler(store),
        updateEntityErrorHandler({ status: 500, requestId: 'req-put-500' }),
      ],
    })
    const { user, form } = await openEditForm('Water Pump')

    await user.click(within(form).getByRole('button', { name: 'Save' }))

    expect(await within(form).findByRole('alert')).toHaveTextContent(
      'Something went wrong (request id: req-put-500)',
    )
  })

  it('cancel discards the changes and leaves the Entity unchanged', async () => {
    const store = [waterPump()]
    // No PUT handler: any update request would fail the test.
    renderApp({ handlers: [listEntitiesHandler(store), getEntityHandler(store)] })
    const { user } = await openEditForm('Water Pump')

    await user.clear(screen.getByLabelText('Name'))
    await user.type(screen.getByLabelText('Name'), 'Renamed')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    const panel = await screen.findByRole('region', { name: 'Water Pump' })
    expect(panel).toHaveTextContent('Maintenance')
    expect(screen.queryByRole('form', { name: 'Edit Entity' })).not.toBeInTheDocument()

    // Editing again starts from the saved values, not the discarded ones.
    await user.click(within(panel).getByRole('button', { name: 'Edit' }))
    expect(await screen.findByLabelText('Name')).toHaveValue('Water Pump')
  })
})
