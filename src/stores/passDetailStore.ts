import { ref } from 'vue'
import type { Satellite, GroundStation, PassEvent } from '@/types'

export const detailSatellite = ref<Satellite | null>(null)
export const detailStation = ref<GroundStation | null>(null)
export const detailPass = ref<PassEvent | null>(null)

export function setPassDetail(sat: Satellite, station: GroundStation, pass: PassEvent) {
  detailSatellite.value = sat
  detailStation.value = station
  detailPass.value = pass
}
