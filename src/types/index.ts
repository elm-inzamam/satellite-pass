export interface Satellite {
  id?: number
  name: string
  noradId: number
  tleLine1: string
  tleLine2: string
  createdAt: Date
}

export interface GroundStation {
  id?: number
  name: string
  latitude: number
  longitude: number
  altitude: number
  createdAt: Date
}

export interface PassTrajectoryPoint {
  relativeTimeSec: number
  azimuth: number
  elevation: number
  range: number
  tlookang: number
  rlookang: number
  latitude: number
  longitude: number
  height: number
}

export interface SkyPosition {
  satelliteId: number
  name: string
  noradId: number
  azimuth: number
  elevation: number
  range: number
}

export interface PassEvent {
  aos: Date
  los: Date
  durationSec: number
  maxElevation: number
  aosAzimuth: number
  losAzimuth: number
  culminationTime: Date
}
