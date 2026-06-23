<script setup lang="ts">
import { computed } from 'vue'
import type { SkyPosition, PassTrajectoryPoint } from '@/types'

const props = defineProps<{
  positions: SkyPosition[]
  trajectory?: PassTrajectoryPoint[]
  trajectoryProgress?: number
  selectedPosition?: { azimuth: number; elevation: number }
}>()

const emit = defineEmits<{
  select: [satelliteId: number]
}>()

const SIZE = 280
const CX = SIZE / 2
const CY = SIZE / 2
const MAX_R = 110
const VIEWBOX = `0 0 ${SIZE} ${SIZE}`

function toCartesian(azimuthDeg: number, elevationDeg: number) {
  const angleRad = (azimuthDeg * Math.PI) / 180
  const r = ((90 - Math.max(0, elevationDeg)) / 90) * MAX_R
  return { x: CX + r * Math.sin(angleRad), y: CY - r * Math.cos(angleRad) }
}

function elevationColor(el: number): string {
  if (el >= 60) return '#3b82f6'
  if (el >= 30) return '#22c55e'
  if (el >= 10) return '#f59e0b'
  return '#ef4444'
}

const plotted = computed(() =>
  props.positions.map((p) => {
    const { x, y } = toCartesian(p.azimuth, p.elevation)
    return { ...p, x, y, color: elevationColor(p.elevation) }
  })
)

const pastPath = computed(() => {
  if (!props.trajectory || props.trajectory.length < 2 || props.trajectoryProgress === undefined) return ''
  const prog = Math.max(0, Math.min(1, props.trajectoryProgress))
  const splitIdx = Math.floor(prog * (props.trajectory.length - 1))
  const points = props.trajectory.slice(0, splitIdx + 1)
  if (points.length < 2) return ''
  return 'M' + points.map((p) => {
    const { x, y } = toCartesian(p.azimuth, p.elevation)
    return `${x},${y}`
  }).join(' L')
})

const futurePath = computed(() => {
  if (!props.trajectory || props.trajectory.length < 2 || props.trajectoryProgress === undefined) return ''
  const prog = Math.max(0, Math.min(1, props.trajectoryProgress))
  const splitIdx = Math.floor(prog * (props.trajectory.length - 1))
  const points = props.trajectory.slice(splitIdx)
  if (points.length < 2) return ''
  return 'M' + points.map((p) => {
    const { x, y } = toCartesian(p.azimuth, p.elevation)
    return `${x},${y}`
  }).join(' L')
})

const selectedPos = computed(() => {
  if (!props.selectedPosition) return null
  return toCartesian(props.selectedPosition.azimuth, props.selectedPosition.elevation)
})

const cardinalLabels = [
  { label: 'N', az: 0 },
  { label: 'NE', az: 45 },
  { label: 'E', az: 90 },
  { label: 'SE', az: 135 },
  { label: 'S', az: 180 },
  { label: 'SW', az: 225 },
  { label: 'W', az: 270 },
  { label: 'NW', az: 315 },
]

const elevationRings = [
  { label: '0°', r: MAX_R },
  { label: '30°', r: (60 / 90) * MAX_R },
  { label: '60°', r: (30 / 90) * MAX_R },
]
</script>

<template>
  <svg :viewBox="VIEWBOX" class="w-full max-w-sm mx-auto">
    <defs>
      <radialGradient id="skyBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f0f9ff" />
        <stop offset="100%" stop-color="#f8fafc" />
      </radialGradient>
    </defs>

    <circle :cx="CX" :cy="CY" :r="MAX_R" fill="url(#skyBg)" stroke="#d1d5db" stroke-width="1" />

    <circle
      v-for="ring in elevationRings"
      :key="ring.label"
      :cx="CX" :cy="CY" :r="ring.r"
      fill="none" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="3,3"
    />
    <text v-for="ring in elevationRings" :key="ring.label + 't'"
      :x="CX + 3" :y="CY - ring.r + 12"
      class="fill-gray-400 text-[10px]"
    >
      {{ ring.label }}
    </text>

    <line v-for="c in cardinalLabels" :key="c.label"
      :x1="CX" :y1="CY"
      :x2="CX + MAX_R * Math.sin((c.az * Math.PI) / 180)"
      :y2="CY - MAX_R * Math.cos((c.az * Math.PI) / 180)"
      stroke="#e5e7eb" stroke-width="1"
    />
    <text v-for="c in cardinalLabels" :key="c.label + 'l'"
      :x="CX + (MAX_R + 16) * Math.sin((c.az * Math.PI) / 180)"
      :y="CY - (MAX_R + 16) * Math.cos((c.az * Math.PI) / 180) + 4"
      class="fill-gray-500 text-[11px]"
      text-anchor="middle" dominant-baseline="middle"
    >
      {{ c.label }}
    </text>

    <path v-if="pastPath" :d="pastPath" fill="none" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,3" stroke-linejoin="round" stroke-linecap="round" />
    <path v-if="futurePath" :d="futurePath" fill="none" stroke="#cf16f9" stroke-width="1" stroke-linejoin="round" stroke-linecap="round" />

    <circle :cx="CX" :cy="CY" r="2" fill="#6b7280" />

    <g v-for="p in plotted" :key="p.satelliteId" class="cursor-pointer" @click="emit('select', p.satelliteId)">
      <circle :cx="p.x" :cy="p.y" r="4" :fill="p.color" stroke="white" stroke-width="1.5" />
      <title>{{ p.name }} 
         NORAD: {{ p.noradId }} ""
         El: {{ p.elevation }}°
         Az: {{ p.azimuth }}°
         Range: {{ p.range.toLocaleString() }} km</title>
    </g>

    <g v-if="selectedPos">
      <circle :cx="selectedPos.x" :cy="selectedPos.y" r="8" fill="none" stroke="#a855f7" stroke-width="2" />
      <circle :cx="selectedPos.x" :cy="selectedPos.y" r="3.5" fill="#a855f7" stroke="white" stroke-width="1.5" />
    </g>
  </svg>
</template>
