import { createRouter, createWebHistory } from 'vue-router'

//Rutas
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('../views/RegistroView.vue')
  },
  {
    path: '/mascotas',
    name: 'mascotas',
    // Este será nuestro contenedor principal que consumirá el BFF!!!!!
    component: () => import('../views/MascotasView.vue')
  },
  {
    path: '/reportar',
    name: 'reportar',
    component: () => import('../views/ReportarView.vue')
  },
  {
    path: '/detalle/:id',
    name: 'mascota-detalle',
    component: () => import('../views/DetalleMascotaView.vue'),
    props: true
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('../views/PerfilView.vue'),
    meta: { requiresAuth: true } 
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router