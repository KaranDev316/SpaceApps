import { useId } from 'react'
import type { SiteHorizon, TimeSample } from '../../types/mission'
import { Panel } from '../../components/ui/Panel'
import { Badge } from '../../components/ui/Badge'

const left = 65
const right = 865
const top = 45
const bottom = 325
const x = (azimuth: number) => left + (azimuth / 360) * (right - left)

export function Horizon({ horizon, sample }: { horizon: SiteHorizon; sample: TimeSample }) {
  const id = useId()
  const points = [...horizon.points].sort((a, b) => a.azimuth_deg - b.azimuth_deg)
  const bodies = [{ name: 'Sun', value: sample.sun }, { name: 'Earth', value: sample.earth }]
  const angles = [0, ...points.map((point) => point.horizon_angle_deg), ...bodies.map(({ value }) => value.elevation_deg)]
    .filter((angle): angle is number => angle !== null && Number.isFinite(angle))
  const min = Math.floor(Math.min(...angles)) - 1
  const max = Math.ceil(Math.max(...angles)) + 1
  const y = (angle: number) => bottom - ((angle - min) / (max - min)) * (bottom - top)
  const ticks = Array.from({ length: 5 }, (_, index) => min + ((max - min) * index) / 4)
  // Close the circular seam only when the first point is at true north.
  const first = points[0]
  const plotted = first?.azimuth_deg === 0 && points.at(-1)?.azimuth_deg !== 360
    ? [...points, { ...first, azimuth_deg: 360 }]
    : points

  return (
    <Panel aria-labelledby={`${id}-heading`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold tracking-tight" id={`${id}-heading`}>360° Horizon</h2><Badge tone={horizon.quality === 'complete' ? 'neutral' : 'unknown'}>{horizon.quality} horizon</Badge></div>
      <p className="text-sm text-muted">Local terrain horizon and Sun/Earth positions · {sample.utc}</p>
      <p className="mt-2 text-xs text-muted">Horizon quality: <strong>{horizon.quality}</strong> · Azimuth clockwise from true local north.</p>
      <div className="mt-6 min-w-0 max-w-full rounded-lg border border-line bg-space p-2">
        <svg className="horizon-chart block h-auto w-full max-w-full" viewBox="0 0 920 410" role="img" aria-labelledby={`${id}-title ${id}-description`}>
          <title id={`${id}-title`}>Local horizon at {sample.utc}</title>
          <desc id={`${id}-description`}>Azimuth from 0 to 360 degrees horizontally; elevation in degrees vertically. Terrain segments connect known adjacent samples. Gaps indicate missing terrain. Sun is a circle; Earth is a diamond. Body status comes from the sample data.</desc>
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={left} x2={right} y1={y(tick)} y2={y(tick)} className="chart-grid" />
              <text x={left - 10} y={y(tick) + 5} textAnchor="end">{Number(tick.toFixed(2))}°</text>
            </g>
          ))}
          <line x1={left} x2={right} y1={y(0)} y2={y(0)} className="chart-zero" strokeDasharray="5 5" />
          {[0, 90, 180, 270, 360].map((azimuth, index) => (
            <g key={azimuth}>
              <line x1={x(azimuth)} x2={x(azimuth)} y1={top} y2={bottom} className="chart-grid" />
              <text x={x(azimuth)} y={bottom + 28} textAnchor="middle">{azimuth}° {['N', 'E', 'S', 'W', 'N'][index]}</text>
            </g>
          ))}
          {plotted.map((point, index) => {
            const next = plotted[index + 1]
            if (point.horizon_angle_deg === null || !next || next.horizon_angle_deg === null
              || next.azimuth_deg - point.azimuth_deg > horizon.angular_step_deg * 1.01) return null
            return <line key={`segment-${index}`} x1={x(point.azimuth_deg)} y1={y(point.horizon_angle_deg)}
              x2={x(next.azimuth_deg)} y2={y(next.horizon_angle_deg)} className="chart-terrain" strokeWidth={3} />
          })}
          {points.map((point) => point.horizon_angle_deg === null ? (
            <text key={point.azimuth_deg} x={x(point.azimuth_deg)} y={top + 18} textAnchor="middle">? Missing</text>
          ) : (
            <circle key={point.azimuth_deg} cx={x(point.azimuth_deg)} cy={y(point.horizon_angle_deg)} r={3} className="chart-point">
              <title>Terrain: {point.azimuth_deg}° azimuth, {point.horizon_angle_deg}° elevation</title>
            </circle>
          ))}
          {bodies.map(({ name, value }) => {
            if (value.azimuth_deg === null || value.elevation_deg === null) return null
            const cx = x(value.azimuth_deg)
            const cy = y(value.elevation_deg)
            return (
              <g key={name}>
                <title>{name}: {value.visibility}, azimuth {value.azimuth_deg}°, elevation {value.elevation_deg}°, clearance {value.clearance_deg ?? 'unknown'}°</title>
                {name === 'Sun'
                  ? <circle cx={cx} cy={cy} r={8} fill="#ffc247" stroke="#805000" strokeWidth={2} />
                  : <path d={`M ${cx} ${cy - 9} L ${cx + 9} ${cy} L ${cx} ${cy + 9} L ${cx - 9} ${cy} Z`} fill="#72baff" stroke="#164577" strokeWidth={2} />}
                <text x={cx + 14} y={cy - 13}>{name} · {value.visibility}</text>
              </g>
            )
          })}
          <text x={left} y={24}>Elevation (°)</text>
          <text x={(left + right) / 2} y={bottom + 60} textAnchor="middle">Azimuth (°) · true local north</text>
        </svg>
      </div>
      <p className="mt-4 font-mono text-xs leading-6 text-muted">Sand line: terrain · Circle: Sun · Diamond: Earth · Dashed line: 0° elevation.</p>
      {bodies.filter(({ value }) => value.elevation_deg === null || value.azimuth_deg === null)
        .map(({ name }) => <p className="mt-3 text-sm text-unknown" key={name}>{name} position unavailable at this time; no marker is drawn.</p>)}
      <p className="mt-3 text-xs text-muted">Sample data: sparse, synthetic terrain. Lines between known points are illustrative.</p>
    </Panel>
  )
}
