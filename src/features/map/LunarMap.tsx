import { useId, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import type { MapSite } from './types'
import { polarCoordinates, polarPosition, lunarRadiusM } from './polarProjection'

const layers = {
  imagery: { label: 'LROC imagery', path: '/maps/lroc-south-pole.png', credit: 'NASA / ASU · LROC WAC mosaic · USGS' },
  relief: { label: 'LOLA relief', path: '/maps/lola-south-pole.png', credit: 'NASA / GSFC · LOLA relief · USGS (grayscale display)' },
}
const metric = (value: number, unit: string) => `${Number(value.toFixed(1))}${unit}`

export function LunarMap({ sites, selectedSiteId, onSelect }: {
  sites: MapSite[]
  selectedSiteId: string
  onSelect: (siteId: string) => void
}) {
  const id = useId()
  const [extent, setExtent] = useState(200000)
  const [grid, setGrid] = useState(true)
  const [layer, setLayer] = useState<keyof typeof layers>('imagery')
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState<{ latitude: number; longitude: number } | null>(null)
  const [failed, setFailed] = useState(false)
  const synthetic = sites.every((site) => site.catalog === 'Sample data')
  const selected = sites.find((site) => site.site_id === selectedSiteId)
  const filtered = sites.filter((site) => site.name.toLowerCase().includes(query.toLowerCase()))
  const metrics = selected ? [
    { name: 'Elevation', value: selected.elevation_m, unit: ' m' },
    { name: 'Slope', value: selected.slope_deg, unit: '°' },
  ].filter((item): item is { name: string; value: number; unit: string } => item.value !== null) : []
  const imageSize = 80 * 200000 / extent
  const scaleKm = extent >= 100000 ? 50 : 20
  const scalePercent = 80 * scaleKm * 1000 / (2 * extent)

  return (
    <Panel aria-labelledby={`${id}-heading`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="mb-1 text-xs uppercase tracking-widest text-accent">Surface explorer</p><h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-tight">Lunar South Pole</h2></div><Badge>2D polar map</Badge></div>
      <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto] lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="sr-only" htmlFor={`${id}-search`}>Search sites</label>
        <input id={`${id}-search`} type="search" placeholder="Search sites…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 min-w-0 rounded-lg border border-line bg-space px-4 text-sm" />
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" className="size-4 accent-accent" checked={grid} onChange={(event) => setGrid(event.target.checked)} />Grid</label>
        <div role="group" aria-label="Map layer" className="inline-flex min-w-0 max-w-full flex-wrap rounded-lg border border-line bg-space p-1">{(['imagery', 'relief'] as const).map((key) => <button key={key} type="button" aria-pressed={layer === key} onClick={() => { setLayer(key); setFailed(false) }} className={`min-h-9 rounded-md px-4 text-sm focus-visible:outline-1 focus-visible:outline-offset-2 ${layer === key ? 'bg-raised text-accent' : 'text-muted hover:text-ink'}`}>{key === 'imagery' ? 'Imagery' : 'Relief'}</button>)}</div>
          <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-3 lg:col-span-1"><Button aria-label="Zoom in" disabled={extent <= 50000} onClick={() => setExtent((value) => Math.max(50000, value / 2))}>+</Button><Button aria-label="Zoom out" disabled={extent >= 200000} onClick={() => setExtent((value) => Math.min(200000, value * 2))}>−</Button><Button onClick={() => { setExtent(200000); setQuery('') }}>Fit sites</Button></div>
      </div>
      <div className="map-stage relative overflow-hidden rounded-xl border border-line bg-space">
        <div className="map-canvas relative aspect-square"
          onPointerMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); setCursor(polarCoordinates((event.clientX - box.left) / box.width * 100, (event.clientY - box.top) / box.height * 100, extent)) }} onPointerLeave={() => setCursor(null)}>
          <svg viewBox="0 0 100 100" className="block size-full" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
            <title id={`${id}-title`}>Lunar south pole, {layers[layer].label}</title><desc id={`${id}-desc`}>Polar stereographic map with south pole at centre and longitude zero up. Sample data sites are selectable pins. A scale bar reports projected map distance.</desc>
            <defs><clipPath id={`${id}-clip`}><circle cx="50" cy="50" r="40" /></clipPath></defs>
            <g clipPath={`url(#${id}-clip)`}>
              <image key={layer} href={layers[layer].path} x={50 - imageSize / 2} y={50 - imageSize / 2} width={imageSize} height={imageSize} onError={() => setFailed(true)} style={layer === 'relief' ? { filter: 'grayscale(1)' } : undefined} />
              {grid && <g fill="none" stroke="white" strokeWidth="0.15" opacity="0.3">
                {[1, 2, 3, 4, 5, 6].map((degree) => <circle key={degree} cx="50" cy="50" r={40 * 2 * lunarRadiusM * Math.tan(degree * Math.PI / 360) / extent} />)}
                {[0, 30, 60, 90, 120, 150].map((rotation) => <line key={rotation} x1="10" x2="90" y1="50" y2="50" transform={`rotate(${rotation} 50 50)`} />)}
              </g>}
            </g>
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-line)" strokeWidth="0.3" />
            <g fill="white" stroke="black" strokeWidth="0.65" paintOrder="stroke" strokeLinejoin="round" fontSize="2.1" fontFamily="var(--font-mono)" textAnchor="middle"><text x="50" y="14">0°</text><text x="86" y="51">90°E</text><text x="50" y="88">180°</text><text x="14" y="51">90°W</text></g>
          </svg>
          {filtered.map((site) => {
            const position = polarPosition(site.latitude_deg, site.longitude_deg, extent)
            if (!position) return null
            const active = site.site_id === selectedSiteId
            return <button key={site.site_id} type="button" onClick={() => onSelect(site.site_id)} aria-pressed={active} aria-label={`Select ${site.name}, ${site.latitude_deg}°, ${site.longitude_deg}°`} title={site.name}
              style={{ left: `${position.x}%`, top: `${position.y}%` }} className={`group absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full ${active ? 'z-20' : 'z-10'}`}>
              <span className={`rounded-full border-2 ${active ? 'size-5 border-space bg-accent shadow-[0_0_28px_6px_var(--color-accent)] ring-2 ring-accent ring-offset-4 ring-offset-space/70' : 'size-3 border-accent bg-space shadow-[0_0_12px_var(--color-accent)]'}`} />
              <span className={`pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 w-max max-w-36 whitespace-normal break-words rounded border border-accent/40 bg-space/95 px-3 py-2 text-xs text-accent ${active || sites.length <= 2 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>{site.name}</span>
            </button>
          })}
          {failed && <p role="alert" className="absolute top-1/2 left-1/2 -translate-x-1/2 rounded bg-space p-4 text-sm">Baselayer failed to load. Select another layer or reload.</p>}

          <div className="absolute bottom-1 left-1 right-1 flex flex-wrap items-end justify-between gap-3 text-xs text-muted"><span className="rounded bg-space/85 px-2 py-1 font-mono">{cursor ? `${cursor.latitude.toFixed(3)}° / ${cursor.longitude.toFixed(3)}°` : '90°S · polar map'}</span><div className="relative h-3 shrink-0 border-x border-b border-ink font-mono text-ink" style={{ width: `${scalePercent}%` }}><span className="absolute right-0 bottom-3 whitespace-nowrap text-xs">{scaleKm} km*</span></div></div>
        </div>
        {selected && <aside aria-label="Selected site details" className="map-detail relative z-30 rounded-xl border border-line bg-panel/95 p-4 shadow-xl">
          <p className="text-xs uppercase tracking-wider text-accent">Selected site</p><h3 className="mt-2 text-xl font-semibold">{selected.name}</h3><div className="mt-2"><Badge tone="sample">{selected.catalog}</Badge></div>
          <p className="my-3 font-mono text-sm text-accent">{selected.latitude_deg.toFixed(4)}° / {selected.longitude_deg.toFixed(4)}°</p>
          {metrics.length > 0 && <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-y border-line py-3">{metrics.map(({ name, value, unit }) => <div key={name}><dt className="text-xs text-muted">{name}</dt><dd className="mt-1 font-mono text-sm text-accent">{metric(value, unit)}</dd></div>)}</dl>}
          <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">{(['sun', 'earth'] as const).map((body) => {
            const count = selected.availability[body]
            return <div key={body}><dt className="text-xs text-muted">{body === 'sun' ? 'Sun' : 'Earth'} visible</dt><dd className="mt-1 whitespace-nowrap font-mono text-lg text-accent">{count.visible} / {count.total}</dd><dd className="text-xs text-muted">samples</dd>{count.unknown > 0 && <dd className="mt-1 text-xs text-unknown">{count.unknown} unknown</dd>}</div>
          })}</dl>
          <p className="mt-2 text-xs text-muted">Recorded instants only; visibility between samples is unknown.</p>
          {selected.terrain_source_url && <p className="mt-2 text-xs text-muted">80 m terrain sample · <a href={selected.terrain_source_url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-4">LOLA source ↗</a></p>}
          <p className="mt-3 text-xs leading-5 text-muted">{selected.why}</p>{!synthetic && selected.source_url && <a href={selected.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-accent underline underline-offset-4">Coordinate source ↗</a>}
        </aside>}
      </div>
      <div aria-label="Map legend" className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted"><span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-full border-2 border-accent bg-space" />Site position</span><span className="text-accent">◉ Selected site</span>{layer === 'relief' && <div className="flex items-center gap-2"><span>Dark</span><span aria-hidden="true" className="h-2 w-20 rounded bg-linear-to-r from-black to-white" /><span>Light · relative shading (unitless)</span></div>}</div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Site selection">{filtered.map((site) => <button key={site.site_id} type="button" aria-pressed={site.site_id === selectedSiteId} onClick={() => { onSelect(site.site_id); setExtent(200000) }} className={`min-h-11 rounded-lg border px-3 py-2 text-xs ${site.site_id === selectedSiteId ? 'border-accent text-accent' : 'border-line text-muted hover:text-ink'}`}>{site.name}</button>)}{filtered.length === 0 && <p className="text-sm text-muted">No matching sites. Try another search.</p>}</div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 text-xs text-muted"><p>Imagery: NASA/LRO LROC · Terrain: NASA/GSFC LOLA · via USGS</p><details className="max-w-xl"><summary className="text-accent">ⓘ Map sources and precision</summary><p className="mt-2 leading-5">{synthetic ? 'Sample data positions; not NASA landing sites.' : 'NASA-published feature reference points, not final landing sites. 2022/2024 candidate labels reflect historical NASA announcements.'} {synthetic ? 'Site metrics and Sun/Earth availability are sample data. Science-team datasets will replace these values.' : 'Terrain and availability metrics come from the active mission dataset.'} Relief grayscale is illustrative shading, not a calibrated elevation scale. *Scale is projected distance. Imagery is a static mosaic, not current simulation lighting. The USGS service uses a legacy polar CRS alias; this display uses a lunar sphere of radius 1,737.4 km. Local horizon azimuth is a separate frame.</p></details></div>
    </Panel>
  )
}
