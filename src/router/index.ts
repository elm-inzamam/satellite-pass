import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'

const router = createRouter({
  history: createWebHashHistory(),
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
    {
      path: '/sky-view',
      name: 'sky-view',
      component: () => import('@/views/SkyView.vue'),
    },
  ],
})

export default router
