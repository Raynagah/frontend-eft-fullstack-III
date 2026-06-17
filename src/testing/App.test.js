import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { reactive, nextTick } from 'vue';
import App from '../App.vue';

// 1. Objeto reactivo para emular tanto la ruta completa como el path estructurado
const mockRoute = reactive({
  fullPath: '/',
  path: '/'
});
const mockPush = vi.fn();

// 2. Simulamos 'vue-router'
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => mockRoute
}));

// 3. Simulamos el alert nativo del navegador
vi.spyOn(window, 'alert').mockImplementation(() => { });

describe('Componente Core: App.vue', () => {

  const globalOptions = {
    stubs: {
      'router-link': {
        template: '<a><slot /></a>' // Mantiene vivos los textos e iconos dentro de los enlaces
      },
      'CampanaNotificaciones': {
        template: '<div data-testid="campana-stub">🔔</div>'
      },
      'router-view': true
    },
    mocks: {
      $router: {
        push: mockPush
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockRoute.fullPath = '/';
    mockRoute.path = '/';
  });

  // --- TEST 1: Rama Invitado ---
  it('debe mostrar los enlaces de inicio de sesión si no hay un usuario autenticado', async () => {
    render(App, { global: globalOptions });
    await nextTick();

    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Mascotas')).toBeTruthy();
    expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    expect(screen.getByText('Registrarse')).toBeTruthy();

    expect(screen.queryByText(/👤/)).toBeNull();
    expect(screen.queryByText('Cerrar Sesión')).toBeNull();
  });

  // --- TEST 2: Rama Autenticado (Cliente Regular) ---
  it('debe renderizar el nombre del usuario y el botón de Cerrar Sesión si existe sesión de cliente', async () => {
    const mockUser = { id: 1, nombre: 'Andrés', tipoUsuario: 'cliente' };
    localStorage.setItem('usuario', JSON.stringify(mockUser));

    render(App, { global: globalOptions });

    mockRoute.fullPath = '/mascotas';
    mockRoute.path = '/mascotas';
    await nextTick();

    expect(await screen.findByText(/Andrés/i)).toBeTruthy();
    expect(await screen.findByText(/Cerrar Sesión/i)).toBeTruthy();
    expect(screen.queryByText(/⚙️ Panel Admin/i)).toBeNull();
  });

  // --- TEST 3: Función cerrarSesion() ---
  it('debe borrar las credenciales de localStorage, alertar al usuario y redirigir al inicio al presionar Cerrar Sesión', async () => {
    localStorage.setItem('token', 'xyz-token-abc');
    localStorage.setItem('sessionId', '98765');
    localStorage.setItem('usuario', JSON.stringify({ id: 2, nombre: 'Sofía', tipoUsuario: 'cliente' }));

    render(App, { global: globalOptions });

    mockRoute.fullPath = '/perfil';
    mockRoute.path = '/perfil';
    await nextTick();

    const botonSalir = await screen.findByText(/Cerrar Sesión/i);
    await fireEvent.click(botonSalir);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('sessionId')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();

    expect(window.alert).toHaveBeenCalledWith('Has cerrado sesión correctamente.');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  // --- TEST 4: El Watcher dinámico ---
  it('debe actualizar la barra de navegación dinámicamente si la URL cambia', async () => {
    render(App, { global: globalOptions });
    await nextTick();
    expect(screen.queryByText(/Carlos/)).toBeNull();

    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Carlos', tipoUsuario: 'cliente' }));
    mockRoute.fullPath = '/mascotas';
    mockRoute.path = '/mascotas';

    await nextTick();
    await nextTick();

    expect(screen.getByText(/Carlos/)).toBeTruthy();
  });

  // --- TEST 5: Evento Click Inline del Template ---
  it('debe redirigir directamente a la ruta /reportar al hacer clic en el botón principal', async () => {
    render(App, { global: globalOptions });
    await nextTick();

    const botonReportar = screen.getByText('Reportar Mascota');
    await fireEvent.click(botonReportar);

    expect(mockPush).toHaveBeenCalledWith('/reportar');
  });

  // --- TEST 6: Rama Rol Admin fuera de rutas administrativas ---
  it('debe mostrar el botón del Panel Admin si el usuario logueado es administrador y está fuera del panel', async () => {
    const mockAdmin = { id: 3, nombre: 'Admin Supremo', tipoUsuario: 'admin' };
    localStorage.setItem('usuario', JSON.stringify(mockAdmin));

    render(App, { global: globalOptions });

    mockRoute.fullPath = '/mascotas';
    mockRoute.path = '/mascotas';
    await nextTick();

    expect(screen.getByText(/⚙️ Panel Admin/i)).toBeTruthy();
    expect(screen.queryByText(/🏠 Volver a la pagina/i)).toBeNull();
  });

  // --- TEST 7: Rama Rol Admin dentro de rutas administrativas ---
  it('debe mostrar el botón Volver a la página si el usuario administrador está dentro de la ruta /admin', async () => {
    const mockAdmin = { id: 3, nombre: 'Admin Supremo', tipoUsuario: 'admin' };
    localStorage.setItem('usuario', JSON.stringify(mockAdmin));

    render(App, { global: globalOptions });

    mockRoute.fullPath = '/admin/usuarios';
    mockRoute.path = '/admin/usuarios';
    await nextTick();

    expect(screen.getByText(/🏠 Volver a la pagina/i)).toBeTruthy();
    expect(screen.queryByText(/⚙️ Panel Admin/i)).toBeNull();
  });

  // --- TEST 8: Control de flujo de verificarSesion sin datos en localStorage ---
  it('debe limpiar usuarioActual si el contenido de localStorage es removido externamente', async () => {
    const { unmount } = render(App, { global: globalOptions });
    mockRoute.fullPath = '/mascotas';
    await nextTick();

    // Simular borrado de credenciales
    localStorage.removeItem('usuario');
    mockRoute.fullPath = '/';
    await nextTick();

    expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    unmount();
  });

  // --- TEST 9: Cobertura de botón Reportar Mascota en modo Autenticado (v-else) ---
  it('debe redirigir a /reportar al hacer clic en el botón principal estando autenticado', async () => {
    // 1. Forzamos que exista un usuario para activar el bloque v-else (Línea 36-37)
    localStorage.setItem('usuario', JSON.stringify({ id: 1, nombre: 'Andrés', tipoUsuario: 'cliente' }));

    render(App, { global: globalOptions });

    // 2. Despertamos el watcher para mutar el estado y renderizar el bloque correcto
    mockRoute.fullPath = '/mascotas';
    await nextTick();

    // 3. Buscamos el botón "Reportar Mascota" que ahora pertenece al v-else
    const botonReportarLogueado = screen.getByText('Reportar Mascota');
    await fireEvent.click(botonReportarLogueado);

    // 4. Verificamos que se haya ejecutado el push correspondiente
    expect(mockPush).toHaveBeenCalledWith('/reportar');
  });
});