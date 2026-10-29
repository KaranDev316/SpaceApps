import type { SiteAnalysis } from '../../types/mission'

export interface AnalysisRange { start_utc: string; end_utc: string }

export function samplesInRange(analysis: SiteAnalysis, range: AnalysisRange) {
  const start = Date.parse(range.start_utc)
  const end = Date.parse(range.end_utc)
  return analysis.samples.filter(({ utc }) => Date.parse(utc) >= start && Date.parse(utc) <= end)
}

export function validateRange(analysis: SiteAnalysis, range: AnalysisRange): string | null {
  const start = Date.parse(range.start_utc)
  const end = Date.parse(range.end_utc)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Enter both start and end times in UTC.'
  if (start > end) return 'Start must be at or before end.'
  if (start < Date.parse(analysis.window.start_utc) || end > Date.parse(analysis.window.end_utc)) return 'Choose times within the available analysis window.'
  if (!samplesInRange(analysis, range).length) return 'No recorded samples fall in this range. Expand the range.'
  return null
}
