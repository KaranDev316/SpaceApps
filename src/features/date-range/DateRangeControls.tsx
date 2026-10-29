import { useId } from 'react'
import { Panel } from '../../components/ui/Panel'
import type { SiteAnalysis } from '../../types/mission'
import type { AnalysisRange } from './analysisRange'
import { DateRangeSelector } from './DateRangeSelector'

export function DateRangeControls({ analysis, range, onApply }: {
  analysis: SiteAnalysis
  range: AnalysisRange
  onApply: (range: AnalysisRange) => void
}) {
  const id = useId()
  const sampleDays = new Set(analysis.samples.map(({ utc }) => new Date(utc).toISOString().slice(0, 10)))
  return <Panel aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`} className="text-xl font-semibold">{sampleDays.size === 1 ? 'Analysis window (UTC)' : 'Analysis date range'}</h2>
    <p className="mt-2 mb-3 text-xs leading-5 text-muted">Recorded samples · inclusive bounds. Changing site restores its full window.</p>
    <DateRangeSelector key={analysis.site.site_id} available={{ start: analysis.window.start_utc, end: analysis.window.end_utc }} samples={analysis.samples.map(({ utc }) => utc)} value={{ start: range.start_utc, end: range.end_utc }} onChange={({ start, end }) => onApply({ start_utc: start, end_utc: end })} />
  </Panel>
}
