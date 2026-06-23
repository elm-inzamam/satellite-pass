import { twoline2satrec, propagate, gstime, eciToEcf, ecfToLookAngles } from 'satellite.js'
import type { Satellite, GroundStation, SkyPosition, PassTrajectoryPoint } from '@/types'

const STEP_MS = 10 * 1000

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI)
}

function getObserverGd(station: GroundStation) {
  return {
    latitude: toRad(station.latitude),
    longitude: toRad(station.longitude),
    height: station.altitude / 1000,
  }
}

function computeLookAngles(satrec: ReturnType<typeof twoline2satrec>, observerGd: ReturnType<typeof getObserverGd>, date: Date) {
  const state = propagate(satrec, date)
  if (state === null) return null
  const gmst = gstime(date)
  const positionEcf = eciToEcf(state.position, gmst)
  return ecfToLookAngles(observerGd, positionEcf)
}

export function useSkyView() {
  function computePositions(
    satellites: Satellite[],
    station: GroundStation,
    time: Date,
    minElevation = 0
  ): SkyPosition[] {
    const observerGd = getObserverGd(station)
    const positions: SkyPosition[] = []

    for (const sat of satellites) {
      if (!sat.tleLine1 || !sat.tleLine2) continue
      const satrec = twoline2satrec(sat.tleLine1, sat.tleLine2)
      if (satrec.error) continue

      const lookAngles = computeLookAngles(satrec, observerGd, time)
      if (!lookAngles) continue

      const elevation = toDeg(lookAngles.elevation)
      if (elevation < minElevation) continue

      positions.push({
        satelliteId: sat.id!,
        name: sat.name,
        noradId: sat.noradId,
        azimuth: Math.round(toDeg(lookAngles.azimuth) * 10) / 10,
        elevation: Math.round(elevation * 10) / 10,
        range: Math.round(lookAngles.rangeSat * 100) / 100,
      })
    }

    positions.sort((a, b) => b.elevation - a.elevation)
    return positions
  }

  function computeCurrentPass(
    satellite: Satellite,
    station: GroundStation,
    time: Date,
    maxLookMinutes = 180
  ): {
    visible: boolean
    aos: Date | null
    los: Date | null
    trajectory: PassTrajectoryPoint[]
    currentAzimuth: number
    currentElevation: number
  } | null {
    if (!satellite.tleLine1 || !satellite.tleLine2) return null

    const satrec = twoline2satrec(satellite.tleLine1, satellite.tleLine2)
    if (satrec.error) return null

    const observerGd = getObserverGd(station)
    const timeMs = time.getTime()

    const lookAnglesNow = computeLookAngles(satrec, observerGd, time)
    if (!lookAnglesNow) return null

    const currentEl = toDeg(lookAnglesNow.elevation)
    const currentAz = toDeg(lookAnglesNow.azimuth)

    if (currentEl <= 0) {
      return { visible: false, aos: null, los: null, trajectory: [], currentAzimuth: 0, currentElevation: 0 }
    }

    const maxLookMs = maxLookMinutes * 60 * 1000

    let aosMs = timeMs
    for (let t = timeMs; t >= timeMs - maxLookMs; t -= STEP_MS) {
      const lookAngles = computeLookAngles(satrec, observerGd, new Date(t))
      if (!lookAngles || toDeg(lookAngles.elevation) <= 0) {
        aosMs = t
        break
      }
      aosMs = t
    }

    let losMs = timeMs
    for (let t = timeMs; t <= timeMs + maxLookMs; t += STEP_MS) {
      const lookAngles = computeLookAngles(satrec, observerGd, new Date(t))
      if (!lookAngles || toDeg(lookAngles.elevation) <= 0) {
        losMs = t
        break
      }
      losMs = t
    }

    const trajectory: PassTrajectoryPoint[] = []
    for (let t = aosMs; t <= losMs; t += STEP_MS) {
      const date = new Date(t)
      const lookAngles = computeLookAngles(satrec, observerGd, date)
      if (!lookAngles) continue
      const relSec = Math.round(((t - aosMs) / 1000) * 10) / 10
      trajectory.push({
        relativeTimeSec: relSec,
        azimuth: Math.round(toDeg(lookAngles.azimuth) * 10) / 10,
        elevation: Math.round(toDeg(lookAngles.elevation) * 10) / 10,
        range: 0, tlookang: 0, rlookang: 0, latitude: 0, longitude: 0, height: 0,
      })
    }

    return {
      visible: true,
      aos: new Date(aosMs),
      los: new Date(losMs),
      trajectory,
      currentAzimuth: Math.round(currentAz * 10) / 10,
      currentElevation: Math.round(currentEl * 10) / 10,
    }
  }

  return { computePositions, computeCurrentPass }
}
