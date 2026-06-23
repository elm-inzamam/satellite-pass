import { useStorage } from '@/composables/useStorage'
import type { Satellite, GroundStation } from '@/types'

export const satellites = useStorage<Satellite[]>('satellites', [])
export const groundStations = useStorage<GroundStation[]>('groundStations', [])

let nextSatId = 1
let nextGsId = 1

satellites.value.forEach((s) => {
  if (s.id && s.id >= nextSatId) nextSatId = s.id + 1
})
groundStations.value.forEach((s) => {
  if (s.id && s.id >= nextGsId) nextGsId = s.id + 1
})

export function addSatellite(sat: Omit<Satellite, 'id' | 'createdAt'>): Satellite {
  const newSat: Satellite = { ...sat, id: nextSatId++, createdAt: new Date() }
  satellites.value = [...satellites.value, newSat]
  return newSat
}

export function updateSatellite(id: number, data: Partial<Omit<Satellite, 'id' | 'createdAt'>>): void {
  satellites.value = satellites.value.map((s) =>
    s.id === id ? { ...s, ...data, createdAt: new Date() } : s
  )
}

export function deleteSatellite(id: number): void {
  satellites.value = satellites.value.filter((s) => s.id !== id)
}

export function deleteSatellites(ids: number[]): void {
  satellites.value = satellites.value.filter((s) => !ids.includes(s.id!))
}

export function addGroundStation(gs: Omit<GroundStation, 'id' | 'createdAt'>): GroundStation {
  const newGs: GroundStation = { ...gs, id: nextGsId++, createdAt: new Date() }
  groundStations.value = [...groundStations.value, newGs]
  return newGs
}

export function updateGroundStation(
  id: number,
  data: Partial<Omit<GroundStation, 'id' | 'createdAt'>>
): void {
  groundStations.value = groundStations.value.map((s) =>
    s.id === id ? { ...s, ...data } : s
  )
}

export function deleteGroundStation(id: number): void {
  groundStations.value = groundStations.value.filter((s) => s.id !== id)
}
