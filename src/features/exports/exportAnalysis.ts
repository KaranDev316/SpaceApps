import type { SiteAnalysis } from '../../types/mission'
import type { AnalysisRange } from '../date-range/analysisRange'
import { comparisonGrid, comparisonState, formatUtc, siteSummary } from '../comparison/comparison'

export type ExportScope = 'selected-site' | 'comparison'
export const exportDefinitions = {
  time: 'UTC; selected period has inclusive bounds. Grid is the union of expected cadence slots inside loaded windows and actual timestamps. No status interpolation.',
  missing: 'JSON null and CSV literal null mean unavailable, never zero. sample_present=false means no recorded sample at that UTC; unknown body statuses are preserved.',
  visibility: 'Clearance = body elevation minus local terrain horizon angle, degrees. >0 visible; <=0 blocked, including zero. Either body unknown gives unknown joint status.',
  percentages: 'Sample fractions use all shared UTC slots, including missing/unknown slots, as denominator. Unknown is never visible or silently excluded. Fractions are not elapsed-time percentages.',
  obstruction: 'Original pipeline statuses and crossing brackets are retained. They refer to the loaded analysis window, not a recomputation for the export period. Approximate brackets are not exact event times.',
  static_metadata: 'Site, horizon and provenance describe the selected dataset, not time-filtered calculations. Missing provenance is not inferred. Complete horizon is not scientific validation.',
  intervals: 'Duration percentages and continuous-window metrics are unavailable without defined period-specific science-team results.',
}

export function buildExport(analyses: SiteAnalysis[], range: AnalysisRange, scope: ExportScope) {
  if (!analyses.length || (scope === 'selected-site' && analyses.length !== 1)) throw new Error('Choose at least one site and a valid export scope.')
  const start = Date.parse(range.start_utc), end = Date.parse(range.end_utc)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) throw new Error('The export period is invalid.')
  const grid = comparisonGrid(analyses, range)
  if (!grid.length) throw new Error('No sample slots are available in this export period.')
  return {
    schema_version: 'astronexus-ui-export-1',
    exported_at_utc: new Date().toISOString(),
    scope: { kind: scope, site_ids: analyses.map(({ site }) => site.site_id), period: { start_utc: formatUtc(start), end_utc: formatUtc(end) }, content: 'Recorded Sun/Earth geometry, visibility, obstruction results, missing slots, sample comparison counts, site/horizon metadata and provenance' },
    units: { angles: 'deg', distances: 'm', sample_spacing: 's', timestamps: 'UTC', coverage: 'sample slots; counts and fractions, not duration' },
    definitions: exportDefinitions,
    grid_utc: grid.map(formatUtc),
    sites: analyses.map((analysis) => {
      const { cells, ...counts } = siteSummary(analysis, range, grid)
      return {
        site: analysis.site,
        provenance: analysis.provenance,
        horizon: analysis.horizon,
        loaded_window: analysis.window,
        selected_period: { start_utc: formatUtc(start), end_utc: formatUtc(end) },
        comparison_metrics: { ...counts, both_visible_duration_percent: null, longest_continuous_access_s: null },
        records: grid.map((time, index) => ({ utc: formatUtc(time), sample_present: Boolean(cells[index]), joint_visibility: comparisonState(cells[index]), sample: cells[index] ?? null })),
      }
    }),
  }
}
export type AnalysisExport = ReturnType<typeof buildExport>

export function exportFilename(data: AnalysisExport, format: 'csv' | 'json') {
  const slug = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-')
  const stamp = (value: string) => value.replace(/[:.]/g, '')
  const sites = data.scope.site_ids.map(slug).join('_')
  return `astronexus_${data.scope.kind === 'comparison' ? 'comparison_' : ''}${sites}_${stamp(data.scope.period.start_utc)}_to_${stamp(data.scope.period.end_utc)}.${format}`
}

export function serializeCsv(data: AnalysisExport) {
  const headers = [
    'site_id', 'site_name', 'utc', 'sample_present', 'body', 'visibility', 'joint_visibility',
    'azimuth_deg', 'elevation_deg', 'terrain_horizon_angle_deg', 'clearance_deg',
    'body_quality_flags_json', 'obstruction_status', 'obstruction_timing', 'obstruction_utc',
    'bracket_start_utc', 'bracket_end_utc', 'obstruction_sample_spacing_s', 'obstruction_quality_flag',
    'data_status', 'selected_start_utc', 'selected_end_utc', 'loaded_start_utc', 'loaded_end_utc', 'analysis_sample_spacing_s',
    'latitude_deg', 'longitude_deg', 'site_elevation_m', 'observer_height_above_surface_m', 'coordinate_reference_system',
    'site_metadata_json', 'horizon_metadata_json', 'provenance_json', 'comparison_metrics_json', 'export_scope', 'exported_at_utc', 'units_json', 'definitions_json',
  ]
  const quote = (value: unknown) => `"${String(value == null ? 'null' : value).replaceAll('"', '""')}"`
  const rows: unknown[][] = [headers]
  for (const entry of data.sites) for (const record of entry.records) for (const body of ['sun', 'earth'] as const) {
    const geometry = record.sample?.[body]
    const obstruction = geometry?.next_obstruction
    rows.push([
      entry.site.site_id, entry.site.name, record.utc, record.sample_present, body, geometry?.visibility ?? 'unknown', record.joint_visibility,
      geometry?.azimuth_deg, geometry?.elevation_deg, geometry?.horizon_angle_deg, geometry?.clearance_deg,
      geometry ? JSON.stringify(geometry.quality_flags) : null, obstruction?.status, obstruction?.timing, obstruction?.obstruction_utc,
      obstruction?.bracket_start_utc, obstruction?.bracket_end_utc, obstruction?.sampling_interval_s, obstruction?.quality_flag,
      entry.provenance.data_status, data.scope.period.start_utc, data.scope.period.end_utc, entry.loaded_window.start_utc, entry.loaded_window.end_utc, entry.loaded_window.sampling_interval_s,
      entry.site.latitude_deg, entry.site.longitude_deg, entry.site.elevation_m, entry.site.observer_height_above_surface_m, entry.site.coordinate_reference_system,
      JSON.stringify(entry.site), JSON.stringify(entry.horizon), JSON.stringify(entry.provenance), JSON.stringify(entry.comparison_metrics), data.scope.kind, data.exported_at_utc, JSON.stringify(data.units), JSON.stringify(data.definitions),
    ])
  }
  return rows.map((row) => row.map(quote).join(',')).join('\r\n') + '\r\n'
}

export function downloadExport(data: AnalysisExport, format: 'csv' | 'json') {
  const text = format === 'json' ? JSON.stringify(data, null, 2) + '\n' : serializeCsv(data)
  const blob = new Blob([text], { type: format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  try {
    link.href = url
    link.download = exportFilename(data, format)
    document.body.append(link)
    link.click()
  } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
