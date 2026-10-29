import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockMissionData } from '../src/data/mockMissionData'
import { Explorer } from '../src/features/explorer/Explorer'
import { useSimulation } from '../src/hooks/useSimulation'
import { suitabilityLabel } from '../src/features/comparison/comparison'

Element.prototype.scrollIntoView = vi.fn()
afterEach(cleanup)
function App() {
  const simulation = useSimulation(mockMissionData)
  return <Explorer analyses={mockMissionData} simulation={simulation} />
}
it('renders null suitability independently of numerical comparison metrics', () => {
  expect(mockMissionData.every(({ site }) => site.suitability === null)).toBe(true)
  render(<App />)
  const table = screen.getByRole('table', { name: 'Metrics over the selected comparison period' })
  const row = within(table).getByRole('row', { name: /^Suitability/ })
  const cells = within(row).getAllByRole('cell')
  expect(cells.map((cell) => cell.textContent)).toEqual(['Not yet assessed', 'Not yet assessed'])
  expect(row.textContent).not.toMatch(/[0-9%]/)
  expect(within(table).getByRole('row', { name: /Earth visible/ }).textContent).toContain('3 / 4 (75.0%)')
  expect(screen.queryByRole('progressbar')).toBeNull()
  expect(screen.queryByText(/best site/i)).toBeNull()
  expect(screen.getByText(/Future assessments require an agreed data definition and science-team approval/)).toBeTruthy()
})
it('does not interpret unapproved numeric or object payloads', () => {
  expect(suitabilityLabel(null)).toBe('Not yet assessed')
  expect(suitabilityLabel(undefined)).toBe('Not yet assessed')
  for (const payload of [0, 100, 'excellent', { score: 99 }]) expect(suitabilityLabel(payload)).toBe('Awaiting agreed definition')
})
it('places Compare after Explorer and focuses comparison without resetting the period', async () => {
  render(<App />)
  const nav = screen.getByRole('navigation', { name: 'Primary' })
  expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual(['Explorer', 'Compare'])
  await userEvent.click(screen.getByRole('button', { name: '20:00–21:00' }))
  await userEvent.click(within(nav).getByRole('link', { name: 'Compare' }))
  expect(document.activeElement?.id).toBe('compare')
  expect(screen.getByRole('combobox', { name: 'Simulation time (UTC)' }).textContent).toBe('2026-11-14T20:00:00Z2026-11-14T21:00:00Z')
  await userEvent.click(within(nav).getByRole('link', { name: 'Explorer' }))
  expect(document.activeElement?.id).toBe('explorer')
})
