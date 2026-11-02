import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { entityKeys } from '../../api/entities'
import {
  deleteEntityErrorHandler,
  deleteEntityHandler,
  getEntityHandler,
  listEntitiesHandler,
  makeEntity,
} from '../../test/entityHandlers'
import { renderApp } from '../../test/renderApp'
import type { Entity } from './entity'

/** Selects an Entity on the map and opens the delete confirmation from its details. */
async function openDeleteDialog(name: string) {
  const user = userEvent.setup()
  // fireEvent, not userEvent, for markers: see frontend/AGENTS.md.
  fireEvent.click(await screen.findByRole('button', { name }))
  const panel = await screen.findByRole('region', { name })
  const actions = await within(panel).findByRole('group', { name: 'Actions' })
  await user.click(within(actions).getByRole('button', { name: 'Delete' }))
  const dialog = screen.getByRole('alertdialog', { name: `Delete ${name}?` })
  return { user, dialog }
}

describe('Delete an Entity', () => {
  it('confirming deletes the Entity: the details close and it is gone from the list data', async () => {
    const waterPump = makeEntity({ name: 'Water Pump' })
    const deliveryVan = makeEntity({ name: 'Delivery Van 1' })
    const store: Entity[] = [waterPump, deliveryVan]
    const { queryClient } = renderApp({
      handlers: [listEntitiesHandler(store), getEntityHandler(store), deleteEntityHandler(store)],
    })

    const { user, dialog } = await openDeleteDialog('Water Pump')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Water Pump' })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(store).toEqual([deliveryVan])
    expect(queryClient.getQueryData<Entity[]>(entityKeys.list({}))).toEqual([deliveryVan])
    expect(screen.queryByRole('button', { name: 'Water Pump' })).not.toBeInTheDocument()
  })

  it('an Entity already deleted elsewhere (404) is treated as deleted: the details close and it leaves the list data', async () => {
    const waterPump = makeEntity({ name: 'Water Pump' })
    const deliveryVan = makeEntity({ name: 'Delivery Van 1' })
    const store: Entity[] = [waterPump, deliveryVan]
    const { queryClient } = renderApp({
      handlers: [listEntitiesHandler(store), getEntityHandler(store), deleteEntityHandler(store)],
    })
    const { user, dialog } = await openDeleteDialog('Water Pump')
    // Another operator deletes it first, so this DELETE answers 404.
    store.splice(store.indexOf(waterPump), 1)

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(screen.queryByRole('region', { name: 'Water Pump' })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(queryClient.getQueryData<Entity[]>(entityKeys.list({}))).toEqual([deliveryVan])
    expect(screen.queryByRole('button', { name: 'Water Pump' })).not.toBeInTheDocument()
  })

  it('cancelling the confirmation keeps the Entity and its details', async () => {
    const waterPump = makeEntity({ name: 'Water Pump' })
    const store: Entity[] = [waterPump]
    // No delete handler: a DELETE request would fail the test.
    const { queryClient } = renderApp({
      handlers: [listEntitiesHandler(store), getEntityHandler(store)],
    })

    const { user, dialog } = await openDeleteDialog('Water Pump')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Water Pump' })).toBeInTheDocument()
    expect(queryClient.getQueryData<Entity[]>(entityKeys.list({}))).toEqual([waterPump])
  })

  it('a server error shows the message with the request ID and keeps the Entity', async () => {
    const waterPump = makeEntity({ name: 'Water Pump' })
    const store: Entity[] = [waterPump]
    const { queryClient } = renderApp({
      handlers: [
        listEntitiesHandler(store),
        getEntityHandler(store),
        deleteEntityErrorHandler({ status: 500, requestId: 'req-delete-500' }),
      ],
    })

    const { user, dialog } = await openDeleteDialog('Water Pump')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Could not delete this Entity (request id: req-delete-500).',
    )
    expect(screen.getByRole('region', { name: 'Water Pump' })).toBeInTheDocument()
    expect(queryClient.getQueryData<Entity[]>(entityKeys.list({}))).toEqual([waterPump])
  })
})
