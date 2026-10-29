import type { VisibilityStatus } from '../../types/mission'

/** Provisional UI rule: preserve uncertainty until both input states are known. */
export function combinedAvailability(sun: VisibilityStatus, earth: VisibilityStatus): VisibilityStatus {
  if (sun === 'unknown' || earth === 'unknown') return 'unknown'
  return sun === 'visible' && earth === 'visible' ? 'visible' : 'blocked'
}
