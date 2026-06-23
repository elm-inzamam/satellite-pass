<script setup lang="ts">
import { computed } from 'vue'
import type { PassTrajectoryPoint } from '@/types'

const props = defineProps<{
  points: PassTrajectoryPoint[]
}>()

const SIZE = 240
const CX = SIZE / 2
const CY = SIZE / 2
const MAX_R = 100
const VIEWBOX = `0 0 ${SIZE} ${SIZE}`

function toCartesian(azimuthDeg: number, elevationDeg: number) {
  const angleRad = (azimuthDeg * Math.PI) / 180
  const r = ((90 - Math.max(0, elevationDeg)) / 90) * MAX_R
  return {
    x: CX + r * Math.sin(angleRad),
    y: CY - r * Math.cos(angleRad),
  }
}

const pathD = computed(() => {
  if (props.points.length < 2) return ''
  const parts = props.points.map((p) => {
    const { x, y } = toCartesian(p.azimuth, p.elevation)
    return `${x},${y}`
  })
  return 'M' + parts.join(' L')
})

const startPoint = computed(() => {
  if (!props.points.length) return null
  return toCartesian(props.points[0]!.azimuth, props.points[0]!.elevation)
})

const endPoint = computed(() => {
  if (!props.points.length) return null
  const last = props.points[props.points.length - 1]!
  return toCartesian(last.azimuth, last.elevation)
})

const maxElPoint = computed(() => {
  if (!props.points.length) return null
  let maxP = props.points[0]!
  for (const p of props.points) {
    if (p.elevation > maxP.elevation) maxP = p
  }
  return toCartesian(maxP.azimuth, maxP.elevation)
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

const elevationLabels = [
  { label: '0°', r: MAX_R },
  { label: '30°', r: (60 / 90) * MAX_R },
  { label: '60°', r: (30 / 90) * MAX_R },
]
</script>

<template>
  <svg :viewBox="VIEWBOX" class="w-full max-w-sm mx-auto">
    <circle :cx="CX" :cy="CY" :r="MAX_R" fill="none" stroke="#d1d5db" stroke-width="1" />
    <circle
      v-for="el in elevationLabels"
      :key="el.label"
      :cx="CX"
      :cy="CY"
      :r="el.r"
      fill="none"
      stroke="#e5e7eb"
      stroke-width="1"
      stroke-dasharray="3,3"
    />
    <text
      v-for="el in elevationLabels"
      :key="el.label + 't'"
      :x="CX + 3"
      :y="CY - el.r + 12"
      class="fill-gray-400 text-[10px]"
    >
      {{ el.label }}
    </text>

    <line
      v-for="c in cardinalLabels"
      :key="c.label"
      :x1="CX"
      :y1="CY"
      :x2="CX + MAX_R * Math.sin((c.az * Math.PI) / 180)"
      :y2="CY - MAX_R * Math.cos((c.az * Math.PI) / 180)"
      stroke="#e5e7eb"
      stroke-width="1"
    />
    <text
      v-for="c in cardinalLabels"
      :key="c.label + 'l'"
      :x="CX + (MAX_R + 14) * Math.sin((c.az * Math.PI) / 180)"
      :y="CY - (MAX_R + 14) * Math.cos((c.az * Math.PI) / 180) + 4"
      class="fill-gray-500 text-[11px]"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ c.label }}
    </text>

    <path v-if="pathD" :d="pathD" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

    <circle v-if="startPoint" :cx="startPoint.x" :cy="startPoint.y" r="5" fill="#22c55e" stroke="white" stroke-width="1.5" />
    <circle v-if="maxElPoint" :cx="maxElPoint.x" :cy="maxElPoint.y" r="5" fill="#3b82f6" stroke="white" stroke-width="1.5" />
    <circle v-if="endPoint" :cx="endPoint.x" :cy="endPoint.y" r="5" fill="#ef4444" stroke="white" stroke-width="1.5" />

    <circle :cx="CX" :cy="CY" r="2" fill="#6b7280" />
  </svg>
</template>
