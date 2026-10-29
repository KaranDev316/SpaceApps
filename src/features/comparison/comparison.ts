import type { BodySample, SiteAnalysis, TimeSample } from '../../types/mission'
import { samplesInRange, validateRange, type AnalysisRange } from '../date-range/analysisRange'

export type ComparisonState = 'both' | 'sun' | 'earth' | 'neither' | 'unknown'
export function comparisonState(sample?: TimeSample): ComparisonState {
  if (!sample || sample.sun.visibility === 'unknown' || sample.earth.visibility === 'unknown') return 'unknown'
  if (sample.sun.visibility === 'visible') return sample.earth.visibility === 'visible' ? 'both' : 'sun'
  return sample.earth.visibility === 'visible' ? 'earth' : 'neither'
}

/** Union of expected cadence slots and actual timestamps; never interpolate statuses. */
export function comparisonGrid(analyses: SiteAnalysis[], range: AnalysisRange) {
  const start = Date.parse(range.start_utc), end = Date.parse(range.end_utc)
  const times = new Set<number>()
  for (const analysis of analyses) {
    for (const sample of samplesInRange(analysis, range)) times.add(Date.parse(sample.utc))
    const origin = Date.parse(analysis.window.start_utc)
    const step = analysis.window.sampling_interval_s * 1000
    if (!(step > 0)) continue
    const first = origin + Math.max(0, Math.ceil((start - origin) / step)) * step
    const last = Math.min(end, Date.parse(analysis.window.end_utc))
    for (let time = first; time <= last; time += step) times.add(time)
  }
  return [...times].sort((a, b) => a - b)
}

export function siteSummary(analysis: SiteAnalysis, range: AnalysisRange, times = comparisonGrid([analysis], range)) {
  const byTime = new Map(analysis.samples.map((sample) => [Date.parse(sample.utc), sample]))
  const cells = times.map((time) => byTime.get(time))
  return {
    cells,
    total: times.length,
    recorded: cells.filter(Boolean).length,
    sunKnown: cells.filter((sample) => sample && sample.sun.visibility !== 'unknown').length,
    earthKnown: cells.filter((sample) => sample && sample.earth.visibility !== 'unknown').length,
    known: cells.filter((sample) => comparisonState(sample) !== 'unknown').length,
    both: cells.filter((sample) => comparisonState(sample) === 'both').length,
    sun: cells.filter((sample) => sample?.sun.visibility === 'visible').length,
    earth: cells.filter((sample) => sample?.earth.visibility === 'visible').length,
  }
}

/** Preserve the distinction between an absent timestamp and a supplied unknown status. */
export function bodyStatusReason(body?: BodySample) {
  if (!body) return 'unknown (no recorded sample)'
  if (body.visibility !== 'unknown') return body.visibility
  if (body.horizon_angle_deg === null && body.elevation_deg === null) return 'unknown (horizon and body elevation unavailable)'
  if (body.horizon_angle_deg === null) return 'unknown (horizon unavailable)'
  if (body.elevation_deg === null) return 'unknown (body elevation unavailable)'
  return 'unknown (status unavailable)'
}

export function formatUtc(utc: string | number) {
  return new Date(utc).toISOString().replace('.000Z', 'Z')
}

export function exploreSelection(analysis: SiteAnalysis, range: AnalysisRange, utc: string) {
  const keepsRange = !validateRange(analysis, range)
  const included = keepsRange ? samplesInRange(analysis, range) : analysis.samples
  const keepsTime = included.some((item) => Date.parse(item.utc) === Date.parse(utc))
  return { keepsRange, keepsTime, utc: keepsTime ? utc : included[0]?.utc }
}

/** Never render an unapproved payload as a score, rank or recommendation. */
export function suitabilityLabel(value: unknown): string {
  return value == null ? 'Not yet assessed' : 'Awaiting agreed definition'
}
