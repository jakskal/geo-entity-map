import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  getEntityHandler,
  getEntityNotFoundHandler,
  listEntitiesHandler,
  makeEntity,
} from '../../test/entityHandlers'
import { renderApp } from '../../test/renderApp'
import { formatTimestamp } from './EntityDetailsPanel'

const waterPump = makeEntity({
  name: 'Water Pump',
  type: 'iot_device',
  status: 'maintenance',
  latitude: -6.9147,
  longitude: 107.6098,
  description: 'Pumps water for the north block',
  attributes: { serial: 'WP-0042', firmware: '1.4.2' },
  createdAt: '2026-11-01T08:00:00Z',
  updatedAt: '2026-11-02T09:30:00Z',
})
const deliveryVan = makeEntity({ name: 'Delivery Van 1' })

/**
 * Clicks an Entity's marker. Uses fireEvent rather than userEvent: userEvent
 * hovers first, which opens the marker's Tooltip, and Leaflet's synthetic
 * `preclick` then loses userEvent's pointer coordinates (NaN LatLng in jsdom).
 */
async function clickMarker(name: string) {
  fireEvent.click(await screen.findByRole('button', { name }))
}

describe('Entity details', () => {
  it('selecting an Entity on the map shows all its fields and Attributes', async () => {
    renderApp({
      handlers: [
        listEntitiesHandler([waterPump, deliveryVan]),
        getEntityHandler([waterPump, deliveryVan]),
      ],
    })

    await clickMarker('Water Pump')

    const panel = await screen.findByRole('region', { name: 'Water Pump' })
    await waitFor(() => expect(within(panel).getByText('IoT device')).toBeInTheDocument())
    expect(panel).toHaveTextContent('Maintenance')
    expect(panel).toHaveTextContent('-6.9147')
    expect(panel).toHaveTextContent('107.6098')
    expect(panel).toHaveTextContent('Pumps water for the north block')
    expect(panel).toHaveTextContent('serial')
    expect(panel).toHaveTextContent('WP-0042')
    expect(panel).toHaveTextContent('firmware')
    expect(panel).toHaveTextContent('1.4.2')
    expect(panel).toHaveTextContent(formatTimestamp('2026-11-01T08:00:00Z'))
    expect(panel).toHaveTextContent(formatTimestamp('2026-11-02T09:30:00Z'))
    expect(within(panel).getByRole('group', { name: 'Actions' })).toBeInTheDocument()
  })

  it('formats timestamps in a readable local format', () => {
    expect(formatTimestamp('2026-11-01T08:00:00Z')).toMatch(/2026/)
    expect(formatTimestamp('2026-11-01T08:00:00Z')).not.toContain('T08:00:00Z')
  })

  it('selecting another Entity switches the details to it', async () => {
    renderApp({
      handlers: [
        listEntitiesHandler([waterPump, deliveryVan]),
        getEntityHandler([waterPump, deliveryVan]),
      ],
    })

    await clickMarker('Water Pump')
    await screen.findByRole('region', { name: 'Water Pump' })
    await clickMarker('Delivery Van 1')

    expect(await screen.findByRole('region', { name: 'Delivery Van 1' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Water Pump' })).not.toBeInTheDocument()
  })

  it('close hides the details panel', async () => {
    const user = userEvent.setup()
    renderApp({
      handlers: [listEntitiesHandler([waterPump]), getEntityHandler([waterPump])],
    })

    await clickMarker('Water Pump')
    const panel = await screen.findByRole('region', { name: 'Water Pump' })
    await user.click(within(panel).getByRole('button', { name: 'Close details' }))

    expect(screen.queryByRole('region', { name: 'Water Pump' })).not.toBeInTheDocument()
  })

  it('shows that the Entity no longer exists when the API answers 404, and can be closed', async () => {
    const user = userEvent.setup()
    renderApp({
      handlers: [listEntitiesHandler([waterPump]), getEntityNotFoundHandler()],
    })

    await clickMarker('Water Pump')

    const panel = await screen.findByRole('region', { name: 'Entity details' })
    expect(await within(panel).findByRole('alert')).toHaveTextContent('This Entity no longer exists.')
    await user.click(within(panel).getByRole('button', { name: 'Close details' }))

    expect(screen.queryByRole('region', { name: 'Entity details' })).not.toBeInTheDocument()
  })
})
