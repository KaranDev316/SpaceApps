import { useId, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { SiteAnalysis } from '../../types/mission'
import type { AnalysisRange } from '../date-range/analysisRange'
import { formatUtc } from '../comparison/comparison'
import { buildExport, downloadExport, exportFilename, type ExportScope } from './exportAnalysis'

export function ExportControls({ analyses, selectedSiteId, range }: { analyses: SiteAnalysis[]; selectedSiteId: string; range: AnalysisRange }) {
  const id = useId()
  const [scope, setScope] = useState<ExportScope>('selected-site')
  const selected = scope === 'comparison' ? analyses : analyses.filter(({ site }) => site.site_id === selectedSiteId)
  const context = `${scope}-${selected.map(({ site }) => site.site_id).join(',')}-${range.start_utc}-${range.end_utc}`
  const [result, setResult] = useState<{ context: string; message: string; failed: boolean } | null>(null)
  function save(format: 'csv' | 'json') {
    try {
      const data = buildExport(selected, range, scope)
      downloadExport(data, format)
      setResult({ context, message: `Download prepared: ${exportFilename(data, format)}.`, failed: false })
    } catch (error) {
      setResult({ context, message: `Export failed: ${error instanceof Error ? error.message : 'Unable to create the file.'} Retry the export.`, failed: true })
    }
  }
  return <Panel aria-labelledby={`${id}-heading`}>
    <h2 id={`${id}-heading`} className="text-xl font-semibold">Export analysis</h2>
    <fieldset className="mt-3"><legend className="text-sm font-semibold">Export scope</legend><div className="mt-2 flex flex-wrap gap-3">{(['selected-site', 'comparison'] as const).map((kind) => <label key={kind} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm"><input type="radio" name={`${id}-scope`} value={kind} checked={scope === kind} onChange={() => setScope(kind)} className="accent-accent focus-visible:outline-1" />{kind === 'selected-site' ? 'Selected site' : 'All comparison sites'}</label>)}</div></fieldset>
    <p className="mt-3 break-words text-sm text-accent">Sites: {selected.map(({ site }) => `${site.name} (${site.site_id})`).join(', ') || 'None'}</p>
    <p className="mt-2 break-words font-mono text-xs text-muted">Period (UTC, inclusive): {formatUtc(range.start_utc)} → {formatUtc(range.end_utc)}</p>
    <p className="mt-3 text-sm leading-6 text-muted">Exports contain Sun/Earth geometry and clearance, visibility, original obstruction results, unknown and absent sample slots, comparison counts, site/horizon metadata and provenance. Static metadata and obstruction results retain their full loaded-window context.</p>
    <p className="mt-2 text-xs leading-6 text-muted">CSV uses unit-bearing columns and embedded JSON metadata columns. Literal null means unavailable; 0 remains zero. JSON preserves nullable fields and quality information. Sample-data labels remain in both formats. Sample fractions do not represent continuous availability.</p>
    <div className="mt-4 flex flex-wrap gap-3"><Button disabled={!selected.length} onClick={() => save('csv')} className="focus-visible:outline-1">Download CSV</Button><Button disabled={!selected.length} onClick={() => save('json')} className="focus-visible:outline-1">Export Analysis JSON</Button></div>
    {result?.context === context && <p role={result.failed ? 'alert' : 'status'} className={`mt-3 break-words text-sm ${result.failed ? 'text-blocked' : 'text-muted'}`}>{result.message}</p>}
  </Panel>
}
