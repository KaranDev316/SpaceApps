import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangeSelector, type DateRangeSelectorProps } from '../src/features/date-range/DateRangeSelector'
import { DateRangeControls } from '../src/features/date-range/DateRangeControls'
import { useSimulation } from '../src/hooks/useSimulation'
import { mockMissionData } from '../src/data/mockMissionData'
import { Explorer } from '../src/features/explorer/Explorer'

// jsdom has no layout scrolling; assert navigation through state and focus instead.
Element.prototype.scrollIntoView = vi.fn()
afterEach(cleanup)
const samples = mockMissionData[0].samples.map(({ utc }) => utc)
const available = { start: samples[0], end: samples[3] }
function Controlled({ onChange = () => {}, ...props }: Partial<DateRangeSelectorProps>) {
  const [value, setValue] = useState(props.value ?? available)
  return <DateRangeSelector available={available} samples={samples} {...props} value={value} onChange={(next) => { setValue(next); onChange(next) }} />
}

describe('UTC sample range selector', () => {
  it('lists only provided instants, using 24-hour UTC without seconds or native inputs', () => {
    render(<Controlled />)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
    for (const name of ['From', 'To']) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name} `) }))
      const options = within(screen.getByRole('listbox', { name })).getAllByRole('option')
      expect(options.map((option) => option.textContent?.replace('✓', ''))).toEqual(['18:00 UTC', '19:00 UTC', '20:00 UTC', '21:00 UTC'])
      fireEvent.keyDown(options[0], { key: 'Escape' })
    }
    expect(document.querySelector('input')).toBeNull()
    expect(screen.getByText('Sample data covers 14 Nov 2026 only.')).toBeTruthy()
  })
  it('snaps end to a later start and emits ISO UTC', async () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} value={{ start: samples[0], end: samples[1] }} />)
    await userEvent.click(screen.getByRole('button', { name: /^From / }))
    await userEvent.click(within(screen.getByRole('listbox', { name: 'From' })).getByRole('option', { name: '21:00 UTC' }))
    expect(onChange).toHaveBeenLastCalledWith({ start: samples[3], end: samples[3] })
    expect(screen.getByText('To moved to 21:00 UTC to stay at or after From.')).toBeTruthy()
    expect(screen.getByText(/Selected:.*21:00 to 21:00 UTC · 1 sample/)).toBeTruthy()
  })
  it('presets, full window, tick selection and endpoint arrows emit only recorded UTC instants', async () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '18:00–19:00' }))
    expect(onChange).toHaveBeenLastCalledWith({ start: samples[0], end: samples[1] })
    await userEvent.click(screen.getByRole('button', { name: '20:00–21:00' }))
    expect(onChange).toHaveBeenLastCalledWith({ start: samples[2], end: samples[3] })
    fireEvent.keyDown(screen.getByRole('button', { name: '20:00 UTC, From' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith({ start: samples[3], end: samples[3] })
    await userEvent.click(screen.getByRole('button', { name: '18:00 UTC, outside range' }))
    expect(onChange).toHaveBeenLastCalledWith({ start: samples[0], end: samples[3] })
    await userEvent.click(screen.getByRole('button', { name: 'Full window' }))
    expect(onChange).toHaveBeenLastCalledWith(available)
    for (const [range] of onChange.mock.calls) for (const value of Object.values(range)) expect(samples).toContain(value)
  })
  it('allows keyboard listbox navigation', () => {
    const onChange = vi.fn()
    render(<Controlled onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /^From / }))
    fireEvent.keyDown(within(screen.getByRole('listbox', { name: 'From' })).getByRole('option', { name: '18:00 UTC' }), { key: 'ArrowDown' })
    expect(onChange).toHaveBeenLastCalledWith({ start: samples[1], end: samples[3] })
  })
  it('changing site restores its full window', () => {
    const { result } = renderHook(() => useSimulation(mockMissionData))
    act(() => result.current.applyRange({ start_utc: samples[1], end_utc: samples[2] }))
    act(() => result.current.selectSite('sample-b'))
    expect(result.current.range).toEqual({ start_utc: samples[0], end_utc: samples[3] })
    expect(result.current.analysis?.samples).toHaveLength(4)
  })
  it('multi-day calendar disables unsampled days and selects any sampled day', async () => {
    const multi = [samples[0], '2026-11-16T20:00:00Z', '2026-12-02T21:00:00Z']
    const onChange = vi.fn()
    render(<Controlled samples={multi} available={{ start: multi[0], end: multi[2] }} value={{ start: multi[0], end: multi[2] }} onChange={onChange} />)
    const missing = screen.getByRole('button', { name: '2026-11-15, no samples' }) as HTMLButtonElement
    expect(missing.disabled).toBe(true)
    expect(missing.title).toBe('No samples on this day')
    await userEvent.click(missing)
    expect(onChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: '2026-11-16, samples available' }))
    expect(onChange).toHaveBeenLastCalledWith({ start: multi[1], end: multi[1] })
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }))
    await userEvent.click(screen.getByRole('button', { name: '2026-12-02, samples available' }))
    expect(onChange).toHaveBeenLastCalledWith({ start: multi[2], end: multi[2] })
  })
  it('empty data disables controls and never emits a range', async () => {
    const onChange = vi.fn()
    render(<Controlled samples={[]} onChange={onChange} />)
    expect(screen.getByText('No recorded samples for this site.')).toBeTruthy()
    for (const button of screen.getAllByRole('button')) expect((button as HTMLButtonElement).disabled || button.closest('fieldset')?.disabled).toBe(true)
    await userEvent.click(screen.getByRole('button', { name: 'Full window' }))
    expect(onChange).not.toHaveBeenCalled()
  })
  it('filters bounds inclusively, sorts and deduplicates samples', () => {
    render(<Controlled samples={[samples[3], samples[0], samples[1], samples[1], samples[2]]} available={{ start: samples[1], end: samples[2] }} />)
    fireEvent.click(screen.getByRole('button', { name: /^From / }))
    expect(within(screen.getByRole('listbox', { name: 'From' })).getAllByRole('option').map((option) => option.textContent?.replace('✓', ''))).toEqual(['19:00 UTC', '20:00 UTC'])
  })
  it('omits half presets for odd sample counts', () => {
    render(<Controlled samples={samples.slice(0, 3)} />)
    expect(screen.getByRole('button', { name: 'Full window' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '18:00–19:00' })).toBeNull()
    expect(screen.queryByRole('button', { name: '20:00–21:00' })).toBeNull()
  })
  it('uses the single-day heading and keeps the multi-day heading', () => {
    const props = { analysis: mockMissionData[0], range: { start_utc: samples[0], end_utc: samples[3] }, onApply: vi.fn() }
    const { rerender } = render(<DateRangeControls {...props} />)
    expect(screen.getByRole('heading', { name: 'Analysis window (UTC)' })).toBeTruthy()
    const multi = structuredClone(mockMissionData[0])
    multi.samples[3].utc = '2026-11-15T21:00:00Z'
    multi.window.end_utc = multi.samples[3].utc
    rerender(<DateRangeControls {...props} analysis={multi} />)
    expect(screen.getByRole('heading', { name: 'Analysis date range' })).toBeTruthy()
  })
  it('updates comparison, map counts and time clamping and clears previous range messages', async () => {
    function App() { const simulation = useSimulation(mockMissionData); return <Explorer analyses={mockMissionData} simulation={simulation} /> }
    render(<App />)
    await userEvent.click(screen.getAllByRole('button', { name: 'Explore Site: Sample Site B' })[0])
    expect(screen.getByText(/comparison period preserved/)).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: '20:00–21:00' }))
    expect(screen.queryByText(/comparison period preserved/)).toBeNull()
    expect(screen.getByRole('combobox', { name: 'Simulation time (UTC)' }).textContent).toBe('2026-11-14T20:00:00Z2026-11-14T21:00:00Z')
    expect(within(screen.getByRole('complementary', { name: 'Selected site details' })).getAllByText('2 / 2')).toHaveLength(2)
    expect(within(screen.getByRole('table', { name: 'Metrics over the selected comparison period' })).getByRole('row', { name: /Earth visible/ }).textContent).toContain('2 / 2 (100.0%)')
  })
})
