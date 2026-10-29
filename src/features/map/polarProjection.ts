/** Spherical lunar south polar stereographic display, 0° longitude up.
 * Native source raster uses a lunar-sphere polar grid (R=1,737,400 m).
 * extent is the projected radius in metres; x/y are percentages of the square.
 */
export const lunarRadiusM = 1737400
export function polarPosition(latitude: number, longitude: number, extent: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !Number.isFinite(extent)
    || extent <= 0 || latitude < -90 || latitude > 0 || longitude < -180 || longitude > 180) return null
  const radius = 2 * lunarRadiusM * Math.tan((90 + latitude) * Math.PI / 360)
  if (radius > extent) return null
  const radians = longitude * Math.PI / 180
  return { x: 50 + 40 * radius / extent * Math.sin(radians), y: 50 - 40 * radius / extent * Math.cos(radians) }
}
export function polarCoordinates(x: number, y: number, extent: number) {
  const east = (x - 50) / 40 * extent
  const north = (50 - y) / 40 * extent
  const radius = Math.hypot(east, north)
  if (radius > extent) return null
  return { latitude: -90 + 360 / Math.PI * Math.atan(radius / (2 * lunarRadiusM)), longitude: radius === 0 ? 0 : Math.atan2(east, north) * 180 / Math.PI }
}
