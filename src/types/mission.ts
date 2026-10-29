/**
 * Provisional frontend contract, pending the science team's sample JSON.
 * These types describe normalized UI data, not a guaranteed API response.
 * Times are ISO 8601 UTC strings ending in Z; angles are degrees, distances metres.
 */
export type UtcTimestamp = string

// Quality flag meanings must come from the pipeline; do not invent an enum.
export type QualityFlag = string
export type DataStatus = 'sample' | 'unvalidated' | 'validated'
export type VisibilityStatus = 'visible' | 'blocked' | 'unknown'
export type HorizonQuality = 'complete' | 'partial' | 'unavailable'

export interface Provenance {
  /** Optional pipeline metadata; never synthesize missing values. */
  source_datasets?: string[]
  processing_version?: string | null
  generated_at_utc?: UtcTimestamp | null
  calculation_references?: string[]
  quality_flag_definitions?: Record<string, string>
  data_status: DataStatus
  dataset_source: string
  dataset_version: string | null
  model_version: string | null
  method: string
  quality_flags: QualityFlag[]
}

export interface TerrainMetric {
  value: number
  unit: 'deg' | 'm'
  definition: string
  measurement_scale_m: number | null
}

export interface LandingSite {
  /** Reserved until an assessment definition and science-team approval exist. */
  suitability: null
  site_id: string
  name: string
  latitude_deg: number
  longitude_deg: number
  coordinate_reference_system: string
  elevation_m: number | null
  observer_height_above_surface_m: number
  dem: {
    source: string
    resolution_m: number
  }
  terrain: {
    slope: TerrainMetric | null
    aspect: TerrainMetric | null
    roughness: TerrainMetric | null
    relative_elevation: TerrainMetric | null
  }
}

export interface HorizonPoint {
  azimuth_deg: number
  horizon_angle_deg: number | null
  horizon_point_distance_m: number | null
  dem_edge_reached: boolean
  quality_flags: QualityFlag[]
}

export interface SiteHorizon {
  site_id: string
  /** Clockwise from true local north: N=0°, E=90°, S=180°, W=270°. */
  azimuth_convention: 'clockwise_from_true_local_north'
  angular_step_deg: number
  quality: HorizonQuality
  points: HorizonPoint[]
}

interface ObstructionBase {
  sampling_interval_s: number
  quality_flag: QualityFlag | null
}

/** A bracket is an approximate interval, not an exact crossing timestamp. */
export type ObstructionResult = ObstructionBase & (
  | {
      status: 'visible_until'
      timing: 'timestamp'
      obstruction_utc: UtcTimestamp
      bracket_start_utc: null
      bracket_end_utc: null
    }
  | {
      status: 'visible_until'
      timing: 'bracketed'
      obstruction_utc: null
      bracket_start_utc: UtcTimestamp
      bracket_end_utc: UtcTimestamp
    }
  | {
      status: 'already_blocked' | 'no_obstruction_in_window' | 'horizon_incomplete'
      timing: 'unavailable'
      obstruction_utc: null
      bracket_start_utc: null
      bracket_end_utc: null
    }
)

export interface BodySample {
  azimuth_deg: number | null
  elevation_deg: number | null
  horizon_angle_deg: number | null
  /** Elevation minus horizon angle: >0 visible, <=0 blocked; missing stays unknown. */
  clearance_deg: number | null
  visibility: VisibilityStatus
  quality_flags: QualityFlag[]
  /** Evaluated relative to this sample's UTC, never the real-world clock. */
  next_obstruction: ObstructionResult
}

export interface TimeSample {
  utc: UtcTimestamp
  sun: BodySample
  earth: BodySample
}

export interface AnalysisWindow {
  start_utc: UtcTimestamp
  end_utc: UtcTimestamp
  sampling_interval_s: number
}

export interface AccessWindow {
  start_utc: UtcTimestamp
  end_utc: UtcTimestamp
  status: VisibilityStatus
  reason: string | null
}

export interface ComparisonSummary {
  /** Percentages are 0–100; the pipeline must document missing-data treatment. */
  sun_visible_percent: number | null
  earth_visible_percent: number | null
  combined_access_percent: number | null
  longest_dark_gap_s: number | null
  longest_earth_blocked_gap_s: number | null
  coverage_percent: number
  calculation_method: string
}

export interface SiteAnalysis {
  site: LandingSite
  horizon: SiteHorizon
  window: AnalysisWindow
  samples: TimeSample[]
  access_windows: {
    solar: AccessWindow[]
    earth: AccessWindow[]
    /** Sun AND Earth visible; interpretation pending science validation. */
    combined: AccessWindow[]
  }
  summary: ComparisonSummary
  provenance: Provenance
}
