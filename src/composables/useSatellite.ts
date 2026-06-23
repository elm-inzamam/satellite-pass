import {
  satellites,
  addSatellite as addSatStore,
  updateSatellite as updateSatStore,
  deleteSatellite as deleteSatStore,
  deleteSatellites as deleteSatsStore,
} from '@/db/store'
import { twoline2satrec } from 'satellite.js'

function parseTleEpoch(line1: string): Date {
  const epoch = line1.substring(18, 32).trim()
  const yearDigits = parseInt(epoch.substring(0, 2), 10)
  const day = parseFloat(epoch.substring(2))
  const year = yearDigits >= 57 ? 1900 + yearDigits : 2000 + yearDigits
  const jan1 = new Date(year, 0, 1)
  return new Date(jan1.getTime() + (day - 1) * 86400000)
}

export function useSatellite() {
  function parseMultiTle(text: string): Array<{ name: string; line1: string; line2: string }> {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0)
    const result: Array<{ name: string; line1: string; line2: string }> = []

    let i = 0
    while (i < lines.length) {
      if (i + 1 < lines.length && lines[i]!.startsWith('1 ') && lines[i + 1]!.startsWith('2 ')) {
        const noradId = lines[i]!.substring(2, 7).trim()
        result.push({ name: `Satellite ${noradId}`, line1: lines[i]!, line2: lines[i + 1]! })
        i += 2
      } else if (i + 2 < lines.length && lines[i + 1]!.startsWith('1 ') && lines[i + 2]!.startsWith('2 ')) {
        result.push({ name: lines[i]!, line1: lines[i + 1]!, line2: lines[i + 2]! })
        i += 3
      } else {
        i++
      }
    }

    return result
  }

  async function addSat(name: string, line1: string, line2: string): Promise<'added' | 'updated' | 'skipped'> {
    const satrec = twoline2satrec(line1, line2)
    if (satrec.error) {
      throw new Error('Invalid TLE data')
    }

    const noradId = parseInt(line1.substring(2, 7).trim(), 10)
    const incomingEpoch = parseTleEpoch(line1)

    const existing = satellites.value.find((s) => s.noradId === noradId)
    if (existing) {
      const existingEpoch = parseTleEpoch(existing.tleLine1)
      if (incomingEpoch > existingEpoch) {
        updateSatStore(existing.id!, { name, tleLine1: line1, tleLine2: line2 })
        return 'updated'
      }
      return 'skipped'
    }

    addSatStore({ name, noradId, tleLine1: line1, tleLine2: line2 })
    return 'added'
  }

  async function addSatellites(
    entries: Array<{ name: string; line1: string; line2: string }>
  ): Promise<{ added: number; updated: number; skipped: number; failed: number }> {
    let added = 0
    let updated = 0
    let skipped = 0
    let failed = 0
    for (const entry of entries) {
      try {
        const result = await addSat(entry.name, entry.line1, entry.line2)
        if (result === 'added') added++
        else if (result === 'updated') updated++
        else skipped++
      } catch {
        failed++
      }
    }
    return { added, updated, skipped, failed }
  }

  async function deleteSatellite(id: number): Promise<void> {
    deleteSatStore(id)
  }

  async function deleteSatellites(ids: number[]): Promise<void> {
    deleteSatsStore(ids)
  }

  return { satellites, parseMultiTle, addSatellite: addSat, addSatellites, deleteSatellite, deleteSatellites }
}
