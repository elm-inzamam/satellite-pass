<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { detailSatellite, detailStation, detailPass } from '@/stores/passDetailStore'
import { usePassPrediction } from '@/composables/usePassPrediction'
import { useCsvExport } from '@/composables/useCsvExport'
import PolarPlot from '@/components/PolarPlot.vue'
import type { PassTrajectoryPoint } from '@/types'

const router = useRouter()
const { calculatePassTrajectory } = usePassPrediction()
const { generateCsv, downloadCsv } = useCsvExport()

const trajectory = ref<PassTrajectoryPoint[]>([])
const loading = ref(true)

onMounted(() => {
  const sat = detailSatellite.value
  const station = detailStation.value
  const pass = detailPass.value
  if (!sat || !station || !pass) {
    router.replace('/pass-prediction')
    return
  }
  trajectory.value = calculatePassTrajectory(sat, station, pass.aos, pass.los)
  loading.value = false
})

function formatTime(d: Date) {
  return d.toLocaleString()
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

const csvData = computed(() => {
  if (!trajectory.value.length) return ''
  return generateCsv(trajectory.value)
})

function handleDownload() {
  const sat = detailSatellite.value
  const pass = detailPass.value
  if (!sat || !pass) return
  const dateStr = pass.aos.toISOString().slice(0, 10).replace(/-/g, '')
  const name = sat.name.replace(/[^a-zA-Z0-9]/g, '_')
  downloadCsv(csvData.value, `${name}_${dateStr}.csv`)
}
</script>

<template>
  <div class="space-y-6">
    <button @click="router.back()" class="text-blue-600 hover:text-blue-800 text-sm">&larr; Back to Predictions</button>

    <div v-if="loading" class="text-center py-8 text-gray-500">Loading trajectory data...</div>

    <template v-if="!loading && detailSatellite && detailStation && detailPass">
      <h1 class="text-2xl font-bold">Pass Details</h1>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="border rounded-lg bg-white p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Satellite</h3>
          <p class="text-lg font-bold mt-1">{{ detailSatellite.name }}</p>
          <p class="text-sm text-gray-500">NORAD ID: {{ detailSatellite.noradId }}</p>
        </div>

        <div class="border rounded-lg bg-white p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ground Station</h3>
          <p class="text-lg font-bold mt-1">{{ detailStation.name }}</p>
          <p class="text-sm text-gray-500">
            {{ detailStation.latitude }}&deg;, {{ detailStation.longitude }}&deg;, {{ detailStation.altitude }}m
          </p>
        </div>
      </div>

      <div class="border rounded-lg bg-white p-4">
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pass Summary</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div><span class="text-gray-500">AOS:</span> {{ formatTime(detailPass.aos) }}</div>
          <div><span class="text-gray-500">LOS:</span> {{ formatTime(detailPass.los) }}</div>
          <div><span class="text-gray-500">Duration:</span> {{ formatDuration(detailPass.durationSec) }}</div>
          <div><span class="text-gray-500">Max Elevation:</span> {{ detailPass.maxElevation }}&deg;</div>
          <div><span class="text-gray-500">AOS Azimuth:</span> {{ detailPass.aosAzimuth }}&deg;</div>
          <div><span class="text-gray-500">LOS Azimuth:</span> {{ detailPass.losAzimuth }}&deg;</div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div class="border rounded-lg bg-white p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Polar View</h3>
          <PolarPlot :points="trajectory" />
          <div class="flex justify-center gap-4 mt-2 text-xs text-gray-500">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> AOS</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Max El</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> LOS</span>
          </div>
        </div>

        <div class="border rounded-lg bg-white p-4 flex flex-col items-center justify-center">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Export</h3>
          <p class="text-sm text-gray-500 mb-3">{{ trajectory.length }} data points</p>
          <button
            @click="handleDownload"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded text-sm font-medium transition-colors"
          >
            Download CSV
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
