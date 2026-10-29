import { ExportControls } from '../exports/ExportControls'
import { useState } from 'react'
import { MissionDataPanel } from '../mission-data/MissionDataPanel'
import { SiteComparison } from '../comparison/SiteComparison'
import { DateRangeControls } from '../date-range/DateRangeControls'
import { comparisonGrid, siteSummary } from '../comparison/comparison'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { Simulation } from '../../hooks/useSimulation'
import type { BodySample, ObstructionResult, SiteAnalysis } from '../../types/mission'
import { LunarMap } from '../map/LunarMap'
import { Horizon } from '../horizon/Horizon'
import { ClearanceChart } from '../timeline/ClearanceChart'
import { AvailabilityTimeline } from '../timeline/AvailabilityTimeline'
import { SolarTimeline } from '../timeline/SolarTimeline'

const controlStyle = 'min-h-11 min-w-0 w-full max-w-full rounded-lg border border-line bg-space px-3 py-2 text-sm text-ink'
const labelStyle = 'grid min-w-0 gap-2 text-xs font-semibold uppercase tracking-wider text-muted'

function obstructionText(result: ObstructionResult) {
  switch (result.status) {
    case 'already_blocked': return 'Already blocked at the selected time'
    case 'no_obstruction_in_window': return 'No obstruction within the loaded analysis window'
    case 'horizon_incomplete': return 'Timing unavailable — incomplete horizon data'
    case 'visible_until':
      return result.timing === 'bracketed'
        ? `Approx. crossing between ${result.bracket_start_utc} and ${result.bracket_end_utc}`
        : `Next obstruction: ${result.obstruction_utc}`
  }
}

function clearanceText(value: number | null) {
  return value === null ? 'Unknown' : `${value > 0 ? '+' : ''}${value}°`
}

function BodyReadout({ name, sample }: { name: string; sample: BodySample }) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{name} geometry</h3>
        <Badge tone={sample.visibility}>{sample.visibility}</Badge>
      </div>
      <dl className="my-5 grid grid-cols-3 gap-3">
        {[
          ['Clearance', clearanceText(sample.clearance_deg)],
          ['Azimuth', sample.azimuth_deg === null ? 'Unknown' : `${sample.azimuth_deg}°`],
          ['Elevation', sample.elevation_deg === null ? 'Unknown' : `${sample.elevation_deg}°`],
        ].map(([label, value]) => (
          <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-mono text-lg tabular-nums">{value}</dd></div>
        ))}
      </dl>
      <div className="border-t border-line pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Next {name.toLowerCase()} obstruction</p>
        <p className="break-words text-sm leading-6">{obstructionText(sample.next_obstruction)}</p>
        <p className="mt-2 font-mono text-xs text-muted">Sampling interval: {sample.next_obstruction.sampling_interval_s} s · Obstruction results refer to the full loaded analysis window.</p>
      </div>
    </Panel>
  )
}

