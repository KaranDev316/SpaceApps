# AstroNexus frontend

The React interface for the CLPS Lunar Mission Browser. Explorer connects site
selection and one shared simulation time to Sun/Earth status, a 360° local horizon,
a clearance-over-time chart, and sampled solar, Earth, and combined availability.

## Setup

Use Node.js 24.x and npm. From the repository root:

```bash
cd Web/frontend
npm ci
npm run dev
```

Open the local URL printed by Vite. The default port is 5173; Vite may choose
another port if it is occupied. No backend or environment variables are required
for the current mock-data prototype.

## Commands

Run these inside `Web/frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with live updates |
| `npm run build` | Check TypeScript and generate a production build in `dist/` |
| `npm run lint` | Run ESLint |
| `npm test` | Run comparison regressions and range-selector component tests |
| `npm run typecheck` | Check TypeScript without building assets |
| `npm run test:utc` / `npm run test:kolkata` | Run tests in both supported verification time zones |
| `npm run preview` | Serve an existing production build locally; run build first |

## Stack and structure

React, TypeScript, Vite, and Tailwind CSS with the official Vite plugin.
Charts currently use native SVG.

```text
src/
├── App.tsx                 # Mounts shared simulation state and Explorer
├── main.tsx                # React entry point and global stylesheet import
├── components/ui/          # Shared Button, Badge, and Panel
├── data/                   # Synthetic frontend fixtures
├── features/
│   ├── explorer/           # Site/time controls, status, and geometry readouts
│   ├── map/                # South-pole coordinate map and selectable site pins
│   ├── horizon/            # 360° azimuth/elevation chart
│   └── timeline/           # Clearance chart and sampled availability timelines
├── hooks/                  # Shared site and UTC selection
├── styles/                 # Tailwind theme tokens and SVG styling
└── types/                  # Provisional normalized mission data contract
```

Use the shared components and theme tokens for new interface work. Visual
conventions are documented in [the visual system guide](../../docs/frontend/visual-system.md).
The agreed layout is in [the updated wireframe](../../docs/wireframes/AstroNexus_Team_Wireframes_Updated.pdf).

## Data and scientific conventions

**The app currently uses synthetic sample data, not validated science.**
`src/data/mockMissionData.ts` contains two illustrative sites. Scientific datasets
belong in the repository's root `data/` folder.

- Times are UTC. All views share the selected simulation time.
- Clearance is body elevation minus the terrain horizon angle at its azimuth.
- Clearance greater than 0° is visible; 0° or below is blocked.
- Missing values remain unknown and appear as gaps in charts.
- Obstruction timing is separate for Sun and Earth. Bracketed crossings are
  approximate; sampling precision comes from the data.
- Availability timeline tiles represent recorded instants, not continuous access windows
  or power-safety conclusions.

Combined availability currently uses a provisional Sun-visible AND Earth-visible
rule. If either input is unknown, combined availability stays unknown. This display
rule still needs science-team validation.

The TypeScript contract is provisional until the science team supplies and agrees
on its JSON output. The frontend displays pipeline results; it does not replace
scientific geometry, visibility, or validation calculations.

## Lunar map

The Synthetic analysis demo displays the two fixture sites on locally bundled
LROC WAC imagery and LOLA shaded relief (grayscale). Site selection stays
synchronized with the horizon, simulation controls, and availability charts.
All site coordinates and metrics come from `src/data/mockMissionData.ts` until
the science team supplies the replacement dataset. The real basemap imagery
provides geographic context; it does not validate the synthetic site values.

The map supports search, pin/site selection, zoom, grid toggle, and baselayer
switching. The polar stereographic display uses a lunar sphere of radius
1,737,400 m and the raster bounds ±200,000 m. Longitude 0° is up and 90°E right.
Grid opacity is 30%. Scale reports projected distance, not a geodesic measurement.
The static imagery does not represent simulation-time illumination. Source and
projection metadata are in [the map source guide](../../docs/frontend/map-sources.md).

## Analysis date range

The themed `DateRangeSelector` lists only recorded UTC instants inside the loaded
analysis bounds. Compact From/To dropdowns and a primary sample timeline update every view
immediately. Endpoint ticks support arrow keys. Full window restores all samples;
even sample counts also offer time-labeled half-window presets. Picking a start after the end
moves the end to the start; equal bounds select one sample. Half presets split
sample counts (not elapsed duration) and are omitted for odd sample counts.
A multi-day UTC calendar enables only sampled days, and selecting a day chooses
its first through last sample. Single-day data shows its coverage date instead.
No native date popup or local-time conversion is used.

Filtering synchronizes time controls, charts, availability tiles and map counts.
The selected UTC is preserved if included; otherwise the first included sample is
selected. Switching sites restores its full window. Comparison inspection and
navigation notices clear on range changes. Obstruction results and source JSON
retain their original loaded-window scope; filtering does not recompute scientific
results or fetch additional data. Empty selectors disable controls explicitly.

## Site comparison

The top navigation places Compare immediately after Explorer and links to the
comparison section without resetting the selected site, UTC, or analysis window.
`site.suitability` is explicitly `null` in the current contract and fixtures.
Compare renders it as **Not yet assessed**, independently of other metrics.
Non-null payloads are withheld as **Awaiting agreed definition** rather than
interpreted as a score. Any future assessment schema and display require a
documented data definition and science-team approval. No suitability sorting,
rankings, percentages or recommendations are generated.

The matrix uses one shared UTC grid: the union of each site's expected cadence
slots inside its loaded window and all recorded timestamps in the selected range.
It never interpolates statuses. Missing timestamps and either unknown body give
unknown joint availability. Labels, symbols, border patterns, keyboard inspection
and quality details supplement color.

Map and comparison counts use the same `siteSummary` selector and shared UTC grid.
Unknown readouts distinguish absent timestamps from missing geometry.

All sample fractions use the full shared column count, including missing/unknown
slots, as denominator. Exact counts accompany percentages rounded to one decimal.
Known coverage is shown separately for each body and jointly. These percentages
are observed sample fractions, not elapsed-time percentages or site rankings.
Unmatched coverage and cadence differences are explicitly flagged. Duration
percentages and continuous-window lengths remain N/A until science supplies
period-specific results and definitions. Full-window summary fields are not reused
for filtered periods. Available site elevation/slope retain their supplied units.

Explore Site preserves the comparison period and selected UTC when supported. If
the target cannot support that period, it restores its loaded window and explains
the change; unavailable UTC falls back to the first included sample. Explorer's
simulation controls receive keyboard focus.

## Mission Data

Mission Data follows Compare in the header. View Data & Methodology in Compare
opens the same modal for the selected Explorer site, period and UTC instant.
The native modal traps keyboard focus, supports Escape, and restores focus to the
opening control on close. Metadata updates from the selected analysis props.

The panel shows source, method, versions, optional source datasets, generation
UTC and calculation references. Missing metadata remains explicitly unavailable.
Quality flag definitions come only from pipeline metadata; undefined flags are
shown with an unavailable explanation. Complete horizon describes coverage, not
scientific validation. Fixture resolution/height are marked as placeholders.
Visibility, crossing brackets, sample precision, CRS, units and the distinction
between local azimuth and polar-map coordinates are explained without adding
scientific calculations or inferred provenance.

## CSV and JSON exports

Export analysis offers Selected site or All comparison sites for the current
inclusive UTC period. Scope, site IDs, period and content are shown before download
and embedded in the files. Filenames identify the sites/comparison and UTC bounds.
Each site exports the shared expected/recorded sample grid; absent slots are explicit
and unknown records remain present. Scientific calculations are not rerun.

JSON includes site/horizon metadata, provenance, loaded window, selected period,
comparison counts and original nullable body/obstruction records. CSV has one row
per site, UTC slot and body, with unit-bearing geometry headers and embedded JSON
columns for metadata, quality flags, count definitions and provenance. CSV literal
`null` means unavailable; `0` is numeric zero and remains distinct. CSV uses quoted
fields and CRLF rows. Source JSON can contain null versions and unassessed suitability.
Sample-data labels survive both formats.

Original obstruction statuses/brackets retain their full loaded-window scope;
site/horizon metadata is static context. Exported sample counts are not duration
percentages; continuous-window metrics remain null. No full-window scientific
summaries are reused as filtered-period estimates. Download preparation failures
produce an inline error; browser save completion/cancellation is not observable.

## Remaining features

Time-dependent and quantitative map overlays,
real data integration,
and expanded loading/error states are still pending.

See the [repository README](../../README.md) for the wider team workflow.
