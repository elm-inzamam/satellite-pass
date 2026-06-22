<script setup lang="ts">
import { useSatellite } from '@/composables/useSatellite'
import { useGroundStation } from '@/composables/useGroundStation'
import { RouterLink } from 'vue-router'

const { satellites } = useSatellite()
const { stations } = useGroundStation()

const satCount = () => satellites.value?.length ?? 0
const stationCount = () => stations.value?.length ?? 0
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <p class="text-gray-500 text-sm">Manage satellites, ground stations, and predict satellite passes.</p>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <RouterLink to="/satellites" class="block border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
        <div class="text-3xl font-bold text-blue-600">{{ satCount() }}</div>
        <div class="text-sm text-gray-500 mt-1">Satellites</div>
      </RouterLink>

      <RouterLink to="/ground-stations" class="block border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
        <div class="text-3xl font-bold text-green-600">{{ stationCount() }}</div>
        <div class="text-sm text-gray-500 mt-1">Ground Stations</div>
      </RouterLink>

      <RouterLink to="/pass-prediction" class="block border rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
        <div class="text-3xl font-bold text-purple-600">&rarr;</div>
        <div class="text-sm text-gray-500 mt-1">Predict Passes</div>
      </RouterLink>
    </div>
  </div>
</template>
