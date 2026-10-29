import { useId, useState } from 'react'
import { Panel } from '../../components/ui/Panel'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import type { SiteAnalysis } from '../../types/mission'
import type { AnalysisRange } from '../date-range/analysisRange'
import { suitabilityLabel, bodyStatusReason, formatUtc, comparisonGrid, siteSummary, comparisonState, type ComparisonState } from './comparison'

const states: Record<ComparisonState, { label: string; symbol: string; style: string }> = {
  both: { label: 'Both visible', symbol: '●●', style: 'border-visible/50 bg-visible/10 text-visible' },
  sun: { label: 'Sun only', symbol: '☀', style: 'border-solar/50 bg-solar/10 text-solar' },
  earth: { label: 'Earth only', symbol: '◆', style: 'border-earth/50 bg-earth/10 text-earth' },
  neither: { label: 'Neither visible', symbol: '×', style: 'border-dashed border-blocked/50 bg-blocked/10 text-blocked' },
  unknown: { label: 'Unknown', symbol: '?', style: 'border-dotted border-unknown/50 bg-unknown/10 text-unknown' },
}
const fraction = (count: number, total: number) => total ? `${count} / ${total} (${(100 * count / total).toFixed(1)}%)` : 'N/A'

export function SiteComparison({ analyses, range, selectedUtc, onExplore, onViewData }: {
  analyses: SiteAnalysis[]
  range: AnalysisRange
  selectedUtc: string
  onExplore: (id: string) => void
  onViewData?: () => void
}) {
  const id = useId()
  const times = comparisonGrid(analyses, range)
  const rows = analyses.map((analysis) => ({ analysis, ...siteSummary(analysis, range, times) }))
  const [inspected, setInspected] = useState<{ site: string; time: number } | null>(null)
  const details = (siteId: string, time: number) => {
    const row = rows.find(({ analysis }) => analysis.site.site_id === siteId)!
    const sample = row.cells[times.indexOf(time)]
    const flags = [...row.analysis.provenance.quality_flags, ...(sample?.sun.quality_flags ?? []), ...(sample?.earth.quality_flags ?? [])]
    return `${row.analysis.site.name} · ${states[comparisonState(sample)].label} · ${formatUtc(time)} · Sun: ${bodyStatusReason(sample?.sun)} · Earth: ${bodyStatusReason(sample?.earth)} · Data: ${row.analysis.provenance.data_status} · Horizon: ${row.analysis.horizon.quality} · Quality flags: ${flags.length ? [...new Set(flags)].join(', ') : 'none supplied'}`
  }
  const activeInspection = inspected && times.includes(inspected.time) && rows.some(({ analysis }) => analysis.site.site_id === inspected.site) ? inspected : null
  const coverageIssues = rows.flatMap(({ analysis, cells }) => {
    const issues = cells.flatMap((sample, index) => {
      if (comparisonState(sample) !== 'unknown') return []
      return [`${analysis.site.name} at ${formatUtc(times[index])}: Sun ${bodyStatusReason(sample?.sun)}; Earth ${bodyStatusReason(sample?.earth)}.`]
    })
    if (Date.parse(analysis.window.start_utc) > Date.parse(range.start_utc) || Date.parse(analysis.window.end_utc) < Date.parse(range.end_utc)) issues.push(`${analysis.site.name} does not cover the full selected period.`)
    return issues
  })
  const dates = [...new Set(times.map((time) => formatUtc(time).slice(0, 10)))]
  const mixedCadence = new Set(analyses.map(({ window }) => window.sampling_interval_s)).size > 1
  const metrics = [
    { name: 'Suitability', values: analyses.map(({ site }) => suitabilityLabel(site.suitability)) },
    { name: 'Recorded samples (count)', values: rows.map(({ recorded }) => `${recorded} / ${times.length}`) },
    { name: 'Sun known coverage (slots, %)', values: rows.map(({ sunKnown }) => fraction(sunKnown, times.length)) },
    { name: 'Earth known coverage (slots, %)', values: rows.map(({ earthKnown }) => fraction(earthKnown, times.length)) },
    { name: 'Both statuses known (slots, %)', values: rows.map(({ known }) => fraction(known, times.length)) },
    { name: 'Sun visible (slots, %)', values: rows.map(({ sun }) => fraction(sun, times.length)) },
    { name: 'Earth visible (slots, %)', values: rows.map(({ earth }) => fraction(earth, times.length)) },
    { name: 'Both visible (slots, %)', values: rows.map(({ both }) => fraction(both, times.length)) },
    { name: 'Unknown joint status (slots, %)', values: rows.map(({ known }) => fraction(times.length - known, times.length)) },
    { name: 'Both-visible duration (%)', values: rows.map(() => 'N/A') },
    { name: 'Longest continuous access window (s)', values: rows.map(() => 'N/A') },
  ]
  if (analyses.some(({ site }) => site.elevation_m !== null)) metrics.push({ name: 'Site elevation (m)', values: analyses.map(({ site }) => site.elevation_m === null ? 'N/A' : String(site.elevation_m)) })
  if (analyses.some(({ site }) => site.terrain.slope !== null)) metrics.push({ name: 'Site slope (°)', values: analyses.map(({ site }) => site.terrain.slope ? String(site.terrain.slope.value) : 'N/A') })

  return <Panel id="compare" tabIndex={-1} aria-labelledby={`${id}-heading`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={`${id}-heading`} className="text-xl font-semibold">Site comparison</h2><Badge tone="sample">Sample data</Badge></div>
    <p className="mt-3 break-words font-mono text-sm text-accent">Comparison period (UTC): {formatUtc(range.start_utc)} → {formatUtc(range.end_utc)}</p>
    <p className="mt-2 text-sm leading-6 text-muted">Each column is the same recorded or expected UTC instant across sites. No interpolation between samples. Current Explorer time: {formatUtc(selectedUtc)}.</p>
    {coverageIssues.length > 0 && <div className="mt-3 rounded-lg border border-unknown/40 p-3 text-sm text-unknown"><p>These sites are not fully comparable at the affected instants. Unknown does not mean blocked.</p><ul className="mt-2 list-disc space-y-2 pl-4">{coverageIssues.slice(0, 4).map((issue) => <li key={issue}>{issue}</li>)}</ul>{coverageIssues.length > 4 && <details className="mt-2"><summary>{coverageIssues.length - 4} more coverage gaps</summary><ul className="mt-2 list-disc space-y-2 pl-4">{coverageIssues.slice(4).map((issue) => <li key={issue}>{issue}</li>)}</ul></details>}</div>}
    {mixedCadence && <p className="mt-3 text-sm text-unknown">Sampling cadences differ. Columns use the union of all cadence slots; absent matches remain unknown. These sample percentages are not duration percentages.</p>}
    <div className="mt-4 flex flex-wrap gap-3 text-xs" aria-label="Comparison legend">{Object.values(states).map((state) => <span key={state.label} className={`rounded border px-2 py-1 ${state.style}`}>{state.symbol} {state.label}</span>)}</div>
    <p className="mt-3 font-mono text-xs text-muted">UTC dates: {dates.join(" · ")}</p>
    <p className="mt-3 text-xs text-muted sm:hidden">Each UTC card compares both sites at the same instant.</p>
    {times.length === 0 ? <p className="mt-4 text-muted">No comparison samples in this period.</p>  : <>
      <div className="mt-4 min-w-0 space-y-4 sm:hidden" aria-label="Mobile visibility comparison">
        <div className="grid min-w-0 grid-cols-2 gap-3">{rows.map(({ analysis }) => <div key={analysis.site.site_id} className="min-w-0"><p className="text-xs font-semibold">{analysis.site.name}</p><Button className="mt-2 w-full px-2 text-xs" disabled={!analysis.samples.length} aria-label={`Explore Site: ${analysis.site.name}`} onClick={() => onExplore(analysis.site.site_id)}>Explore Site</Button></div>)}</div>
        {times.map((time, index) => <section key={time} aria-label={`Compare ${formatUtc(time)}`} className="min-w-0 rounded-lg border border-line bg-space p-3">
          <h3 className="mb-3 font-mono text-xs text-muted">{dates.length > 1 && `${formatUtc(time).slice(0, 10)} · `}{formatUtc(time).slice(11, 19)} UTC</h3>
          <div className="grid min-w-0 grid-cols-2 gap-3">{rows.map(({ analysis, cells }) => {
            const state = states[comparisonState(cells[index])]
            return <div key={analysis.site.site_id} className="min-w-0"><p className="mb-2 break-words text-xs font-semibold">{analysis.site.name}</p><button type="button" title={details(analysis.site.site_id, time)} aria-label={details(analysis.site.site_id, time)} aria-describedby={`${id}-inspection`} onMouseEnter={() => setInspected({ site: analysis.site.site_id, time })} onFocus={() => setInspected({ site: analysis.site.site_id, time })} onClick={() => setInspected({ site: analysis.site.site_id, time })} className={`min-h-20 min-w-0 w-full max-w-full whitespace-normal break-words rounded-lg border px-2 py-3 text-xs ${state.style}`}><span aria-hidden="true" className="mb-1 block text-base">{state.symbol}</span>{state.label}</button></div>
          })}</div>
        </section>)}
      </div>
      <div tabIndex={0} role="region" aria-label="Scrollable visibility matrix" className="mt-4 hidden min-w-0 max-w-full overflow-x-auto p-1 sm:block">
      <table className="w-full border-separate border-spacing-2 text-left text-xs">
        <caption className="sr-only">Visibility matrix for the selected comparison period</caption>
        <thead><tr><th scope="col" className="sticky left-0 z-10 min-w-36 bg-panel">Site / UTC</th>{times.map((time) => <th scope="col" key={time} className="min-w-28 font-mono font-normal text-muted">{dates.length > 1 && <>{formatUtc(time).slice(5, 10)}<br /></>}{formatUtc(time).slice(11, 19)}</th>)}</tr></thead>
        <tbody>{rows.map(({ analysis, cells }) => <tr key={analysis.site.site_id}><th scope="row" className="sticky left-0 z-10 bg-panel font-semibold"><span className="block">{analysis.site.name}</span><Button className="mt-3 text-xs" disabled={!analysis.samples.length} aria-label={`Explore Site: ${analysis.site.name}`} onClick={() => onExplore(analysis.site.site_id)}>Explore Site</Button></th>{cells.map((sample, index) => {
          const state = states[comparisonState(sample)]
          return <td key={times[index]}><button type="button" title={details(analysis.site.site_id, times[index])} aria-label={details(analysis.site.site_id, times[index])} aria-describedby={`${id}-inspection`} onMouseEnter={() => setInspected({ site: analysis.site.site_id, time: times[index] })} onFocus={() => setInspected({ site: analysis.site.site_id, time: times[index] })} className={`min-h-16 w-full rounded-lg border p-2 text-xs ${state.style}`}><span aria-hidden="true" className="block text-base">{state.symbol}</span>{state.label}</button></td>
        })}</tr>)}</tbody>
      </table>
    </div></>}
    <p id={`${id}-inspection`} role="status" aria-live="polite" className="mt-3 min-h-12 rounded-lg bg-space p-3 text-xs leading-6 text-muted">{activeInspection ? details(activeInspection.site, activeInspection.time) : 'Hover or focus a matrix cell for site, UTC, body status and quality information.'}</p>
    {onViewData && <Button className="mt-4 focus-visible:outline-1" aria-haspopup="dialog" onClick={onViewData}>View Data &amp; Methodology</Button>}
    <h3 className="mt-6 text-lg font-semibold">Exact metrics</h3>
    <table className="mt-3 w-full table-fixed border-collapse text-left text-xs sm:text-sm">
      <caption className="sr-only">Metrics over the selected comparison period</caption>
      <thead><tr><th scope="col" className="w-2/5 border-b border-line py-3 pr-2">Metric / units</th>{analyses.map(({ site }) => <th key={site.site_id} scope="col" className="break-words border-b border-line px-2 py-3">{site.name}</th>)}</tr></thead>
      <tbody>{metrics.map(({ name, values }) => <tr key={name}><th scope="row" className="break-words border-b border-line py-3 pr-2 font-normal text-muted">{name}</th>{values.map((value, index) => <td key={analyses[index].site.site_id} className="break-words border-b border-line px-2 py-3 font-mono">{value}</td>)}</tr>)}</tbody>
    </table>
    <p className="mt-3 text-xs leading-6 text-muted">Suitability is not yet assessed. Future assessments require an agreed data definition and science-team approval; no score, ranking or recommendation is inferred.</p>
    <p className="mt-3 text-xs leading-6 text-muted">N/A for duration and continuous-window metrics: recorded instants do not establish visibility between samples. Period-specific interval results and their definitions must come from the science team.</p>
    <details className="mt-4 text-sm leading-6 text-muted"><summary className="text-accent">Metric definitions and missing data</summary><p className="mt-2">All fractions use the same {times.length} UTC columns as denominator, including unknown or missing slots. Columns are the union of expected sampling times inside each loaded window and actual timestamps in the selected period. Known coverage counts supplied non-unknown statuses. Visible fractions count confirmed visible statuses; unknown is never counted as visible or removed from the denominator; it does not mean blocked. Joint visibility requires both bodies visible; either unknown gives unknown joint status. Percentages are rounded to one decimal; counts give the exact fraction.</p><p className="mt-2">These are fractions of sampled instants, not percentages of elapsed time or rankings. Different cadence or incomplete coverage limits comparison. N/A means a metric has not been supplied with a definition for this period. Duration percentages and continuous-window lengths require science-team interval results; they are not inferred from tile counts, interpolated crossings or full-window summaries. Terrain metrics, when supplied, describe the site and do not vary with this date filter.</p></details>
  </Panel>
}
