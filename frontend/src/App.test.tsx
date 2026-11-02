import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { getEntityHandler, listEntitiesHandler, makeEntity } from './test/entityHandlers'
import { renderApp } from './test/renderApp'

describe('App', () => {
  it('renders the Entity map', () => {
    renderApp({ handlers: [listEntitiesHandler([])] })

    expect(screen.getByTestId('entity-map')).toBeInTheDocument()
  })

  it('credits OpenStreetMap on the map', () => {
    renderApp({ handlers: [listEntitiesHandler([])] })

    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument()
  })

  it('shows either the Entity details or the create form, never both', async () => {
    const user = userEvent.setup()
    const waterPump = makeEntity({ name: 'Water Pump' })
    renderApp({
      handlers: [listEntitiesHandler([waterPump]), getEntityHandler([waterPump])],
    })

    // Selecting an Entity opens its details, not the create form.
    fireEvent.click(await screen.findByRole('button', { name: 'Water Pump' }))
    expect(await screen.findByRole('region', { name: 'Water Pump' })).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'New Entity' })).not.toBeInTheDocument()

    // Opening the create form clears the selected Entity.
    await user.click(screen.getByRole('button', { name: 'Add Entity' }))
    expect(await screen.findByRole('form', { name: 'New Entity' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Water Pump' })).not.toBeInTheDocument()

    // Selecting an Entity closes the create form.
    fireEvent.click(screen.getByRole('button', { name: 'Water Pump' }))
    expect(await screen.findByRole('region', { name: 'Water Pump' })).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'New Entity' })).not.toBeInTheDocument()
  })
})
