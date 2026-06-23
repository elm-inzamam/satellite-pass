import { twoline2satrec, propagate, gstime, eciToEcf, eciToGeodetic, ecfToLookAngles } from 'satellite.js'
import type { Satellite, GroundStation, PassEvent, PassTrajectoryPoint } from '@/types'

const STEP_SECONDS = 10
const MIN_PASS_DURATION_SEC = 30
const TRAJECTORY_STEP_SECONDS = 0.2

type PassSample = { time: Date; elevation: number; azimuth: number }

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI)
}

export function usePassPrediction() {
  function calculatePasses(
    satellite: Satellite,
    station: GroundStation,
    startTime: Date,
    endTime: Date
  ): PassEvent[] {
    const satrec = twoline2satrec(satellite.tleLine1, satellite.tleLine2)

    const observerGd = {
      latitude: toRad(station.latitude),
      longitude: toRad(station.longitude),
      height: station.altitude / 1000,
    }

    const raw: PassSample[] = []
    const startMs = startTime.getTime()
    const endMs = endTime.getTime()

    for (let t = startMs; t <= endMs; t += STEP_SECONDS * 1000) {
      const date = new Date(t)
      const state = propagate(satrec, date)
      if (state === null) continue

      const gmst = gstime(date)
      const positionEcf = eciToEcf(state.position, gmst)
      const lookAngles = ecfToLookAngles(observerGd, positionEcf)

      raw.push({
        time: date,
        elevation: toDeg(lookAngles.elevation),
        azimuth: toDeg(lookAngles.azimuth),
      })
    }

    const passes: PassEvent[] = []
    let passSamples: typeof raw = []

    for (const sample of raw) {
      if (sample.elevation > 0) {
        passSamples.push(sample)
      } else {
        if (passSamples.length > 0) {
          const ev = buildPass(passSamples)
          if (ev.durationSec >= MIN_PASS_DURATION_SEC) {
            passes.push(ev)
          }
          passSamples = []
        }
      }
    }

    if (passSamples.length > 0) {
      const ev = buildPass(passSamples)
      if (ev.durationSec >= MIN_PASS_DURATION_SEC) {
        passes.push(ev)
      }
    }

    return passes
  }

  function buildPass(samples: PassSample[]): PassEvent {
    const aos = samples[0]!.time
    const los = samples[samples.length - 1]!.time
    const durationSec = Math.round((los.getTime() - aos.getTime()) / 1000)

    let maxEl = -90
    let maxElSample = samples[0]!
    for (const s of samples) {
      if (s.elevation > maxEl) {
        maxEl = s.elevation
        maxElSample = s
      }
    }

    return {
      aos,
      los,
      durationSec,
      maxElevation: Math.round(maxEl * 10) / 10,
      aosAzimuth: Math.round(samples[0]!.azimuth * 10) / 10,
      losAzimuth: Math.round(samples[samples.length - 1]!.azimuth * 10) / 10,
      culminationTime: maxElSample.time,
    }
  }

  function calculatePassTrajectory(
    satellite: Satellite,
    station: GroundStation,
    aos: Date,
    los: Date
  ): PassTrajectoryPoint[] {
    const satrec = twoline2satrec(satellite.tleLine1, satellite.tleLine2)

    const observerGd = {
      latitude: toRad(station.latitude),
      longitude: toRad(station.longitude),
      height: station.altitude / 1000,
    }

    const points: PassTrajectoryPoint[] = []
    const aosMs = aos.getTime()
    const losMs = los.getTime()
    const stepMs = TRAJECTORY_STEP_SECONDS * 1000

    for (let t = aosMs; t <= losMs; t += stepMs) {
      const date = new Date(t)
      const state = propagate(satrec, date)
      if (state === null) continue

      const gmst = gstime(date)
      const positionEcf = eciToEcf(state.position, gmst)
      const lookAngles = ecfToLookAngles(observerGd, positionEcf)
      const geodetic = eciToGeodetic(state.position, gmst)

      const relSec = Math.round(((t - aosMs) / 1000) * 10) / 10
      const az = toDeg(lookAngles.azimuth)
      const el = toDeg(lookAngles.elevation)

      points.push({
        relativeTimeSec: relSec,
        azimuth: Math.round(az * 10) / 10,
        elevation: Math.round(el * 10) / 10,
        range: Math.round(lookAngles.rangeSat * 100) / 100,
        tlookang: Math.round(el * 10) / 10,
        rlookang: 0,
        latitude: Math.round(toDeg(geodetic.latitude) * 100) / 100,
        longitude: Math.round(toDeg(geodetic.longitude) * 100) / 100,
        height: Math.round(geodetic.height * 1000 * 100) / 100,
      })
    }

    return points
  }

  return { calculatePasses, calculatePassTrajectory }
}
