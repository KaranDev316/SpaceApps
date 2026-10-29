import { useId } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Panel } from '../../components/ui/Panel'
import { combinedAvailability } from './availability'
import type { SiteAnalysis, VisibilityStatus } from '../../types/mission'

const states: Record<VisibilityStatus, { label: string; symbol: string; style: string }> = {
  visible: { label: 'Visible', symbol: '●', style: 'border-visible/40 bg-visible/10 text-visible' },
  blocked: { label: 'Blocked', symbol: '×', style: 'border-dashed border-blocked/50 bg-blocked/10 text-blocked' },
  unknown: { label: 'Unknown', symbol: '?', style: 'border-dotted border-unknown/50 bg-unknown/10 text-unknown' },
}

export function AvailabilityTimeline({ analysis, selectedIndex, onSelect, mode }: {
  mode: 'sun' | 'earth' | 'combined'
  analysis: SiteAnalysis
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const id = useId()
  const selected = analysis.samples[selectedIndex]
  const combined = mode === 'combined'
  const title = mode === 'sun' ? 'Solar illumination' : mode === 'earth' ? 'Direct Earth visibility' : 'Combined availability'
  const statusFor = (sample: SiteAnalysis['samples'][number]) => combined
    ? combinedAvailability(sample.sun.visibility, sample.earth.visibility)
    : sample[mode === 'sun' ? 'sun' : 'earth'].visibility
  const labelFor = (status: VisibilityStatus) => combined
    ? ({ visible: 'Both visible', blocked: 'Not jointly available', unknown: 'Unknown' })[status]
    : `${mode === 'sun' ? 'Sun' : 'Earth'} ${states[status].label.toLowerCase()}`
  const clearanceFor = (value: number | null) => value === null ? 'Unknown' : `${value > 0 ? '+' : ''}${value}°`
  const detailsFor = (sample: SiteAnalysis['samples'][number]) => combined
    ? `Sun ${sample.sun.visibility} / Earth ${sample.earth.visibility}`
    : `Clearance ${clearanceFor(sample[mode === 'sun' ? 'sun' : 'earth'].clearance_deg)}`

  return (
    <Panel aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight">{title}</h2>
        <Badge tone={combined ? 'sample' : 'neutral'}>{combined ? 'Provisional AND rule' : 'Sampled availability'}</Badge>
      </div>
      <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-muted">
        {title} at each recorded UTC. Select a sample to update every view. Sampling interval: {analysis.window.sampling_interval_s} s.
      </p>
      {analysis.samples.length === 0 ? <p className="mt-5 text-muted">No samples available.</p> : (
        <>
          <div className="mt-5 min-w-0 max-w-full pb-2" role="group" aria-label={`${title} samples`} aria-describedby={`${id}-description`}>
            <div className="grid grid-cols-1 gap-3 p-2 min-[400px]:grid-cols-2 lg:grid-cols-4">
              {analysis.samples.map((sample, index) => {
                const status = statusFor(sample)
                const state = states[status]
                const label = labelFor(status)
                const isSelected = index === selectedIndex
                const detail = detailsFor(sample)
                return (
                  <button key={sample.utc} type="button" aria-pressed={isSelected}
                    aria-label={`${sample.utc}: ${label}, ${detail}`}
                    title={`${sample.utc} · ${label} · ${detail} · Recorded sample, not a continuous window`}
                    onClick={() => onSelect(index)}
                    className={`min-w-0 w-full max-w-full break-words rounded-lg border p-4 text-left hover:brightness-125 ${state.style} ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-panel' : ''}`}>
                    <span className="block font-mono text-xs">{sample.utc.slice(0, 10)}</span>
                    <span className="mt-1 block font-mono text-lg font-semibold">{sample.utc.slice(11, 16)} UTC</span>
                    <span className="mt-3 block text-sm font-semibold"><span aria-hidden="true">{state.symbol} </span>{label}</span>
                    <span className="mt-2 block font-mono text-xs">{detail}</span>
                    <span className="mt-3 block text-xs text-ink">{isSelected ? 'Selected time' : 'Select sample'}</span>
                  </button>
                )
              })}
            </div>
          </div>
          {selected && <p className="mt-3 break-words font-mono text-xs text-muted">Selected: {selected.utc} · {labelFor(statusFor(selected))} · {detailsFor(selected)}</p>}
        </>
      )}
      <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted" aria-label={`${title} legend`}>
        {combined ? <><span>● Both bodies visible</span><span>× At least one blocked, both known</span><span>? Either body unknown</span></> : <><span>● Visible: clearance &gt; 0°</span><span>× Blocked: clearance ≤ 0°</span><span>? Unknown: missing data</span></>}
      </div>
      {combined && <p className="mt-4 text-sm leading-6 text-accent">Provisional display rule: Sun visible AND Earth visible. If either body is unknown, combined availability stays unknown, even when the other is blocked. Pending science-team validation.</p>}
      {mode === 'earth' && <p className="mt-4 text-xs leading-5 text-muted">Geometric Earth visibility only; this does not establish a working communications link.</p>}
      <p className="mt-4 border-t border-line pt-4 text-xs leading-5 text-muted">
        Sample data · Each tile represents one recorded instant, with equal visual width. It does not establish visibility between samples, exact crossing times, continuous window durations, or power safety.
      </p>
    </Panel>
  )
}
