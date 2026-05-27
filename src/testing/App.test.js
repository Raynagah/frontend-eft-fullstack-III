import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { reactive, nextTick } from 'vue';
import App from '../../src/App.vue';

// 1. Objeto reactivo para la ruta y mock de navegación
const mockRoute = reactive({ fullPath: '/' });
const mockPush = vi.fn();

// 2. Simulamos 'vue-router'
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useRoute: () => mockRoute
}));

// 3. Simulamos el alert nativo
vi.spyOn(window, 'alert').mockImplementation(() => {});

describe('Componente Core: App.vue', () => {
  
  const globalOptions = {
    stubs: {
      'router-link': {
        template: '<a><slot /></a>' // Mantiene vivos los textos dentro de los enlaces
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
  });

  // --- TEST 1: Rama Invitado (v-if="!usuarioActual") ---
  it('debe mostrar los enlaces de inicio de sesión si no hay un usuario autenticado', async () => {
    render(App, { global: globalOptions });
    await nextTick();

    expect(screen.getByText('Inicio')).toBeTruthy();
    expect(screen.getByText('Mascotas')).toBeTruthy();
    expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
    expect(screen.getByText('Registrarse')).toBeTruthy();

    expect(screen.queryByText(/Hola,/)).toBeNull();
    expect(screen.queryByText('Salir')).toBeNull();
  });

  // --- TEST 2: Rama Autenticado (v-else) + Función onMounted() ---
  it('debe renderizar el nombre del usuario y el botón de Salir si existe sesión en localStorage', async () => {
    // Definimos el localStorage ANTES de cualquier interacción
    const mockUser = { nombre: 'Andrés' };
    localStorage.setItem('usuario', JSON.stringify(mockUser));

    render(App, { global: globalOptions });
    
    // Forzamos a Vue a procesar el ciclo onMounted y actualizar la vista reactiva
    await nextTick();

    // Usamos expresiones regulares más flexibles (i para ignorar mayúsculas/minúsculas si fuera necesario)
    expect(screen.getByText(/Andrés/)).toBeTruthy();
    expect(screen.getByText('Salir')).toBeTruthy();

    expect(screen.queryByText('Iniciar Sesión')).toBeNull();
    expect(screen.queryByText('Registrarse')).toBeNull();
  });

  // --- TEST 3: Función cerrarSesion() ---
  it('debe borrar las credenciales de localStorage, alertar al usuario y redirigir al inicio al presionar Salir', async () => {
    localStorage.setItem('token', 'xyz-token-abc');
    localStorage.setItem('sessionId', '98765');
    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Sofía' }));

    render(App, { global: globalOptions });
    await nextTick();

    // Ubicamos el botón que ahora sí va a aparecer
    const botonSalir = screen.getByText('Salir');
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
    expect(screen.queryByText(/Hola,/)).toBeNull();

    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Carlos' }));
    mockRoute.fullPath = '/dashboard-privado';

    // Damos dos ticks de reloj a Vue para que procese el watcher y re-renderice
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
});