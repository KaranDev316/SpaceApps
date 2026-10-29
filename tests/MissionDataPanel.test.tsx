import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SiteAnalysis } from '../src/types/mission'
import { useState } from 'react'
import { MissionDataPanel } from '../src/features/mission-data/MissionDataPanel'
import { Explorer } from '../src/features/explorer/Explorer'
import { mockMissionData } from '../src/data/mockMissionData'
import { useSimulation } from '../src/hooks/useSimulation'

// jsdom lacks native modal focus/inert behavior; real-browser checks cover trapping.
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
Element.prototype.scrollIntoView = vi.fn()
afterEach(cleanup)
function App() {
  const simulation = useSimulation(mockMissionData)
  return <Explorer analyses={mockMissionData} simulation={simulation} />
}
it('opens complete-site metadata from navigation, explains missing provenance and restores focus', async () => {
  render(<App />)
  const trigger = screen.getByRole('button', { name: 'Mission Data', exact: true })
  await userEvent.click(trigger)
  const panel = screen.getByRole('dialog', { name: 'Mission Data', exact: true })
  expect(within(panel).getByText('Sample Site A (sample-a)')).toBeTruthy()
  expect(within(panel).getByText('Hand-authored synthetic UI fixtures; not NASA observations or ephemerides')).toBeTruthy()
  expect(within(panel).getByText('True North, increasing clockwise')).toBeTruthy()
  expect(within(panel).getByText('0° counts as blocked.')).toBeTruthy()
  expect(within(panel).getByText(/complete; completeness is not a validation result/)).toBeTruthy()
  expect(within(panel).getByText(/Synthetic interface fixtures. No scientific validation/)).toBeTruthy()
  expect(within(panel).getAllByText('Unavailable — not supplied').length).toBeGreaterThan(3)
  expect(within(panel).getByText(/Approx. 2026-11-14T19:00:00Z → 2026-11-14T20:00:00Z/)).toBeTruthy()
  expect(document.activeElement).toBe(within(panel).getByRole('button', { name: 'Close Mission Data' }))
  await userEvent.click(within(panel).getByRole('button', { name: 'Close Mission Data' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})
it('opens partial-site methodology and describes unknowns and missing terrain', async () => {
  render(<App />)
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Landing site' }), 'sample-b')
  const trigger = screen.getByRole('button', { name: 'View Data & Methodology' })
  await userEvent.click(trigger)
  const panel = screen.getByRole('dialog')
  expect(within(panel).getByText('Sample Site B (sample-b)')).toBeTruthy()
  expect(within(panel).getByText(/supplied horizon is partial/)).toBeTruthy()
  expect(within(panel).getByText(/Missing horizon angles: 1 \(azimuths 270°\)/)).toBeTruthy()
  expect(within(panel).getByText(/Earth unknown: 1/)).toBeTruthy()
  expect(within(panel).getByText(/No quality flags supplied. This does not imply/)).toBeTruthy()
  fireEvent(panel, new Event('cancel', { bubbles: false, cancelable: true }))
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})
it('reflects updated selected metadata while open and uses supplied flag definitions without guessing', async () => {
  const site = structuredClone(mockMissionData[1])
  site.provenance = { ...site.provenance, source_datasets: ['Test source'], processing_version: 'test-v1', generated_at_utc: '2026-11-14T17:00:00Z', calculation_references: ['Test method reference'], quality_flags: ['test_flag', 'undefined_flag'], quality_flag_definitions: { test_flag: 'Definition supplied by the test pipeline.' } }
  function Harness({ data }: { data: SiteAnalysis }) {
    const [open, setOpen] = useState(false)
    return <><button onClick={() => setOpen(true)}>Open</button><MissionDataPanel open={open} onClose={() => setOpen(false)} analysis={data} range={{ start_utc: data.window.start_utc, end_utc: data.window.end_utc }} sample={data.samples[1]} /></>
  }
  const { rerender } = render(<Harness data={site} />)
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
  const panel = screen.getByRole('dialog')
  expect(within(panel).getByText('test-v1')).toBeTruthy()
  expect(within(panel).getByText('2026-11-14T17:00:00Z')).toBeTruthy()
  expect(within(panel).getByText(/Definition supplied by the test pipeline/)).toBeTruthy()
  expect(within(panel).getByText(/Explanation unavailable — the pipeline/)).toBeTruthy()
  expect(panel.textContent).toContain('Earth: unknown at 2026-11-14T19:00:00Z')
  rerender(<Harness data={mockMissionData[0]} />)
  expect(within(panel).getByText('Sample Site A (sample-a)')).toBeTruthy()
  expect(within(panel).queryByText('test-v1')).toBeNull()
  expect(within(panel).getByText(/marked complete/)).toBeTruthy()
})
