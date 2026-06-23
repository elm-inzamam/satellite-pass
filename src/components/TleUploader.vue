<script setup lang="ts">
import { ref } from 'vue'
import { useSatellite } from '@/composables/useSatellite'

const emit = defineEmits<{ imported: [] }>()

const { parseMultiTle, addSatellites } = useSatellite()

const text = ref('')
const parsed = ref<Array<{ name: string; line1: string; line2: string; selected: boolean }>>([])
const importing = ref(false)
const status = ref('')

function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    text.value = reader.result as string
    doParse()
  }
  reader.readAsText(file)
  input.value = ''
}

function doParse() {
  const entries = parseMultiTle(text.value)
  parsed.value = entries.map(e => ({ ...e, selected: true }))
  status.value = parsed.value.length ? `Found ${parsed.value.length} satellite(s)` : 'No valid TLE data found'
}

async function doImport() {
  const selected = parsed.value.filter(e => e.selected)
  if (!selected.length) return
  importing.value = true
  const result = await addSatellites(selected)
  const parts: string[] = []
  if (result.added) parts.push(`${result.added} added`)
  if (result.updated) parts.push(`${result.updated} updated`)
  if (result.skipped) parts.push(`${result.skipped} skipped (already current)`)
  if (result.failed) parts.push(`${result.failed} failed`)
  status.value = parts.join(', ') || 'No changes'
  parsed.value = []
  text.value = ''
  importing.value = false
  emit('imported')
}

function clearAll() {
  parsed.value = []
  text.value = ''
  status.value = ''
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-3 items-center">
      <label class="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
        Upload TLE File
        <input type="file" accept=".txt,.tle,.csv" class="hidden" @change="handleFile" />
      </label>
      <span class="text-gray-500 text-sm">or paste TLE data below:</span>
    </div>

    <textarea
      v-model="text"
      rows="6"
      class="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Paste TLE lines here (2 or 3 lines per satellite)..."
    ></textarea>

    <div class="flex gap-2">
      <button @click="doParse" :disabled="!text.trim()" class="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
        Parse
      </button>
      <button @click="clearAll" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors">
        Clear
      </button>
    </div>

    <div v-if="parsed.length" class="border rounded bg-white">
      <div class="p-2 bg-gray-50 border-b flex items-center gap-2">
        <input type="checkbox" :checked="parsed.every(e => e.selected)" @change="parsed.forEach(e => e.selected = ($event.target as HTMLInputElement).checked)" />
        <span class="text-sm font-medium">{{ parsed.length }} satellite(s) found</span>
      </div>
      <div class="max-h-48 overflow-y-auto">
        <label v-for="(entry, i) in parsed" :key="i" class="flex items-center gap-2 px-3 py-1.5 text-sm border-b last:border-0 hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" v-model="entry.selected" />
          <span>{{ entry.name }}</span>
        </label>
      </div>
      <div class="p-2 border-t">
        <button @click="doImport" :disabled="importing || !parsed.some(e => e.selected)" class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
          {{ importing ? 'Importing...' : 'Import Selected' }}
        </button>
      </div>
    </div>

    <div v-if="status" class="text-sm" :class="status.startsWith('Found') || status.startsWith('No') ? 'text-gray-600' : 'text-green-600'">
      {{ status }}
    </div>
  </div>
</template>
