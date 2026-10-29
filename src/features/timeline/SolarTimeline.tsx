import { AvailabilityTimeline } from './AvailabilityTimeline'
import type { SiteAnalysis } from '../../types/mission'

export function SolarTimeline(props: { analysis: SiteAnalysis; selectedIndex: number; onSelect: (index: number) => void }) {
  return <AvailabilityTimeline {...props} mode="sun" />
}
