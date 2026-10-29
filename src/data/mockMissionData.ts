import type { SiteAnalysis } from '../types/mission'

/** Synthetic development data only; never label as validated science. */
export const mockMissionData = [
  {
    "site": {
      "suitability": null,
      "site_id": "sample-a",
      "name": "Sample Site A",
      "latitude_deg": -88.0,
      "longitude_deg": 30,
      "coordinate_reference_system": "Synthetic lunar latitude/longitude in degrees; no production CRS assigned",
      "elevation_m": null,
      "observer_height_above_surface_m": 0,
      "dem": {
        "source": "Synthetic fixture; no DEM used",
        "resolution_m": 10
      },
      "terrain": {
        "slope": null,
        "aspect": null,
        "roughness": null,
        "relative_elevation": null
      }
    },
    "horizon": {
      "site_id": "sample-a",
      "azimuth_convention": "clockwise_from_true_local_north",
      "angular_step_deg": 90,
      "quality": "complete",
      "points": [
        {
          "azimuth_deg": 0,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        },
        {
          "azimuth_deg": 90,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        },
        {
          "azimuth_deg": 180,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        },
        {
          "azimuth_deg": 270,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        }
      ]
    },
    "window": {
      "start_utc": "2026-11-14T18:00:00Z",
      "end_utc": "2026-11-14T21:00:00Z",
      "sampling_interval_s": 3600
    },
    "samples": [
      {
        "utc": "2026-11-14T18:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 1.9,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.9,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "visible_until",
            "timing": "bracketed",
            "obstruction_utc": null,
            "bracket_start_utc": "2026-11-14T19:00:00Z",
            "bracket_end_utc": "2026-11-14T20:00:00Z",
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 270,
          "elevation_deg": 0.6,
          "horizon_angle_deg": 1,
          "clearance_deg": -0.4,
          "visibility": "blocked",
          "quality_flags": [],
          "next_obstruction": {
            "status": "already_blocked",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      },
      {
        "utc": "2026-11-14T19:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 1.4,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.4,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "visible_until",
            "timing": "bracketed",
            "obstruction_utc": null,
            "bracket_start_utc": "2026-11-14T19:00:00Z",
            "bracket_end_utc": "2026-11-14T20:00:00Z",
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 270,
          "elevation_deg": 1.2,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.2,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      },
      {
        "utc": "2026-11-14T20:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 1,
          "horizon_angle_deg": 1,
          "clearance_deg": 0,
          "visibility": "blocked",
          "quality_flags": [],
          "next_obstruction": {
            "status": "already_blocked",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 270,
          "elevation_deg": 1.5,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.5,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      },
      {
        "utc": "2026-11-14T21:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 0.7,
          "horizon_angle_deg": 1,
          "clearance_deg": -0.3,
          "visibility": "blocked",
          "quality_flags": [],
          "next_obstruction": {
            "status": "already_blocked",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 270,
          "elevation_deg": 1.8,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.8,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      }
    ],
    "access_windows": {
      "solar": [],
      "earth": [],
      "combined": []
    },
    "summary": {
      "sun_visible_percent": null,
      "earth_visible_percent": null,
      "combined_access_percent": null,
      "longest_dark_gap_s": null,
      "longest_earth_blocked_gap_s": null,
      "coverage_percent": 100,
      "calculation_method": "Coverage is the fraction of timestamps with both bodies known. Availability and gap metrics are intentionally unavailable; access windows are not supplied."
    },
    "provenance": {
      "data_status": "sample",
      "dataset_source": "Hand-authored synthetic UI fixtures; not NASA observations or ephemerides",
      "dataset_version": null,
      "model_version": null,
      "method": "Illustrative geometry only. Flat 1-degree horizon at known azimuths. Obstructions bracket adjacent hourly samples; zero clearance is blocked. DEM resolution is a placeholder.",
      "quality_flags": []
    }
  },
  {
    "site": {
      "suitability": null,
      "site_id": "sample-b",
      "name": "Sample Site B",
      "latitude_deg": -86.8,
      "longitude_deg": 140,
      "coordinate_reference_system": "Synthetic lunar latitude/longitude in degrees; no production CRS assigned",
      "elevation_m": null,
      "observer_height_above_surface_m": 0,
      "dem": {
        "source": "Synthetic fixture; no DEM used",
        "resolution_m": 10
      },
      "terrain": {
        "slope": null,
        "aspect": null,
        "roughness": null,
        "relative_elevation": null
      }
    },
    "horizon": {
      "site_id": "sample-b",
      "azimuth_convention": "clockwise_from_true_local_north",
      "angular_step_deg": 90,
      "quality": "partial",
      "points": [
        {
          "azimuth_deg": 0,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        },
        {
          "azimuth_deg": 90,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        },
        {
          "azimuth_deg": 180,
          "horizon_angle_deg": 1,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        },
        {
          "azimuth_deg": 270,
          "horizon_angle_deg": null,
          "horizon_point_distance_m": null,
          "dem_edge_reached": false,
          "quality_flags": []
        }
      ]
    },
    "window": {
      "start_utc": "2026-11-14T18:00:00Z",
      "end_utc": "2026-11-14T21:00:00Z",
      "sampling_interval_s": 3600
    },
    "samples": [
      {
        "utc": "2026-11-14T18:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 2.2,
          "horizon_angle_deg": 1,
          "clearance_deg": 1.2,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 180,
          "elevation_deg": 1.3,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.3,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "horizon_incomplete",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      },
      {
        "utc": "2026-11-14T19:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 2.0,
          "horizon_angle_deg": 1,
          "clearance_deg": 1.0,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 270,
          "elevation_deg": null,
          "horizon_angle_deg": null,
          "clearance_deg": null,
          "visibility": "unknown",
          "quality_flags": [],
          "next_obstruction": {
            "status": "horizon_incomplete",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      },
      {
        "utc": "2026-11-14T20:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 1.8,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.8,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 180,
          "elevation_deg": 1.5,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.5,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "horizon_incomplete",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      },
      {
        "utc": "2026-11-14T21:00:00Z",
        "sun": {
          "azimuth_deg": 90,
          "elevation_deg": 1.6,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.6,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "no_obstruction_in_window",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        },
        "earth": {
          "azimuth_deg": 180,
          "elevation_deg": 1.7,
          "horizon_angle_deg": 1,
          "clearance_deg": 0.7,
          "visibility": "visible",
          "quality_flags": [],
          "next_obstruction": {
            "status": "horizon_incomplete",
            "timing": "unavailable",
            "obstruction_utc": null,
            "bracket_start_utc": null,
            "bracket_end_utc": null,
            "sampling_interval_s": 3600,
            "quality_flag": null
          }
        }
      }
    ],
    "access_windows": {
      "solar": [],
      "earth": [],
      "combined": []
    },
    "summary": {
      "sun_visible_percent": null,
      "earth_visible_percent": null,
      "combined_access_percent": null,
      "longest_dark_gap_s": null,
      "longest_earth_blocked_gap_s": null,
      "coverage_percent": 75,
      "calculation_method": "Coverage is the fraction of timestamps with both bodies known. Availability and gap metrics are intentionally unavailable; access windows are not supplied."
    },
    "provenance": {
      "data_status": "sample",
      "dataset_source": "Hand-authored synthetic UI fixtures; not NASA observations or ephemerides",
      "dataset_version": null,
      "model_version": null,
      "method": "Illustrative geometry only. Flat 1-degree horizon at known azimuths. Obstructions bracket adjacent hourly samples; zero clearance is blocked. DEM resolution is a placeholder.",
      "quality_flags": []
    }
  }
] satisfies SiteAnalysis[]
