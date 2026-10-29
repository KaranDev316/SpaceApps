/** Map display values supplied by the active mission dataset. */
export interface MapSite {
  site_id: string
  name: string
  latitude_deg: number
  longitude_deg: number
  why: string
  catalog: string
  elevation_m: number | null
  slope_deg: number | null
  availability: { sun: SampleAvailability; earth: SampleAvailability }
  terrain_source_url?: string
  source_url?: string
}

export interface SampleAvailability {
  visible: number
  total: number
  unknown: number
}
