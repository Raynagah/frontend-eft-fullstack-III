import { createRouter, createWebHistory } from 'vue-router'

// Rutas
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
    // Contenedor principal que consume el BFF
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
  },
  {
    path: '/notificaciones',
    name: 'notificaciones',
    component: () => import('../views/BandejaNotificacionesView.vue'),
    meta: { requiresAuth: true } // Requiere estar logueado para ver sus notificaciones
  },

  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/admin/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/admin/usuarios',
    name: 'admin-usuarios',
    component: () => import('../views/admin/UsuariosAdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/admin/usuarios/nuevo',
    name: 'admin-crear-usuario',
    component: () => import('../views/admin/CrearUsuarioView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/admin/usuarios/editar/:id',
    name: 'admin-editar-usuario',
    component: () => import('../views/admin/EditarUsuarioView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/admin/reportes',
    name: 'AdminReportes',
    component: () => import('../views/admin/ReportesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// ========================================================
// GUARDIÁN DE NAVEGACIÓN (Protección de rutas)
// ========================================================
router.beforeEach((to, from, next) => {
  // 1. Recuperamos el token y los datos del usuario del localStorage
  const token = localStorage.getItem('token');
  const usuarioRaw = localStorage.getItem('usuario'); 
  
  let userRole = '';
  if (usuarioRaw) {
    try {
      const usuario = JSON.parse(usuarioRaw);
      // Extraemos el rol. Asegúrate de que coincida con cómo guardas el DTO en el login
      userRole = usuario.tipoUsuario; // 'admin' o 'cliente'
    } catch (e) {
      console.error("Error al leer el usuario del localStorage", e);
    }
  }

  const isAuthenticated = !!token;

  // REGLA 1: Si la ruta requiere autenticación y NO está logueado, al Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'login' });
  }

  // REGLA 2: Si la ruta requiere ser Admin y el rol NO es 'admin', lo rebotamos al Home
  if (to.meta.requiresAdmin && userRole !== 'admin') {
    return next({ name: 'home' });
  }

  // Si pasa los filtros o la ruta es pública, permitimos la navegación
  next();
})

export default router