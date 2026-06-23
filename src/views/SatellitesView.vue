<script setup lang="ts">
import TleUploader from '@/components/TleUploader.vue'
import SatelliteList from '@/components/SatelliteList.vue'
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Satellites</h1>
    <TleUploader />
    <SatelliteList />
  </div>
</template>
