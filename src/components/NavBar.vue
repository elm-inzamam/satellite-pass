<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/satellites', label: 'Satellites' },
  { to: '/ground-stations', label: 'Ground Stations' },
  { to: '/pass-prediction', label: 'Pass Prediction' },
  { to: '/sky-view', label: 'Sky View' },
]
</script>

<template>
  <nav class="bg-gray-900 text-white shadow-lg">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between h-14">
        <div class="font-bold text-lg tracking-wide">
          <RouterLink to="/" class="hover:text-blue-400">
            Satellite Pass
          </RouterLink>
        </div>
        <div class="flex gap-1">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 rounded text-sm transition-colors"
            :class="route.path === link.to ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>
