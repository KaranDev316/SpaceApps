import { useId, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { BodySample, SiteAnalysis } from '../../types/mission'

const left = 70
const right = 870
const top = 40
const bottom = 280
const angle = (value: number | null) => value === null ? 'Unknown' : `${value > 0 ? '+' : ''}${value}°`

function Inspection({ name, body }: { name: string; body: BodySample }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-space p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className={name === 'Sun' ? 'font-semibold text-solar' : 'font-semibold text-earth'}>{name}</h3><Badge tone={body.visibility}>{body.visibility}</Badge></div>
      <dl className="grid grid-cols-3 gap-2 text-xs text-muted">
        <div><dt>Clearance</dt><dd className="mt-2 font-mono text-sm text-ink">{angle(body.clearance_deg)}</dd></div>
        <div><dt>Elevation</dt><dd className="mt-2 font-mono text-sm text-ink">{angle(body.elevation_deg)}</dd></div>
        <div><dt>Terrain angle</dt><dd className="mt-2 font-mono text-sm text-ink">{angle(body.horizon_angle_deg)}</dd></div>
      </dl>
    </div>
  )
}

export function ClearanceChart({ analysis, selectedIndex, onSelect }: {
  analysis: SiteAnalysis
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const id = useId()
  // Store UTC rather than an index so inspecting cannot reference another site's sample accidentally.
  const [hoveredUtc, setHoveredUtc] = useState<string | null>(null)
  const samples = analysis.samples
  if (!samples.length) return <Panel><h2 className="text-xl font-semibold">Horizon clearance over time</h2><p className="mt-3 text-muted">No time-series samples available.</p></Panel>
  const inspected = samples.find((sample) => sample.utc === hoveredUtc) ?? samples[selectedIndex] ?? samples[0]
  const times = samples.map((sample) => Date.parse(sample.utc))
  const start = times[0]
  const duration = times.at(-1)! - start
  const x = (index: number) => duration === 0 ? (left + right) / 2 : left + ((times[index] - start) / duration) * (right - left)
  const values = [0, ...samples.flatMap((sample) => [sample.sun.clearance_deg, sample.earth.clearance_deg])]
    .filter((value): value is number => value !== null && Number.isFinite(value))
  const min = Math.floor(Math.min(...values)) - 0.5
  const max = Math.ceil(Math.max(...values)) + 0.5
  const y = (value: number) => bottom - ((value - min) / (max - min)) * (bottom - top)
  const ticks = Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4)
  const labelStride = Math.max(1, Math.ceil(samples.length / 6))

  return (
    <Panel aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight">Horizon clearance over time</h2><Badge>Step {analysis.window.sampling_interval_s} s</Badge></div>
      <p className="mt-3 text-sm leading-6 text-muted">Select a sample to synchronize the horizon and visibility readouts. Hover to inspect. Missing values remain gaps.</p>
      <div className="mt-5 flex flex-wrap gap-5 font-mono text-xs text-muted"><span className="text-solar">━━ Sun / solid / circle</span><span className="text-earth">┄┄ Earth / dashed / diamond</span><span>0°: visibility threshold</span></div>
      <div className="mt-4 min-w-0 max-w-full rounded-lg border border-line bg-space p-2">
        <svg className="clearance-chart block h-auto w-full max-w-full" viewBox="0 0 940 355" role="group" aria-labelledby={`${id}-title ${id}-desc`} onMouseLeave={() => setHoveredUtc(null)}>
          <title id={`${id}-title`}>Sun and Earth clearance for {analysis.site.name}</title>
          <desc id={`${id}-desc`}>UTC horizontally and horizon clearance in degrees vertically. Above zero is visible; zero and below are blocked. Click a sample column, or use the sample buttons below. The vertical cursor marks selected simulation time.</desc>
          {ticks.map((tick) => <g key={tick}><line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className="chart-grid" /><text x={left - 10} y={y(tick) + 5} textAnchor="end">{Number(tick.toFixed(2))}°</text></g>)}
          <line x1={left} x2={right} y1={y(0)} y2={y(0)} className="chart-zero" strokeWidth={1} strokeDasharray="1 5" opacity={0.55} />
          <text x={left} y={20}>Clearance (°)</text>
          {(['sun', 'earth'] as const).map((body) => (
            <g key={body} className={body === 'sun' ? 'chart-sun' : 'chart-earth'}>
              {samples.map((sample, index) => {
                const value = sample[body].clearance_deg
                const next = samples[index + 1]?.[body].clearance_deg
                return <g key={sample.utc}>
                  {value !== null && next !== null && next !== undefined && times[index + 1] - times[index] <= analysis.window.sampling_interval_s * 1000 * 1.01 && (
                    <line x1={x(index)} y1={y(value)} x2={x(index + 1)} y2={y(next)} strokeWidth={2.5} strokeDasharray={body === 'earth' ? '7 5' : undefined} />
                  )}
                  {value !== null && (body === 'sun'
                    ? <circle cx={x(index)} cy={y(value)} r={5} />
                    : <path d={`M ${x(index)} ${y(value) - 6} l 6 6 l -6 6 l -6 -6 Z`} />)}
                </g>
              })}
            </g>
          ))}
          {samples[selectedIndex] && <line x1={x(selectedIndex)} x2={x(selectedIndex)} y1={top} y2={bottom} className="chart-cursor" strokeWidth={2} />}
          {samples.map((sample, index) => {
            const hitLeft = index === 0 ? left - 15 : (x(index - 1) + x(index)) / 2
            const hitRight = index === samples.length - 1 ? right + 15 : (x(index) + x(index + 1)) / 2
            return <g key={sample.utc}>
              {(index % labelStride === 0 || index === samples.length - 1) && <text x={x(index)} y={bottom + 30} textAnchor="middle">{sample.utc.slice(11, 16)}</text>}
              <rect x={hitLeft} y={top} width={hitRight - hitLeft} height={bottom - top} fill="transparent" className="cursor-pointer" onMouseEnter={() => setHoveredUtc(sample.utc)} onClick={() => { onSelect(index); setHoveredUtc(null) }} aria-hidden="true">
                <title>{sample.utc} · Sun {angle(sample.sun.clearance_deg)} · Earth {angle(sample.earth.clearance_deg)}</title>
              </rect>
            </g>
          })}
          <text x={(left + right) / 2} y={bottom + 60} textAnchor="middle">Time (UTC) · {analysis.window.start_utc.slice(0, 10)}{analysis.window.start_utc.slice(0, 10) !== analysis.window.end_utc.slice(0, 10) && ` — ${analysis.window.end_utc.slice(0, 10)}`}</text>
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Select chart sample">
        {samples.map((sample, index) => <Button key={sample.utc} aria-pressed={index === selectedIndex} aria-label={`Select ${sample.utc}`} className={index === selectedIndex ? 'border-accent text-accent' : ''} onFocus={() => setHoveredUtc(sample.utc)} onBlur={() => setHoveredUtc(null)} onClick={() => { onSelect(index); setHoveredUtc(null) }}>{sample.utc.slice(11, 16)} UTC</Button>)}
      </div>
      <p className="mt-5 mb-3 break-words font-mono text-xs text-muted">Inspecting {inspected.utc}{hoveredUtc ? ' · preview' : ' · selected simulation time'}</p>
      <div className="grid gap-4 sm:grid-cols-2"><Inspection name="Sun" body={inspected.sun} /><Inspection name="Earth" body={inspected.earth} /></div>
      <p className="mt-4 text-xs leading-5 text-muted">Sample data · Lines connect known adjacent samples for illustration; crossings between samples are approximate.</p>
    </Panel>
  )
}
