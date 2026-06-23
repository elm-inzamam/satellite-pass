import { ref, watch, type Ref } from 'vue'

export function useStorage<T>(key: string, defaultValue: T): Ref<T> {
  const stored = localStorage.getItem(key)
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue) as Ref<T>

  watch(
    data,
    (val) => {
      localStorage.setItem(key, JSON.stringify(val))
    },
    { deep: true }
  )

  window.addEventListener('storage', (e) => {
    if (e.key === key && e.newValue) {
      data.value = JSON.parse(e.newValue)
    }
  })

  return data
}
