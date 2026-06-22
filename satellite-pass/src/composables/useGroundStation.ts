import { groundStations, addGroundStation, updateGroundStation, deleteGroundStation } from '@/db/store'
import type { GroundStation } from '@/types'

export function useGroundStation() {
  async function addStation(station: Omit<GroundStation, 'id' | 'createdAt'>): Promise<void> {
    addGroundStation(station)
  }

  async function updateStation(
    id: number,
    data: Partial<Omit<GroundStation, 'id' | 'createdAt'>>
  ): Promise<void> {
    updateGroundStation(id, data)
  }

  async function deleteStation(id: number): Promise<void> {
    deleteGroundStation(id)
  }

  return { stations: groundStations, addStation, updateStation, deleteStation }
}
