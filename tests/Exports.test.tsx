import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockMissionData } from '../src/data/mockMissionData'
import * as exports from '../src/features/exports/exportAnalysis'
import { ExportControls } from '../src/features/exports/ExportControls'

afterEach(() => { cleanup(); vi.restoreAllMocks() })
const range = { start_utc: mockMissionData[0].window.start_utc, end_utc: mockMissionData[0].window.end_utc }
// Independent RFC-style parser: checks quoted commas, quotes and embedded newlines.
function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = [], value = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++ } else quoted = !quoted
    } else if (char === ',' && !quoted) { row.push(value); value = '' }
    else if (char === '\r' && text[i + 1] === '\n' && !quoted) { row.push(value); rows.push(row); row = []; value = ''; i++ }
    else value += char
  }
  const [headers, ...records] = rows
  return records.map((record) => Object.fromEntries(headers.map((key, index) => [key, record[index]])))
}
it('round-trips JSON without losing zero, nulls, original brackets or provenance', () => {
  const file = JSON.parse(JSON.stringify(exports.buildExport(mockMissionData, range, 'comparison')))
  expect(file.scope.site_ids).toEqual(['sample-a', 'sample-b'])
  expect(file.sites[0].records[2].sample.sun.clearance_deg).toBe(0)
  expect(file.sites[1].records[1].sample.earth.clearance_deg).toBeNull()
  expect(file.sites[1].records[1].sample.earth.visibility).toBe('unknown')
  expect(file.sites[0].records[0].sample.sun.next_obstruction.bracket_start_utc).toBe('2026-11-14T19:00:00Z')
  expect(file.sites[0].site.suitability).toBeNull()
  expect(file.sites[0].provenance).toEqual(mockMissionData[0].provenance)
  expect(file.sites[0].provenance.data_status).toBe('sample')
})
it('CSV round-trips units, zeros, nulls, metadata and CSV quoting independently', () => {
  const sites = structuredClone(mockMissionData)
  sites[0].provenance.dataset_source = 'Source, "quoted"\nnext line'
  sites[1].samples[1].earth.quality_flags = ['test_missing_geometry']
  const rows = parseCsv(exports.serializeCsv(exports.buildExport(sites, range, 'comparison')))
  expect(rows).toHaveLength(16)
  const zero = rows.find((row) => row.site_id === 'sample-a' && row.utc === '2026-11-14T20:00:00Z' && row.body === 'sun')!
  const unknown = rows.find((row) => row.site_id === 'sample-b' && row.utc === '2026-11-14T19:00:00Z' && row.body === 'earth')!
  expect(zero.clearance_deg).toBe('0')
  expect(unknown.clearance_deg).toBe('null')
  expect(unknown.visibility).toBe('unknown')
  expect(zero.elevation_deg).toBe('1')
  expect(zero.azimuth_deg).toBe('90')
  expect(JSON.parse(unknown.body_quality_flags_json)).toEqual(['test_missing_geometry'])
  expect(JSON.parse(zero.provenance_json).dataset_source).toBe('Source, "quoted"\nnext line')
  expect(zero.data_status).toBe('sample')
  expect(JSON.parse(zero.definitions_json).missing).toContain('never zero')
})
it('filters selected site and period and retains absent slots and incomplete records', () => {
  const site = structuredClone(mockMissionData[1])
  site.samples.splice(2, 1)
  const filtered = { start_utc: '2026-11-14T19:00:00Z', end_utc: '2026-11-14T20:00:00Z' }
  const file = exports.buildExport([site], filtered, 'selected-site')
  expect(file.sites).toHaveLength(1)
  expect(file.sites[0].records).toHaveLength(2)
  expect(file.sites[0].records[0].sample?.earth.visibility).toBe('unknown')
  expect(file.sites[0].records[1].sample_present).toBe(false)
  expect(file.sites[0].records[1].sample).toBeNull()
  expect(file.sites[0].comparison_metrics.recorded).toBe(1)
  expect(file.sites[0].comparison_metrics.total).toBe(2)
  const rows = parseCsv(exports.serializeCsv(file))
  expect(rows.filter((row) => row.sample_present === 'false')).toHaveLength(2)
  expect(exports.exportFilename(file, 'json')).toBe('astronexus_sample-b_2026-11-14T190000Z_to_2026-11-14T200000Z.json')
})
it('validates invalid or empty scopes', () => {
  expect(() => exports.buildExport([], range, 'comparison')).toThrow()
  expect(() => exports.buildExport(mockMissionData, range, 'selected-site')).toThrow()
  expect(() => exports.buildExport(mockMissionData, { start_utc: range.end_utc, end_utc: range.start_utc }, 'comparison')).toThrow()
})
it('matches visible scope and announces failures instead of reporting successful downloads', async () => {
  const save = vi.spyOn(exports, 'downloadExport').mockImplementation(() => {})
  render(<ExportControls analyses={mockMissionData} selectedSiteId="sample-a" range={range} />)
  await userEvent.click(screen.getByRole('button', { name: 'Export Analysis JSON' }))
  expect(save.mock.calls[0][0].scope.site_ids).toEqual(['sample-a'])
  await userEvent.click(screen.getByRole('radio', { name: 'All comparison sites' }))
  await userEvent.click(screen.getByRole('button', { name: 'Download CSV' }))
  expect(save.mock.calls[1][0].scope.site_ids).toEqual(['sample-a', 'sample-b'])
  save.mockImplementation(() => { throw new Error('Download unavailable') })
  await userEvent.click(screen.getByRole('button', { name: 'Download CSV' }))
  expect(screen.getByRole('alert').textContent).toContain('Export failed: Download unavailable')
})