export function Explorer({ analyses, simulation }: { analyses: SiteAnalysis[]; simulation: Simulation }) {
  const [missionDataOpen, setMissionDataOpen] = useState(false)
  const { analysis, sourceAnalysis, range, applyRange, exploreSite, navigationNotice, sample, sampleIndex, selectSite, selectSample } = simulation
  if (!analysis || !sourceAnalysis || !range || !sample) return <main className="mx-auto max-w-7xl p-6"><h1 className="text-3xl">AstroNexus Explorer</h1><p className="mt-4 text-muted">No samples available for the selected site.</p></main>

  const comparisonTimes = comparisonGrid(analyses, range)

  return (
    <>
      <a href="#explorer" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:p-3 focus:text-space">Skip to Explorer</a>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-accent/40 font-mono text-accent">AN</span>
            <div><p className="text-xl font-semibold tracking-tight">AstroNexus</p><p className="text-xs text-muted">CLPS Lunar Mission Browser</p></div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-4"><nav aria-label="Primary" className="flex flex-wrap items-center gap-2"><a href="#explorer" onClick={() => document.getElementById('explorer')?.focus()} className="inline-flex min-h-11 items-center rounded px-3 text-sm font-semibold text-accent focus-visible:outline-1">Explorer</a><a href="#compare" onClick={() => document.getElementById('compare')?.focus()} className="inline-flex min-h-11 items-center rounded px-3 text-sm font-semibold text-muted hover:text-accent focus-visible:outline-1">Compare</a><button type="button" onClick={() => setMissionDataOpen(true)} className="min-h-11 rounded px-3 text-sm font-semibold text-muted hover:text-accent focus-visible:outline-1" aria-haspopup="dialog">Mission Data</button></nav><Badge>UTC</Badge></div>
        </div>
      </header>
      <MissionDataPanel open={missionDataOpen} onClose={() => setMissionDataOpen(false)} analysis={sourceAnalysis} range={range} sample={sample} />
      <main id="explorer" tabIndex={-1} className="mx-auto min-w-0 w-full max-w-7xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Lunar surface / visibility analysis</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore the local horizon</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Inspect how terrain shapes Sun and Earth visibility at a selected site and time.</p></div>
          <p className="font-mono text-xs text-muted">{analyses.length} sites · {analysis.samples.length} samples / selected site</p>
        </div>
        <aside className="flex flex-wrap items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3" aria-label="Data provenance">
          <Badge tone="sample">Sample data</Badge><p className="text-sm text-accent">Sample data for interface development. No scientific validation.</p>
        </aside>
        <DateRangeControls key={`range-${analysis.site.site_id}`} analysis={sourceAnalysis} range={range} onApply={applyRange} />
        <SiteComparison onViewData={() => setMissionDataOpen(true)} key={`comparison-${range.start_utc}-${range.end_utc}`} analyses={analyses} range={range} selectedUtc={sample.utc} onExplore={(id) => {
          exploreSite(id)
          document.getElementById('simulation-heading')?.focus()
          document.getElementById('simulation-heading')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }} />
        <ExportControls analyses={analyses} selectedSiteId={analysis.site.site_id} range={range} />
        {navigationNotice && <p role="status" aria-live="polite" className="rounded-lg border border-line p-3 text-sm text-accent">{navigationNotice}</p>}
        <LunarMap sites={analyses.map((item) => {
          const { site } = item
          const summary = siteSummary(item, range, comparisonTimes)
          return ({
          site_id: site.site_id, name: site.name, latitude_deg: site.latitude_deg, longitude_deg: site.longitude_deg,
          why: 'Sample data for synchronized interface development; science-team results will replace these values.', catalog: 'Sample data',
          elevation_m: null, slope_deg: null,
          availability: { sun: { visible: summary.sun, total: summary.total, unknown: summary.total - summary.sunKnown }, earth: { visible: summary.earth, total: summary.total, unknown: summary.total - summary.earthKnown } },
        })})} selectedSiteId={analysis.site.site_id} onSelect={selectSite} />
        <section aria-label="Current visibility" className="min-w-0 w-full max-w-full rounded-xl border border-line bg-panel" aria-live="polite" aria-atomic="true">
          <div className="flex flex-wrap justify-between gap-2 border-b border-line px-5 py-3 text-xs text-muted"><span className="font-semibold uppercase tracking-wider">Current visibility · {analysis.site.name}</span><span className="min-w-0 break-words font-mono">{sample.utc}</span></div>
          <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {[{ name: 'Sun', value: sample.sun }, { name: 'Earth', value: sample.earth }].map(({ name, value }) => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                <div><p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${name === 'Sun' ? 'text-solar' : 'text-earth'}`}>{name}</p><Badge tone={value.visibility}>{value.visibility}</Badge></div>
                <div className="text-right"><p className="font-mono text-3xl tabular-nums sm:text-4xl">{clearanceText(value.clearance_deg)}</p><p className="mt-2 text-xs text-muted">horizon clearance</p></div>
              </div>
            ))}
          </div>
        </section>
        <Panel aria-labelledby="simulation-heading">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 id="simulation-heading" tabIndex={-1} className="text-base font-semibold">Simulation controls</h2><span className="font-mono text-xs text-muted">Step {analysis.window.sampling_interval_s} s</span></div>
          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr]">
            <label className={labelStyle}>Landing site<select aria-label="Landing site" className={controlStyle} value={analysis.site.site_id} onChange={(event) => selectSite(event.target.value)}>{analyses.map((item) => <option key={item.site.site_id} value={item.site.site_id}>{item.site.name}</option>)}</select></label>
            <label className={labelStyle}>Simulation time (UTC)<select aria-label="Simulation time (UTC)" className={`${controlStyle} font-mono`} value={sampleIndex} onChange={(event) => selectSample(Number(event.target.value))}>{analysis.samples.map((item, index) => <option key={item.utc} value={index}>{item.utc}</option>)}</select></label>
            <div className="flex min-w-0 flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-1">
              <Button aria-label="Previous sample" onClick={() => selectSample(sampleIndex - 1)} disabled={sampleIndex === 0}>←</Button>
              <label className={`${labelStyle} flex-1`}>Time scrubber<input className="h-11 w-full accent-accent" type="range" min={0} max={analysis.samples.length - 1} step={1} value={sampleIndex} aria-valuetext={sample.utc} onChange={(event) => selectSample(Number(event.target.value))} /></label>
              <Button aria-label="Next sample" onClick={() => selectSample(sampleIndex + 1)} disabled={sampleIndex === analysis.samples.length - 1}>→</Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 font-mono text-xs text-muted"><p>Lat {analysis.site.latitude_deg}° / Lon {analysis.site.longitude_deg}°</p><p>Window {analysis.window.start_utc} → {analysis.window.end_utc}</p></div>
        </Panel>
        <Horizon horizon={analysis.horizon} sample={sample} />
        <ClearanceChart key={`clearance-${analysis.site.site_id}-${range.start_utc}-${range.end_utc}`} analysis={analysis} selectedIndex={sampleIndex} onSelect={selectSample} />
        <SolarTimeline analysis={analysis} selectedIndex={sampleIndex} onSelect={selectSample} />
        <AvailabilityTimeline mode="earth" analysis={analysis} selectedIndex={sampleIndex} onSelect={selectSample} />
        <AvailabilityTimeline mode="combined" analysis={analysis} selectedIndex={sampleIndex} onSelect={selectSample} />
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2"><BodyReadout name="Sun" sample={sample.sun} /><BodyReadout name="Earth" sample={sample.earth} /></div>
        <p className="text-sm leading-6 text-muted">Clearance &gt; 0°: visible. Clearance ≤ 0°: blocked. Missing data remains unknown. Duration metrics and continuous access windows are not supplied in this fixture.</p>
        <details className="rounded-xl border border-line bg-panel p-5"><summary className="text-sm font-semibold">Inspect source data <span className="ml-2 font-normal text-muted">Selected site / JSON</span></summary><pre className="mt-4 max-h-96 overflow-auto rounded-lg bg-space p-4 font-mono text-xs leading-6 text-muted">{JSON.stringify(sourceAnalysis, null, 2)}</pre></details>
        <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-5 text-xs text-muted"><span>AstroNexus · NASA Space Apps team project</span><span>All simulation times shown in UTC</span></footer>
      </main>
    </>
  )
}
