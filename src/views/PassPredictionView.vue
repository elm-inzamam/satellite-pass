<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSatellite } from '@/composables/useSatellite'
import { useGroundStation } from '@/composables/useGroundStation'
import { usePassPrediction } from '@/composables/usePassPrediction'
import { setPassDetail } from '@/stores/passDetailStore'
import PassResultsTable from '@/components/PassResultsTable.vue'
import type { PassEvent, Satellite, GroundStation } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const { satellites } = useSatellite()
const { stations } = useGroundStation()
const { calculatePasses } = usePassPrediction()

const selectedSatelliteId = ref<number | null>(null)
const selectedStationId = ref<number | null>(null)
const startTime = ref(dayjs().format('YYYY-MM-DDTHH:mm'))
const endTime = ref(dayjs().add(1, 'day').format('YYYY-MM-DDTHH:mm'))

const passes = ref<PassEvent[]>([])
const loading = ref(false)
const selectedPassIndex = ref<number | null>(null)

const satOptions = computed(() => {
  const list = satellites.value as Satellite[] | undefined
  if (!list) return []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

const stationOptions = computed(() => {
  return stations.value ?? []
})

function getSelectedSatellite(): Satellite | null {
  const list = satellites.value as Satellite[] | undefined
  return list?.find((s) => s.id === selectedSatelliteId.value) ?? null
}

function getSelectedStation(): GroundStation | null {
  const list = stations.value
  return list?.find((s) => s.id === selectedStationId.value) ?? null
}

function compute() {
  const sat = getSelectedSatellite()
  const station = getSelectedStation()
  if (!sat || !station) return

  const start = new Date(startTime.value)
  const end = new Date(endTime.value)

  if (end.getTime() - start.getTime() > 7 * 24 * 60 * 60 * 1000) {
    alert('Time range is limited to 7 days.')
    return
  }

  loading.value = true
  passes.value = []
  selectedPassIndex.value = null

  setTimeout(() => {
    passes.value = calculatePasses(sat, station, start, end)
    loading.value = false
  }, 50)
}

onMounted(() => {
  const satId = route.query.satId
  if (satId) {
    const id = parseInt(satId as string, 10)
    if (!isNaN(id)) {
      selectedSatelliteId.value = id
    }
  }
  const stationId = route.query.stationId
  if (stationId) {
    const id = parseInt(stationId as string, 10)
    if (!isNaN(id)) {
      selectedStationId.value = id
    }
  }
})

function handleSelectPass(index: number) {
  selectedPassIndex.value = index
  const sat = getSelectedSatellite()
  const station = getSelectedStation()
  const pass = passes.value[index]
  if (!sat || !station || !pass) return
  setPassDetail(sat, station, pass)
  router.push('/pass-detail')
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Pass Prediction</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Satellite</label>
        <select
          v-model.number="selectedSatelliteId"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option :value="null" disabled>Select satellite</option>
          <option v-for="s in satOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Ground Station</label>
        <select
          v-model.number="selectedStationId"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option :value="null" disabled>Select station</option>
          <option v-for="s in stationOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
        <input
          v-model="startTime"
          type="datetime-local"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">End Time</label>
        <input
          v-model="endTime"
          type="datetime-local"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <button
        @click="compute"
        :disabled="!selectedSatelliteId || !selectedStationId || loading"
        class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded text-sm font-medium transition-colors"
      >
        {{ loading ? 'Computing...' : 'Calculate Passes' }}
      </button>
    </div>

    <PassResultsTable
      :passes="passes"
      :loading="loading"
      :selected-index="selectedPassIndex"
      @select="handleSelectPass"
    />
  </div>
</template>
