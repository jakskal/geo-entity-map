import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './test/renderApp'

describe('App', () => {
  it('renders the Entity map', () => {
    renderApp()

    expect(screen.getByTestId('entity-map')).toBeInTheDocument()
  })

  it('credits OpenStreetMap on the map', () => {
    renderApp()

    expect(screen.getByRole('link', { name: 'OpenStreetMap' })).toBeInTheDocument()
  })
})
