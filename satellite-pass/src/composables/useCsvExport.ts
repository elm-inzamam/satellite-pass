import type { PassTrajectoryPoint } from '@/types'

export function useCsvExport() {
  function generateCsv(points: PassTrajectoryPoint[]): string {
    const header = [
      'time',
      'Range',
      'Azimuth',
      'Elevation',
      'Tlookang',
      'Rlookang',
      'latg',
      'lng',
      'h',
    ].join(',')

    const rows = points.map((p) =>
      [
        p.relativeTimeSec.toFixed(1),
        p.range.toFixed(2),
        p.azimuth.toFixed(1),
        p.elevation.toFixed(1),
        p.tlookang.toFixed(1),
        p.rlookang.toFixed(1),
        p.latitude.toFixed(4),
        p.longitude.toFixed(4),
        p.height.toFixed(2),
      ].join(',')
    )

    return [header, ...rows].join('\n')
  }

  function downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return { generateCsv, downloadCsv }
}
