<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSatellite } from '@/composables/useSatellite'

const { satellites, deleteSatellite, deleteSatellites } = useSatellite()

const sortedSatellites = computed(() => {
  const list = satellites.value
  if (!list) return []
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
})

const selectedIds = ref<Set<number>>(new Set())

const allSelected = computed(() => {
  const list = sortedSatellites.value
  return list.length > 0 && list.every((s) => s.id !== undefined && selectedIds.value.has(s.id))
})

function toggleAll() {
  const list = sortedSatellites.value
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(list.map((s) => s.id!).filter((id) => id !== undefined))
  }
}

function toggleOne(id: number | undefined) {
  if (id === undefined) return
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

async function handleDelete(id: number | undefined) {
  if (!id || !confirm('Delete this satellite?')) return
  await deleteSatellite(id)
  selectedIds.value.delete(id)
}

async function handleBatchDelete() {
  const ids = Array.from(selectedIds.value)
  if (!ids.length || !confirm(`Delete ${ids.length} satellite(s)?`)) return
  await deleteSatellites(ids)
  selectedIds.value = new Set()
}
</script>

<template>
  <div>
    <div v-if="selectedIds.size > 0" class="flex items-center gap-3 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm">
      <span class="text-red-700 font-medium">{{ selectedIds.size }} selected</span>
      <button @click="handleBatchDelete" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors">
        Delete Selected
      </button>
      <button @click="selectedIds = new Set()" class="text-gray-500 hover:text-gray-700 text-xs">
        Cancel
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="px-3 py-2 w-8">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            </th>
            <th class="px-3 py-2 font-medium">Name</th>
            <th class="px-3 py-2 font-medium">NORAD ID</th>
            <th class="px-3 py-2 font-medium">Added</th>
            <th class="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sat in sortedSatellites" :key="sat.id" class="border-t hover:bg-gray-50">
            <td class="px-3 py-2">
              <input type="checkbox" :checked="sat.id !== undefined && selectedIds.has(sat.id)" @change="toggleOne(sat.id)" />
            </td>
            <td class="px-3 py-2">{{ sat.name }}</td>
            <td class="px-3 py-2 text-gray-500">{{ sat.noradId }}</td>
            <td class="px-3 py-2 text-gray-500 text-xs">{{ new Date(sat.createdAt).toLocaleDateString() }}</td>
            <td class="px-3 py-2">
              <button @click="handleDelete(sat.id)" class="text-red-600 hover:text-red-800 text-xs font-medium">
                Delete
              </button>
            </td>
          </tr>
          <tr v-if="sortedSatellites.length === 0">
            <td colspan="5" class="px-3 py-8 text-center text-gray-400">No satellites registered yet.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
