import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

// Transpile the actual pure TypeScript selectors with the existing compiler;
// no browser or additional runtime dependency is needed for these regressions.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src')
const require = createRequire(import.meta.url)
const cache = new Map()
function load(relative) {
  const path = resolve(root, relative)
  if (cache.has(path)) return cache.get(path)
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  const module = { exports: {} }
  const localRequire = (name) => name.startsWith('.')
    ? load(resolve(dirname(path), `${name}.ts`)) : require(name)
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  cache.set(path, module.exports)
  return module.exports
}
const { comparisonState, comparisonGrid, siteSummary, bodyStatusReason, exploreSelection, formatUtc } = load('features/comparison/comparison.ts')
const { mockMissionData } = load('data/mockMissionData.ts')
const full = { start_utc: mockMissionData[0].window.start_utc, end_utc: mockMissionData[0].window.end_utc }
const times = comparisonGrid(mockMissionData, full)

for (const [sun, earth, expected] of [
  ['visible', 'visible', 'both'], ['visible', 'blocked', 'sun'],
  ['blocked', 'visible', 'earth'], ['blocked', 'blocked', 'neither'],
  ['unknown', 'visible', 'unknown'], ['visible', 'unknown', 'unknown'],
  ['unknown', 'unknown', 'unknown'], ['blocked', 'unknown', 'unknown'],
  ['unknown', 'blocked', 'unknown'],
]) test(`classifies ${sun} / ${earth}`, () => {
  assert.equal(comparisonState({ sun: { visibility: sun }, earth: { visibility: earth } }), expected)
})

test('absent timestamps remain unknown and stay in the shared denominator', () => {
  const site = structuredClone(mockMissionData[1])
  site.samples.splice(2, 1)
  const summary = siteSummary(site, full, comparisonGrid([site], full))
  assert.equal(summary.total, 4)
  assert.equal(summary.recorded, 3)
  assert.equal(summary.earthKnown, 2)
  assert.equal(comparisonState(summary.cells[2]), 'unknown')
})

test('shared summary agrees with fixture counts and supplied known coverage', () => {
  const expected = [{ sun: 2, earth: 3, known: 4, both: 1 }, { sun: 4, earth: 3, known: 3, both: 3 }]
  mockMissionData.forEach((site, index) => {
    const summary = siteSummary(site, full, times)
    for (const [key, value] of Object.entries(expected[index])) assert.equal(summary[key], value)
    assert.equal(100 * summary.known / summary.total, site.summary.coverage_percent)
    // The science-team duration summaries are intentionally unavailable.
    assert.equal(site.summary.sun_visible_percent, null)
    assert.equal(site.summary.earth_visible_percent, null)
  })
})

test('a second test-only date window replaces timestamps and changes metrics', () => {
  const site = structuredClone(mockMissionData[0])
  const second = site.samples.map((sample) => {
    const result = JSON.parse(JSON.stringify(sample).replaceAll('2026-11-14', '2026-11-15'))
    result.sun = { ...result.sun, visibility: 'blocked', clearance_deg: -0.2, elevation_deg: 0.8 }
    return result
  })
  site.samples.push(...second)
  site.window.end_utc = '2026-11-15T21:00:00Z'
  const nextRange = { start_utc: '2026-11-15T18:00:00Z', end_utc: site.window.end_utc }
  const oldSummary = siteSummary(site, full)
  const nextSummary = siteSummary(site, nextRange)
  assert.equal(nextSummary.total, 4)
  assert.equal(nextSummary.sun, 0)
  assert.notEqual(oldSummary.sun, nextSummary.sun)
  assert.ok(!JSON.stringify(nextSummary).includes(full.start_utc))
  assert.ok(!JSON.stringify(nextSummary.cells).includes('2026-11-14'))
})

test('unknown reasons distinguish missing timestamp from missing geometry', () => {
  assert.equal(bodyStatusReason(), 'unknown (no recorded sample)')
  assert.equal(bodyStatusReason(mockMissionData[1].samples[1].earth), 'unknown (horizon and body elevation unavailable)')
})

test('Explore Site preserves supported UTC and falls back for a missing UTC', () => {
  const site = structuredClone(mockMissionData[1])
  const utc = site.samples[1].utc
  assert.deepEqual(exploreSelection(site, full, utc), { keepsRange: true, keepsTime: true, utc })
  site.samples.splice(1, 1)
  assert.deepEqual(exploreSelection(site, full, utc), { keepsRange: true, keepsTime: false, utc: site.samples[0].utc })
  const unavailable = { start_utc: '2026-11-15T18:00:00Z', end_utc: '2026-11-15T21:00:00Z' }
  assert.equal(exploreSelection(site, unavailable, unavailable.start_utc).keepsRange, false)
})

test('UTC formatting removes zero milliseconds without altering the instant', () => {
  assert.equal(formatUtc('2026-11-14T19:00:00.000Z'), '2026-11-14T19:00:00Z')
})
