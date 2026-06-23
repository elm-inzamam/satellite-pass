<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSatellite } from '@/composables/useSatellite'
import { useGroundStation } from '@/composables/useGroundStation'
import { useSkyView } from '@/composables/useSkyView'
import SkyPolarPlot from '@/components/SkyPolarPlot.vue'
import type { SkyPosition, Satellite, PassTrajectoryPoint } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const { satellites } = useSatellite()
const { stations } = useGroundStation()
const { computePositions, computeCurrentPass } = useSkyView()

const selectedStationId = ref<number | null>(null)
const selectedSatelliteId = ref<number | null>(null)
const timeOffsetMin = ref(0)
const refreshRateMs = ref(1000)
const minElevation = ref(5)

const positions = ref<SkyPosition[]>([])
const passTrajectory = ref<PassTrajectoryPoint[]>([])
const passSelectedPos = ref<{ azimuth: number; elevation: number } | undefined>(undefined)
const trajectoryProgress = ref<number | undefined>(undefined)
const passInfo = ref<{
  aos: Date | null
  los: Date | null
  currentEl: number
  currentAz: number
} | null>(null)

let refreshTimer: ReturnType<typeof setInterval> | null = null

const stationOptions = computed(() => stations.value ?? [])
const satList = computed(() => (satellites.value as Satellite[] | undefined) ?? [])

const currentTimeLabel = ref('')

function getSelectedStation() {
  const list = stations.value
  return list?.find((s) => s.id === selectedStationId.value) ?? null
}

function getTime(): Date {
  return dayjs().add(timeOffsetMin.value, 'minute').toDate()
}

