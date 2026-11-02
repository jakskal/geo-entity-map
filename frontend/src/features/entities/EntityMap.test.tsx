import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  listEntitiesErrorHandler,
  listEntitiesHandler,
  listEntitiesPendingHandler,
  makeEntity,
} from '../../test/entityHandlers'
import { renderApp } from '../../test/renderApp'

describe('Entity map', () => {
  it('shows a loading indicator while Entities are being fetched', async () => {
    renderApp({ handlers: [listEntitiesPendingHandler()] })

    expect(await screen.findByRole('status')).toHaveTextContent('Loading Entities…')
  })

  it('shows an error with the request ID when Entities cannot be loaded, and retry refetches', async () => {
    const user = userEvent.setup()
    renderApp({
      handlers: [
        listEntitiesErrorHandler({ requestId: 'req-abc-123' }),
        listEntitiesHandler([makeEntity({ name: 'Water Pump' })]),
      ],
    })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Could not load Entities (request id: req-abc-123)')

    await user.click(within(alert).getByRole('button', { name: 'Retry' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a hint on how to create the first Entity when there are none', async () => {
    renderApp({ handlers: [listEntitiesHandler([])] })

    expect(
      await screen.findByText('No Entities yet. Click anywhere on the map to create the first one.'),
    ).toBeInTheDocument()
  })

  it('does not show the empty-state hint when there are Entities', async () => {
    renderApp({ handlers: [listEntitiesHandler([makeEntity()])] })

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.queryByText(/No Entities yet/)).not.toBeInTheDocument()
  })

  it('names each marker after its Entity, showing markup in a name as plain text', async () => {
    renderApp({
      handlers: [listEntitiesHandler([makeEntity({ name: 'Pump <b>North</b>' })])],
    })

    expect(await screen.findByRole('button', { name: 'Pump <b>North</b>' })).toBeInTheDocument()
  })

  it('has a legend listing every Entity Type and Status', async () => {
    renderApp({ handlers: [listEntitiesHandler([])] })

    const legend = screen.getByRole('region', { name: 'Legend' })
    for (const label of ['Vehicle', 'IoT device', 'Facility', 'Other']) {
      expect(within(legend).getByText(label)).toBeInTheDocument()
    }
    for (const label of ['Active', 'Inactive', 'Maintenance', 'Offline']) {
      expect(within(legend).getByText(label)).toBeInTheDocument()
    }
  })

  // Narrow screens start with the legend collapsed (CSS shows it from `sm` up).
  it('has a legend toggle for narrow screens', async () => {
    const user = userEvent.setup()
    renderApp({ handlers: [listEntitiesHandler([])] })
    const legend = screen.getByRole('region', { name: 'Legend' })

    const toggle = within(legend).getByRole('button', { name: 'Show legend' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(within(legend).getByRole('button', { name: 'Hide legend' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})
