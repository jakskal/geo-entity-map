import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { listEntitiesHandler } from './test/entityHandlers'
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
})