function formatTime(d: Date | null) {
  if (!d) return '—'
  return d.toLocaleTimeString()
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s}s`
}

function goLive() {
  timeOffsetMin.value = 0
  startRefresh()
}

function refresh() {
  const station = getSelectedStation()
  if (!station) {
    positions.value = []
    passTrajectory.value = []
    passSelectedPos.value = undefined
    trajectoryProgress.value = undefined
    passInfo.value = null
    return
  }

  const time = getTime()
  currentTimeLabel.value = time.toLocaleTimeString()

  positions.value = computePositions(satList.value, station, time, minElevation.value)

  if (selectedSatelliteId.value !== null) {
    const selectedSat = satList.value.find((s) => s.id === selectedSatelliteId.value)
    if (selectedSat) {
      const result = computeCurrentPass(selectedSat, station, time)
      if (result && result.visible) {
        passTrajectory.value = result.trajectory
        passSelectedPos.value = { azimuth: result.currentAzimuth, elevation: result.currentElevation }
        if (result.aos && result.los) {
          const totalMs = result.los.getTime() - result.aos.getTime()
          const elapsedMs = time.getTime() - result.aos.getTime()
          trajectoryProgress.value = totalMs > 0 ? Math.max(0, Math.min(1, elapsedMs / totalMs)) : 0
        } else {
          trajectoryProgress.value = undefined
        }
        passInfo.value = {
          aos: result.aos,
          los: result.los,
          currentEl: result.currentElevation,
          currentAz: result.currentAzimuth,
        }
      } else {
        passTrajectory.value = []
        passSelectedPos.value = undefined
        trajectoryProgress.value = undefined
        passInfo.value = null
      }
    }
  }
}

function startRefresh() {
  stopRefresh()
  refresh()
  refreshTimer = setInterval(refresh, refreshRateMs.value)
}

function stopRefresh() {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(refreshRateMs, () => {
  if (refreshTimer !== null) startRefresh()
})

function handleSelectSatellite(satelliteId: number) {
  if (selectedSatelliteId.value !== satelliteId) {
    selectedSatelliteId.value = satelliteId
  }
}

function goToPassPrediction(id: number) {
  const q: Record<string, string> = { satId: String(id) }
  if (selectedStationId.value !== null) {
    q.stationId = String(selectedStationId.value)
  }
  router.push({ path: '/pass-prediction', query: q })
}

onMounted(() => {
  if (stationOptions.value.length > 0) {
    selectedStationId.value = stationOptions.value[0]!.id!
  }
  startRefresh()
})

onUnmounted(() => {
  stopRefresh()
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Sky View</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Ground Station</label>
        <select v-model.number="selectedStationId" @change="startRefresh"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option :value="null" disabled>Select station</option>
          <option v-for="s in stationOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Ref Interval</label>
        <select v-model.number="refreshRateMs" @change="startRefresh"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option :value="500">0.5s</option>
          <option :value="1000">1s</option>
          <option :value="2000">2s</option>
          <option :value="5000">5s</option>
          <option :value="10000">10s</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Time Offset (minutes)</label>
        <div class="flex gap-1">
          <input v-model.number="timeOffsetMin" type="number" min="-120" max="120" step="1" @input="startRefresh"
            class="w-40 border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button @click="goLive"
            class="w-14 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
            :class="timeOffsetMin === 0 ? 'bg-blue-50 text-blue-700 border-blue-500' : 'bg-white text-gray-600'"
          ><span class="w-2 h-2 rounded-full inline-block" :class="timeOffsetMin === 0 ? 'bg-green-500' : 'bg-gray-500'"></span>Live</button>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Min El</label>
        <select v-model.number="minElevation" @change="startRefresh"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option :value="0">0°</option>
          <option :value="5">5°</option>
          <option :value="10">10°</option>
          <option :value="15">15°</option>
          <option :value="20">20°</option>
          <option :value="30">30°</option>
          <option :value="45">45°</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Time</label>
        <div class="px-3 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded">
          {{ currentTimeLabel || '—' }}
        </div>
      </div>
    </div>

    <div v-if="!selectedStationId" class="text-center py-8 text-gray-400">
      Select a ground station to view the sky.
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div class="lg:col-span-3 border rounded-lg bg-white p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sky Chart</h3>
          <SkyPolarPlot
            :positions="positions"
            :trajectory="passTrajectory"
            :trajectory-progress="trajectoryProgress"
            :selected-position="passSelectedPos"
            @select="handleSelectSatellite"
          />
          <div class="flex justify-center gap-3 mt-2 text-xs text-gray-500">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> 0-10°</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> 10-30°</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-green-500 inline-block"></span> 30-60°</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 60-90°</span>
            <span v-if="selectedSatelliteId" class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Selected</span>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-3">
          <div class="border rounded-lg bg-white p-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Visible Satellites
              <span class="font-normal text-gray-400 ml-1">({{ positions.length }})</span>
            </h3>
            <div v-if="!positions.length" class="text-center py-6 text-gray-400 text-sm">
              No satellites visible.
            </div>
            <div v-else class="overflow-y-auto max-h-72">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-500 text-xs">
                    <th class="pb-1 font-medium">Name</th>
                    <th class="pb-1 font-medium">El</th>
                    <th class="pb-1 font-medium">Az</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in positions" :key="p.satelliteId"
                    class="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                    :class="selectedSatelliteId === p.satelliteId ? 'bg-purple-50' : ''"
                    @click="handleSelectSatellite(p.satelliteId)"
                  >
                    <td class="py-1.5 pr-2 font-medium text-xs">{{ p.name }}</td>
                    <td class="py-1.5 pr-2 text-xs">{{ p.elevation }}°</td>
                    <td class="py-1.5 text-xs text-gray-500">{{ p.azimuth }}°</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="!selectedSatelliteId" class="border rounded-lg bg-white p-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Pass</h3>
            <p class="text-sm text-gray-400 text-center py-2">Click a satellite on the chart or list to see pass info.</p>
          </div>

          <div v-if="selectedSatelliteId && passInfo" class="border rounded-lg bg-white p-4">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Pass</h3>
            <div class="text-xs space-y-1.5">
              <div>AOS <span class="font-medium">{{ formatTime(passInfo.aos) }}</span> &middot; LOS <span class="font-medium">{{ formatTime(passInfo.los) }}</span> <span v-if="passInfo.aos && passInfo.los" class="text-gray-500">({{ formatDuration(Math.round((passInfo.los.getTime() - passInfo.aos.getTime()) / 1000)) }})</span></div>
              <div>El <span class="font-medium">{{ passInfo.currentEl }}°</span> &middot; Az <span class="font-medium">{{ passInfo.currentAz }}°</span></div>
              <div><button @click="goToPassPrediction(selectedSatelliteId!)" class="text-purple-600 hover:text-purple-800 font-medium text-xs">Predict passes &rarr;</button></div>
            </div>
          </div>

          <div v-else-if="selectedSatelliteId && !passInfo" class="border rounded-lg bg-white p-4">
            <p class="text-sm text-gray-400 text-center py-2">Satellite not currently visible</p>
          </div>
        </div>
      </div>

      <div class="text-xs text-gray-400 text-center">
        Hover a dot for details &middot; Click a satellite on chart or list to select it &middot; Click selected satellite name to predict passes
      </div>
    </template>
  </div>
</template>
