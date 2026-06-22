<script setup lang="ts">
import { ref, watch } from 'vue'
import { useGroundStation } from '@/composables/useGroundStation'
import type { GroundStation } from '@/types'

const props = defineProps<{
  station?: GroundStation | null
}>()

const emit = defineEmits<{ saved: [] }>()

const { addStation, updateStation } = useGroundStation()

const name = ref('')
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const altitude = ref<number | null>(null)
const saving = ref(false)
const error = ref('')

watch(() => props.station, (s) => {
  if (s) {
    name.value = s.name
    latitude.value = s.latitude
    longitude.value = s.longitude
    altitude.value = s.altitude
  } else {
    name.value = ''
    latitude.value = null
    longitude.value = null
    altitude.value = null
  }
}, { immediate: true })

async function handleSave() {
  error.value = ''
  if (!name.value.trim()) { error.value = 'Name is required'; return }
  if (latitude.value === null || latitude.value < -90 || latitude.value > 90) { error.value = 'Latitude must be between -90 and 90'; return }
  if (longitude.value === null || longitude.value < -180 || longitude.value > 180) { error.value = 'Longitude must be between -180 and 180'; return }
  if (altitude.value === null || altitude.value < 0) { error.value = 'Altitude must be 0 or more'; return }

  saving.value = true
  try {
    if (props.station?.id) {
      await updateStation(props.station.id, { name: name.value.trim(), latitude: latitude.value, longitude: longitude.value, altitude: altitude.value })
    } else {
      await addStation({ name: name.value.trim(), latitude: latitude.value, longitude: longitude.value, altitude: altitude.value })
    }
    name.value = ''
    latitude.value = null
    longitude.value = null
    altitude.value = null
    emit('saved')
  } catch {
    error.value = 'Failed to save'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSave" class="space-y-3 bg-white border rounded p-4">
    <h3 class="font-medium text-sm">{{ station ? 'Edit Ground Station' : 'Add Ground Station' }}</h3>

    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input v-model="name" type="text" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Latitude (-90 to 90)</label>
        <input v-model.number="latitude" type="number" step="any" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Longitude (-180 to 180)</label>
        <input v-model.number="longitude" type="number" step="any" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Altitude (m)</label>
        <input v-model.number="altitude" type="number" step="any" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
    </div>

    <div v-if="error" class="text-red-600 text-xs">{{ error }}</div>

    <div class="flex gap-2">
      <button type="submit" :disabled="saving" class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
        {{ saving ? 'Saving...' : station ? 'Update' : 'Add' }}
      </button>
    </div>
  </form>
</template>
