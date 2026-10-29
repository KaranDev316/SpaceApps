import { useEffect, useId, useRef } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import type { SiteAnalysis, TimeSample } from '../../types/mission'
import type { AnalysisRange } from '../date-range/analysisRange'
import { samplesInRange } from '../date-range/analysisRange'
import { formatUtc } from '../comparison/comparison'

const unavailable = 'Unavailable — not supplied'
const supplied = (value: string | number | null | undefined) => value == null || value === '' ? unavailable : String(value)

export function MissionDataPanel({ open, onClose, analysis, range, sample }: {
  open: boolean
  onClose: () => void
  analysis: SiteAnalysis
  range: AnalysisRange
  sample: TimeSample
}) {
  const id = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const element = dialog.current!
    const trigger = document.activeElement as HTMLElement | null
    element.showModal()
    closeButton.current?.focus()
    return () => {
      element.close()
      if (trigger?.isConnected) trigger.focus()
    }
  }, [open])
  const { site, horizon, provenance, window } = analysis
  const included = samplesInRange(analysis, range)
  const missing = horizon.points.filter((point) => point.horizon_angle_deg === null)
  const edges = horizon.points.filter((point) => point.dem_edge_reached)
  const flags = [...new Set([
    ...provenance.quality_flags,
    ...horizon.points.flatMap((point) => point.quality_flags),
    ...included.flatMap((item) => [item.sun, item.earth].flatMap((body) => [...body.quality_flags, ...(body.next_obstruction.quality_flag ? [body.next_obstruction.quality_flag] : [])])),
  ])]
  const metadata = [
    ['Site', `${site.name} (${site.site_id})`],
    ['Selected analysis period (UTC)', `${formatUtc(range.start_utc)} → ${formatUtc(range.end_utc)}`],
    ['Loaded dataset window (UTC)', `${formatUtc(window.start_utc)} → ${formatUtc(window.end_utc)}`],
    ['Selected instant (UTC)', formatUtc(sample.utc)],
    ['Dataset source', supplied(provenance.dataset_source)],
    ['Source datasets', provenance.source_datasets?.length ? provenance.source_datasets.join('; ') : unavailable],
    ['Dataset version', supplied(provenance.dataset_version)],
    ['Model version', supplied(provenance.model_version)],
    ['Processing version', supplied(provenance.processing_version)],
    ['Generated at (UTC)', provenance.generated_at_utc ? formatUtc(provenance.generated_at_utc) : unavailable],
    ['Calculation references', provenance.calculation_references?.length ? provenance.calculation_references.join('; ') : unavailable],
    ['Processing method', supplied(provenance.method)],
  ]
  return <dialog ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); onClose() }} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto rounded-xl border border-line bg-panel p-4 text-ink shadow-2xl backdrop:bg-black/70 sm:p-6" style={{ width: 'calc(100% - 2rem)' }}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={`${id}-title`} className="text-xl font-semibold">Mission Data</h2><button ref={closeButton} type="button" onClick={onClose} className="min-h-11 rounded-lg border border-line bg-space px-4 text-sm focus-visible:outline-1">Close Mission Data</button></div>
    <p id={`${id}-description`} className="mt-2 text-sm text-muted">Data & methodology for the currently selected site, period and UTC instant.</p>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Badge tone={provenance.data_status === 'sample' ? 'sample' : 'neutral'}>{provenance.data_status === 'sample' ? 'Sample data' : `${provenance.data_status} data`}</Badge><p className="text-sm text-muted">Horizon completeness describes coverage; it does not establish scientific validation.</p></div>
    {provenance.data_status === 'sample' && <p className="mt-2 text-sm text-accent">Synthetic interface fixtures. No scientific validation. DEM resolution and observer height are development placeholders.</p>}
    <section className="mt-5" aria-label="Provenance"><h3 className="text-base font-semibold">Provenance</h3><dl className="mt-3 space-y-3">{metadata.map(([label, value]) => <div key={label} className="grid min-w-0 gap-1 border-b border-line pb-3 sm:grid-cols-[12rem_minmax(0,1fr)]"><dt className="text-xs text-muted">{label}</dt><dd className="min-w-0 break-words text-sm">{value}</dd></div>)}</dl></section>
    <section className="mt-5 space-y-2 text-sm leading-6" aria-label="Coordinates and units"><h3 className="font-semibold">Coordinates and units</h3>
      <p>Latitude: {site.latitude_deg}° · Longitude: {site.longitude_deg}°. Coordinate reference: {supplied(site.coordinate_reference_system)}.</p>
      <p>Angles use degrees (°); lengths and heights use metres (m); sample spacing uses seconds (s). All timestamps are UTC. Observer height above surface: {site.observer_height_above_surface_m} m. Site elevation: {site.elevation_m === null ? unavailable : `${site.elevation_m} m`}.</p>
      <p>DEM source: {supplied(site.dem.source)}. Supplied resolution: {site.dem.resolution_m} m.</p>
      <p>Azimuth: <strong>True North, increasing clockwise</strong> (0° N, 90° E, 180° S, 270° W), from the supplied local-horizon convention.</p>
      <p>The map uses a separate polar frame; its longitude grid is not local horizon azimuth. Sign, datum and production coordinate conventions must come from the dataset’s CRS metadata.</p>
      {Object.entries(site.terrain).map(([name, metric]) => <p key={name}>{name.replaceAll('_', ' ')}: {metric ? `${metric.value} ${metric.unit} · ${metric.definition} · measurement scale: ${metric.measurement_scale_m === null ? unavailable : `${metric.measurement_scale_m} m`}` : unavailable}.</p>)}
    </section>
    <section className="mt-5 space-y-2 text-sm leading-6" aria-label="Visibility and obstruction timing"><h3 className="font-semibold">Visibility and obstruction timing</h3>
      <p>Clearance = body elevation − terrain horizon angle at that body’s azimuth. Clearance &gt; 0° is visible; clearance ≤ 0° is blocked. <strong>0° counts as blocked.</strong> Missing inputs stay unknown.</p>
      <p>Sample spacing: {window.sampling_interval_s} s. Horizon angular spacing: {horizon.angular_step_deg}°. Recorded instants do not establish continuous visibility between samples.</p>
      <p>Next obstruction means a future visible-to-blocked transition relative to the selected UTC. “Approx.” marks a crossing bracket between the last visible and first blocked samples; it is not an exact event time. Precision is limited by the supplied sample spacing.</p>
      <p>Already blocked means blocked at that sample. No obstruction in window means none reported within the full loaded window. Incomplete horizon means obstruction timing is unavailable. Filtering the period does not recompute those full-window results.</p>
      {(['sun', 'earth'] as const).map((body) => {
        const result = sample[body].next_obstruction
        return <p key={body} className="rounded-lg border border-line bg-space p-3"><strong>{body === 'sun' ? 'Sun' : 'Earth'}</strong>: {sample[body].visibility} at {formatUtc(sample.utc)} · Obstruction: {result.status.replaceAll('_', ' ')} · spacing {result.sampling_interval_s} s{result.status === 'visible_until' && (result.timing === 'bracketed' ? ` · Approx. ${formatUtc(result.bracket_start_utc)} → ${formatUtc(result.bracket_end_utc)}` : ` · Supplied event UTC: ${formatUtc(result.obstruction_utc)}`)}.</p>
      })}
      <p>Combined availability uses the provisional Sun-visible AND Earth-visible rule; either unknown remains unknown. This requires science-team validation and makes no power-safety or communications-link claim.</p>
    </section>
    <section className="mt-5 space-y-2 text-sm leading-6" aria-label="Quality and limitations"><h3 className="font-semibold">Quality and limitations</h3>
      <p>Horizon coverage: <strong>{horizon.quality}</strong>. {horizon.quality === 'complete' ? 'The supplied horizon is marked complete; completeness is not a validation result.' : horizon.quality === 'partial' ? 'The supplied horizon is partial: some directions lack terrain data, limiting visibility or obstruction timing.' : 'Horizon data is unavailable; visibility and timing may remain unknown.'}</p>
      <p>Missing horizon angles: {missing.length}{missing.length ? ` (azimuths ${missing.map((point) => `${point.azimuth_deg}°`).join(', ')})` : ''}. DEM edge reached at {edges.length} supplied horizon points; an edge can limit terrain coverage beyond the raster.</p>
      <p>Selected period: {included.length} recorded samples. Sun unknown: {included.filter((item) => item.sun.visibility === 'unknown').length}; Earth unknown: {included.filter((item) => item.earth.visibility === 'unknown').length}. Unknown is not blocked and is not silently excluded from comparison denominators.</p>
      <h4 className="font-semibold">Supplied quality flags</h4>
      {flags.length ? <ul className="list-disc space-y-2 pl-5">{flags.map((flag) => <li key={flag}><span className="font-mono">{flag}</span>: {provenance.quality_flag_definitions?.[flag] ?? 'Explanation unavailable — the pipeline has not supplied a definition.'}</li>)}</ul> : <p>No quality flags supplied. This does not imply that all checks passed.</p>}
      <p>Missing versions, generation time, calculation references and flag definitions are unavailable rather than inferred. Suitability remains not yet assessed; any assessment requires an agreed definition and science-team approval.</p>
    </section>
    <div className="mt-5"><Button onClick={onClose} className="focus-visible:outline-1">Return to analysis</Button></div>
  </dialog>
}
