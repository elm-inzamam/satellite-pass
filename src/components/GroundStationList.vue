<script setup lang="ts">
import { useGroundStation } from '@/composables/useGroundStation'
import type { GroundStation } from '@/types'

const emit = defineEmits<{ edit: [station: GroundStation] }>()

const { stations, deleteStation } = useGroundStation()

async function handleDelete(id: number | undefined) {
  if (!id || !confirm('Delete this ground station?')) return
  await deleteStation(id)
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="bg-gray-100 text-left">
          <th class="px-3 py-2 font-medium">Name</th>
          <th class="px-3 py-2 font-medium">Latitude</th>
          <th class="px-3 py-2 font-medium">Longitude</th>
          <th class="px-3 py-2 font-medium">Altitude (m)</th>
          <th class="px-3 py-2 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in stations" :key="s.id" class="border-t hover:bg-gray-50">
          <td class="px-3 py-2">{{ s.name }}</td>
          <td class="px-3 py-2 text-gray-500">{{ s.latitude }}</td>
          <td class="px-3 py-2 text-gray-500">{{ s.longitude }}</td>
          <td class="px-3 py-2 text-gray-500">{{ s.altitude }}</td>
          <td class="px-3 py-2 space-x-2">
            <button @click="emit('edit', s)" class="text-blue-600 hover:text-blue-800 text-xs font-medium">
              Edit
            </button>
            <button @click="handleDelete(s.id)" class="text-red-600 hover:text-red-800 text-xs font-medium">
              Delete
            </button>
          </td>
        </tr>
        <tr v-if="stations && stations.length === 0">
          <td colspan="5" class="px-3 py-8 text-center text-gray-400">No ground stations registered yet.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
