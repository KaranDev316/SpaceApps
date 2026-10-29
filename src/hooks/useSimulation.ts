import { exploreSelection, formatUtc } from '../features/comparison/comparison'
import { useState } from 'react'
import type { SiteAnalysis } from '../types/mission'
import { samplesInRange, validateRange, type AnalysisRange } from '../features/date-range/analysisRange'

/** Mount once in App so every visualization receives the same selection. */
export function useSimulation(analyses: SiteAnalysis[]) {
  const [siteId, setSiteId] = useState(analyses[0]?.site.site_id ?? '')
  const [utc, setUtc] = useState(analyses[0]?.samples[0]?.utc ?? '')
  const [navigationNotice, setNavigationNotice] = useState<string | null>(null)
  const [requestedRange, setRequestedRange] = useState<AnalysisRange | null>(null)
  const sourceAnalysis = analyses.find((item) => item.site.site_id === siteId)
  const range = requestedRange ?? (sourceAnalysis ? { start_utc: sourceAnalysis.window.start_utc, end_utc: sourceAnalysis.window.end_utc } : null)
  const samples = sourceAnalysis && range ? samplesInRange(sourceAnalysis, range) : []
  const analysis = sourceAnalysis && range ? {
    ...sourceAnalysis, samples,
    window: { ...sourceAnalysis.window, ...range },
  } : undefined
  const sampleIndex = samples.findIndex((item) => item.utc === utc)
  const sample = samples[sampleIndex]

  function selectSite(nextId: string) {
    const next = analyses.find((item) => item.site.site_id === nextId)
    if (!next || nextId === siteId) return
    setSiteId(nextId)
    setNavigationNotice(null)
    setRequestedRange(null)
    // Preserve shared UTC when switching sites; otherwise select the first sample.
    if (!next.samples.some((item) => item.utc === utc)) setUtc(next.samples[0]?.utc ?? '')
  }

  function exploreSite(nextId: string) {
    const next = analyses.find((item) => item.site.site_id === nextId)
    if (!next || !next.samples.length || !range) return
    const { keepsRange, keepsTime, utc: nextUtc } = exploreSelection(next, range, utc)
    setSiteId(nextId)
    setRequestedRange(keepsRange ? range : null)
    if (nextUtc) setUtc(nextUtc)
    setNavigationNotice(`${next.site.name}: ${keepsRange ? 'comparison period preserved' : 'comparison period unavailable; restored full loaded window'}. ${keepsTime ? 'Selected UTC preserved.' : 'Selected UTC unavailable; showing first available sample.'}`)
  }

  function applyRange(next: AnalysisRange) {
    if (!sourceAnalysis || validateRange(sourceAnalysis, next)) return
    setNavigationNotice(null)
    setRequestedRange({ start_utc: formatUtc(next.start_utc), end_utc: formatUtc(next.end_utc) })
    const included = samplesInRange(sourceAnalysis, next)
    if (!included.some((item) => item.utc === utc)) setUtc(included[0].utc)
  }

  function selectSample(index: number) {
    const next = samples[index]
    if (next) setUtc(next.utc)
  }

  return { analysis, sourceAnalysis, range, applyRange, exploreSite, navigationNotice, sample, sampleIndex, selectSite, selectSample }
}

export type Simulation = ReturnType<typeof useSimulation>
