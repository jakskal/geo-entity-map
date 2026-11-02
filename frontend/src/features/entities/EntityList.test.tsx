import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { getEntityHandler, listEntitiesHandler, makeEntity } from '../../test/entityHandlers'
import { renderApp } from '../../test/renderApp'

const waterPump = makeEntity({ name: 'Water Pump', type: 'iot_device', status: 'maintenance' })
const deliveryVan = makeEntity({ name: 'Delivery Van 1', type: 'vehicle', status: 'active' })
const warehouse = makeEntity({ name: 'Warehouse North', type: 'facility', status: 'active' })
const allEntities = [waterPump, deliveryVan, warehouse]

function entityList() {
  return screen.getByRole('region', { name: 'Entities' })
}

/** Names of the Entities in the side list, in order. */
function rowNames() {
  return within(entityList())
    .queryAllByRole('listitem')
    .map((row) => row.querySelector('[data-entity-name]')?.textContent)
}

describe('Entity list', () => {
  it('shows every Entity from the API with its name, Entity Type and Status', async () => {
    renderApp({ handlers: [listEntitiesHandler(allEntities)] })

    await waitFor(() => expect(rowNames()).toEqual(['Delivery Van 1', 'Warehouse North', 'Water Pump']))
    const pumpRow = within(entityList()).getByRole('button', { name: /Water Pump/ })
    expect(pumpRow).toHaveTextContent('IoT device')
    expect(pumpRow).toHaveTextContent('Maintenance')
    expect(entityList()).toHaveTextContent('3 Entities shown')
  })

  it('sends the chosen Entity Type and Status to the API and shows only the matches', async () => {
    const user = userEvent.setup()
    const requestedUrls: string[] = []
    renderApp({
      handlers: [recordListRequests(requestedUrls), listEntitiesHandler(allEntities)],
    })
    await waitFor(() => expect(rowNames()).toHaveLength(3))

    await user.selectOptions(within(entityList()).getByLabelText('Filter by Status'), 'Active')
    await waitFor(() => expect(rowNames()).toEqual(['Delivery Van 1', 'Warehouse North']))
    expect(entityList()).toHaveTextContent('2 Entities shown')

    await user.selectOptions(within(entityList()).getByLabelText('Filter by Entity Type'), 'Facility')
    await waitFor(() => expect(rowNames()).toEqual(['Warehouse North']))
    expect(entityList()).toHaveTextContent('1 Entity shown')

    expect(requestedUrls).toContain('/api/entities?status=active')
    expect(requestedUrls).toContain('/api/entities?type=facility&status=active')
  })

  it('shows the same filtered Entities on the map as in the list', async () => {
    const user = userEvent.setup()
    renderApp({ handlers: [listEntitiesHandler(allEntities)] })
    expect(await screen.findByRole('button', { name: 'Water Pump' })).toBeInTheDocument()

    await user.selectOptions(within(entityList()).getByLabelText('Filter by Entity Type'), 'Vehicle')

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Water Pump' })).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('button', { name: 'Delivery Van 1' })).toBeInTheDocument()
  })

  it('says when no Entities match the filters', async () => {
    const user = userEvent.setup()
    renderApp({ handlers: [listEntitiesHandler(allEntities)] })
    await waitFor(() => expect(rowNames()).toHaveLength(3))

    await user.selectOptions(within(entityList()).getByLabelText('Filter by Status'), 'Offline')

    expect(await within(entityList()).findByText('No Entities match these filters.')).toBeInTheDocument()
    expect(entityList()).toHaveTextContent('0 Entities shown')
    expect(screen.queryByText(/No Entities yet/)).not.toBeInTheDocument()
  })

  it('clears both filters in one action, restoring the full list', async () => {
    const user = userEvent.setup()
    renderApp({ handlers: [listEntitiesHandler(allEntities)] })
    await waitFor(() => expect(rowNames()).toHaveLength(3))
    await user.selectOptions(within(entityList()).getByLabelText('Filter by Entity Type'), 'Facility')
    await user.selectOptions(within(entityList()).getByLabelText('Filter by Status'), 'Active')
    await waitFor(() => expect(rowNames()).toEqual(['Warehouse North']))

    await user.click(within(entityList()).getByRole('button', { name: 'Clear filters' }))

    await waitFor(() => expect(rowNames()).toHaveLength(3))
    expect(within(entityList()).getByLabelText('Filter by Entity Type')).toHaveValue('')
    expect(within(entityList()).getByLabelText('Filter by Status')).toHaveValue('')
    expect(within(entityList()).getByRole('button', { name: 'Clear filters' })).toBeDisabled()
  })

  it('clicking a row opens that Entity’s details', async () => {
    const user = userEvent.setup()
    renderApp({
      handlers: [listEntitiesHandler(allEntities), getEntityHandler(allEntities)],
    })

    await user.click(await within(entityList()).findByRole('button', { name: /Water Pump/ }))

    const panel = await screen.findByRole('region', { name: 'Water Pump' })
    await waitFor(() => expect(within(panel).getByText('IoT device')).toBeInTheDocument())
    expect(within(entityList()).getByRole('button', { name: /Water Pump/ })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('can be collapsed and expanded again', async () => {
    const user = userEvent.setup()
    renderApp({ handlers: [listEntitiesHandler(allEntities)] })
    await waitFor(() => expect(rowNames()).toHaveLength(3))

    await user.click(screen.getByRole('button', { name: 'Hide list' }))
    expect(within(entityList()).queryByRole('list')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Show list' }))
    expect(rowNames()).toHaveLength(3)
  })
})

/**
 * Records the path and query of each list request, then falls through to the
 * next handler (an MSW resolver that returns nothing does not answer).
 */
function recordListRequests(requestedUrls: string[]) {
  return http.get('/api/entities', ({ request }) => {
    const url = new URL(request.url)
    requestedUrls.push(`${url.pathname}${url.search}`)
  })
}
