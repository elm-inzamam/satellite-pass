<script setup lang="ts">
import type { PassEvent } from '@/types'

defineProps<{
  passes: PassEvent[]
  loading: boolean
  selectedIndex: number | null
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

function formatTime(d: Date) {
  return d.toLocaleString()
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function formatAzimuth(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const i = Math.round(deg / 45) % 8
  return `${deg}° (${dirs[i]})`
}
</script>

<template>
  <div v-if="loading" class="text-center py-8 text-gray-500">Computing passes...</div>

  <div v-else-if="passes.length === 0" class="text-center py-8 text-gray-400">
    No passes found for the selected time range.
  </div>

  <div v-else class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-gray-100 text-left">
          <th class="px-3 py-2 font-medium">#</th>
          <th class="px-3 py-2 font-medium">AOS Time</th>
          <th class="px-3 py-2 font-medium">LOS Time</th>
          <th class="px-3 py-2 font-medium">Duration</th>
          <th class="px-3 py-2 font-medium">Max Elevation</th>
          <th class="px-3 py-2 font-medium">AOS Azimuth</th>
          <th class="px-3 py-2 font-medium">LOS Azimuth</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(p, i) in passes"
          :key="i"
          class="border-t cursor-pointer transition-colors"
          :class="i === selectedIndex ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'"
          @click="emit('select', i)"
        >
          <td class="px-3 py-2 text-gray-400 text-xs">{{ i + 1 }}</td>
          <td class="px-3 py-2 whitespace-nowrap">{{ formatTime(p.aos) }}</td>
          <td class="px-3 py-2 whitespace-nowrap">{{ formatTime(p.los) }}</td>
          <td class="px-3 py-2">{{ formatDuration(p.durationSec) }}</td>
          <td class="px-3 py-2 font-medium">{{ p.maxElevation }}°</td>
          <td class="px-3 py-2 text-gray-500">{{ formatAzimuth(p.aosAzimuth) }}</td>
          <td class="px-3 py-2 text-gray-500">{{ formatAzimuth(p.losAzimuth) }}</td>
        </tr>
      </tbody>
    </table>
    <div class="text-xs text-gray-400 mt-2">{{ passes.length }} pass(es) found — click a row to view details</div>
  </div>
</template>
