import { useId, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'

interface Range { start: string; end: string }
export interface DateRangeSelectorProps {
  available: Range
  samples: string[]
  value: Range
  onChange: (value: Range) => void
}
const utc = (value: string) => new Date(value).toISOString().replace('.000Z', 'Z')
const focus = 'focus-visible:outline-1 focus-visible:outline-offset-2'
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function DateRangeSelector({ available, samples, value, onChange }: DateRangeSelectorProps) {
  const id = useId()
  const instants = [...new Set(samples.filter((sample) => {
    const time = Date.parse(sample)
    return Number.isFinite(time) && time >= Date.parse(available.start) && time <= Date.parse(available.end)
  }).map(utc))].sort((a, b) => Date.parse(a) - Date.parse(b))
  const days = [...new Set(instants.map((sample) => sample.slice(0, 10)))]
  const multipleDays = days.length > 1
  const nearest = (time: string) => instants.reduce((best, sample, index) => Math.abs(Date.parse(sample) - Date.parse(time)) < Math.abs(Date.parse(instants[best]) - Date.parse(time)) ? index : best, 0)
  const start = instants.length ? nearest(value.start) : 0
  const end = instants.length ? Math.max(start, nearest(value.end)) : 0
  const [note, setNote] = useState('')
  const [month, setMonth] = useState(days[0]?.slice(0, 7) ?? available.start.slice(0, 7))
  const [open, setOpen] = useState<'from' | 'to' | null>(null)
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({})
  const ticks = useRef<(HTMLButtonElement | null)[]>([])
  const options = useRef<Record<string, HTMLButtonElement | null>>({})
  const empty = instants.length === 0
  const label = (sample: string) => `${multipleDays ? `${sample.slice(0, 10)} · ` : ''}${sample.slice(11, 16)} UTC`
  function emit(from: number, to: number) {
    if (!empty) onChange({ start: instants[from], end: instants[to] })
  }
  function choose(handle: 'from' | 'to', index: number) {
    setNote('')
    if (handle === 'from') {
      if (index > end) setNote(`To moved to ${label(instants[index])} to stay at or after From.`)
      emit(index, Math.max(index, end))
    } else {
      if (index < start) setNote('From moved to To to keep the range valid.')
      emit(Math.min(start, index), index)
    }
  }
  function tick(index: number) { choose(Math.abs(index - start) <= Math.abs(index - end) ? 'from' : 'to', index) }
  function preset(kind: 'full' | 'first' | 'second') {
    setNote('')
    const middle = Math.floor((instants.length - 1) / 2)
    emit(kind === 'second' ? Math.min(middle + 1, instants.length - 1) : 0, kind === 'first' ? middle : instants.length - 1)
  }
  const summary = empty ? 'No recorded samples for this site.' : `Selected: ${instants[start].slice(0, 10)} · ${instants[start].slice(11, 16)} to ${multipleDays ? `${instants[end].slice(0, 10)} · ` : ''}${instants[end].slice(11, 16)} UTC · ${end - start + 1} ${end === start ? 'sample' : 'samples'}`
  const [year, monthNumber] = month.split('-').map(Number)
  const dayCount = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const offset = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay()
  const monthStart = days[0]?.slice(0, 7) ?? month
  const monthEnd = days.at(-1)?.slice(0, 7) ?? month
  function moveMonth(delta: number) { setMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7)) }

  return <div className="min-w-0 w-full space-y-3">
    <p aria-live="polite" role="status" className="break-words text-sm leading-6 text-accent">{summary}</p>
    {days.length === 1 && <p className="text-xs text-muted">Sample data covers {Number(days[0].slice(8, 10))} {months[Number(days[0].slice(5, 7)) - 1]} {days[0].slice(0, 4)} only.</p>}
    <fieldset disabled={empty} className="min-w-0 space-y-2">
      <legend className="mb-1 text-sm font-semibold">Sample timeline</legend>
      <div className="max-w-full overflow-x-auto py-1">
        <div className="relative flex min-w-full justify-between" style={{ width: `${Math.max(1, instants.length) * 56}px` }} aria-label="Recorded sample ticks">
          <div aria-hidden="true" className="absolute top-3 right-7 left-7 h-px bg-line"><div className="absolute h-px bg-accent" style={{ left: `${instants.length > 1 ? 100 * start / (instants.length - 1) : 0}%`, width: `${instants.length > 1 ? 100 * (end - start) / (instants.length - 1) : 0}%` }} /></div>
          {instants.map((sample, index) => {
            const endpoint = index === start || index === end
            const inside = index >= start && index <= end
            return <button key={sample} ref={(element) => { ticks.current[index] = element }} type="button" aria-label={`${label(sample)}, ${index === start && index === end ? 'From and To' : index === start ? 'From' : index === end ? 'To' : inside ? 'inside range' : 'outside range'}`} aria-pressed={inside} onClick={() => tick(index)} onKeyDown={(event) => {
              if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault()
                const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1
                const next = Math.max(0, Math.min(instants.length - 1, index + delta))
                if (endpoint) choose(index === start ? 'from' : 'to', next)
                ticks.current[next]?.focus()
              }
            }} className={`relative flex min-h-11 w-14 shrink-0 flex-col items-center gap-2 rounded text-xs ${focus} ${inside ? 'text-accent' : 'text-muted'}`}><span aria-hidden="true" className={`block rounded-full ${endpoint ? 'mt-1 size-4 bg-accent' : inside ? 'mt-2 mb-1 size-2 bg-accent' : 'mt-2 mb-1 size-2 border border-muted bg-space'}`} />{sample.slice(11, 16)}</button>
          })}
        </div>
      </div>
      <p className="text-xs text-muted">● Endpoints · • Inside · ○ Outside — arrow keys move endpoints.</p>
    </fieldset>
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      {(['from', 'to'] as const).map((handle) => <div key={handle} className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null) }}>
        <p id={`${id}-${handle}`} className="mb-1 text-xs font-semibold">{handle === 'from' ? 'From' : 'To'}</p>
        <button ref={(element) => { triggers.current[handle] = element }} type="button" aria-labelledby={`${id}-${handle} ${id}-${handle}-value`} aria-haspopup="listbox" aria-expanded={open === handle} aria-controls={`${id}-${handle}-options`} disabled={empty} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-line bg-space px-3 py-2 text-left font-mono text-sm ${focus}`} onClick={() => { setOpen(open === handle ? null : handle); requestAnimationFrame(() => options.current[`${handle}-${handle === 'from' ? start : end}`]?.focus()) }} onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(handle); requestAnimationFrame(() => options.current[`${handle}-${handle === 'from' ? start : end}`]?.focus()) }
        }}><span id={`${id}-${handle}-value`}>{empty ? 'No samples' : label(instants[handle === 'from' ? start : end])}</span><span aria-hidden="true">▾</span></button>
        {open === handle && <div id={`${id}-${handle}-options`} role="listbox" aria-labelledby={`${id}-${handle}`} className="absolute top-full z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-line bg-space p-1 shadow-xl" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(null); triggers.current[handle]?.focus() } }}>
          {instants.map((sample, index) => {
            const selected = index === (handle === 'from' ? start : end)
            return <button key={sample} ref={(element) => { options.current[`${handle}-${index}`] = element }} type="button" role="option" aria-selected={selected} tabIndex={selected ? 0 : -1} onClick={() => { choose(handle, index); setOpen(null); triggers.current[handle]?.focus() }} onKeyDown={(event) => {
              const next = event.key === 'ArrowDown' ? Math.min(instants.length - 1, index + 1) : event.key === 'ArrowUp' ? Math.max(0, index - 1) : event.key === 'Home' ? 0 : event.key === 'End' ? instants.length - 1 : null
              if (next !== null) { event.preventDefault(); choose(handle, next); options.current[`${handle}-${next}`]?.focus() }
            }} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded px-3 py-2 text-left font-mono text-sm ${focus} ${selected ? 'bg-panel text-accent' : 'text-muted hover:bg-panel'}`}>{label(sample)}{selected && <span aria-hidden="true">✓</span>}</button>
          })}
        </div>}
      </div>)}
    </div>
    <fieldset disabled={empty} className="min-w-0"><legend className="sr-only">Range presets</legend><div className="flex flex-wrap gap-2"><Button className={focus} onClick={() => preset('full')}>Full window</Button>{!empty && instants.length % 2 === 0 && <><Button className={focus} onClick={() => preset('first')}>{instants[0].slice(11, 16)}–{instants[instants.length / 2 - 1].slice(11, 16)}</Button><Button className={focus} onClick={() => preset('second')}>{instants[instants.length / 2].slice(11, 16)}–{instants.at(-1)!.slice(11, 16)}</Button></>}</div></fieldset>
    {note && <p role="status" className="text-xs text-muted">{note}</p>}
    {multipleDays && <fieldset className="min-w-0"><legend className="mb-2 text-sm font-semibold">Sample calendar (UTC)</legend>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><Button className={focus} aria-label="Previous month" disabled={month <= monthStart} onClick={() => moveMonth(-1)}>←</Button><p className="text-sm">{months[monthNumber - 1]} {year}</p><Button className={focus} aria-label="Next month" disabled={month >= monthEnd} onClick={() => moveMonth(1)}>→</Button></div>
      <p className="mb-2 text-xs text-muted">● Day has samples. Choose a day to select its full sample span.</p>
      <div className="max-w-full overflow-x-auto"><div className="grid min-w-77 grid-cols-7 text-center text-xs">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-2 text-muted">{day}</span>)}
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: dayCount }, (_, index) => {
          const date = `${month}-${String(index + 1).padStart(2, '0')}`
          const enabled = days.includes(date)
          return <button key={date} type="button" disabled={!enabled} title={enabled ? 'Select samples on this day' : 'No samples on this day'} aria-label={`${date}${enabled ? ', samples available' : ', no samples'}`} className={`min-h-11 min-w-11 rounded ${focus} ${enabled ? 'text-ink hover:bg-panel' : 'text-muted/40'}`} onClick={() => { const first = instants.findIndex((sample) => sample.startsWith(date)); const last = instants.findLastIndex((sample) => sample.startsWith(date)); setNote(''); emit(first, last) }}>{index + 1}<span aria-hidden="true" className="block h-3">{enabled ? '●' : '–'}</span></button>
        })}
      </div></div>
    </fieldset>}
  </div>
}
