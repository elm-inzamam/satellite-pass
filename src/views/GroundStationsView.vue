<script setup lang="ts">
import { ref } from 'vue'
import GroundStationForm from '@/components/GroundStationForm.vue'
import GroundStationList from '@/components/GroundStationList.vue'
import type { GroundStation } from '@/types'

const editingStation = ref<GroundStation | null>(null)

function startEdit(station: GroundStation) {
  editingStation.value = { ...station }
}

function onSaved() {
  editingStation.value = null
}

function onCancelEdit() {
  editingStation.value = null
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Ground Stations</h1>

    <GroundStationForm :station="editingStation" @saved="onSaved" />

    <div v-if="editingStation" class="text-sm">
      <button @click="onCancelEdit" class="text-gray-500 hover:text-gray-700">Cancel editing</button>
    </div>

    <GroundStationList @edit="startEdit" />
  </div>
</template>
