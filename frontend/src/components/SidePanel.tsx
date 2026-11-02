import type { ComponentProps } from 'react'

const SHELL = 'absolute top-4 right-4 z-[1000] max-h-[calc(100%-2rem)] rounded bg-white shadow-lg'

/**
 * The panel in the map's top-right corner (Entity details, create and edit
 * forms). `className` adds width and layout; other props go to the
 * `<section>`, e.g. `aria-labelledby` to make it a named region.
 */
export function SidePanel({ className = '', ...props }: ComponentProps<'section'>) {
  return <section {...props} className={`${SHELL} ${className}`} />
}
