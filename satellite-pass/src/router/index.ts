import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/satellites',
      name: 'satellites',
      component: () => import('@/views/SatellitesView.vue'),
    },
    {
      path: '/ground-stations',
      name: 'ground-stations',
      component: () => import('@/views/GroundStationsView.vue'),
    },
    {
      path: '/pass-prediction',
      name: 'pass-prediction',
      component: () => import('@/views/PassPredictionView.vue'),
    },
    {
      path: '/pass-detail',
      name: 'pass-detail',
      component: () => import('@/views/PassDetailView.vue'),
    },
  ],
})

export default router
