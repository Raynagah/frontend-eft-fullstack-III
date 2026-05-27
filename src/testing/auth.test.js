import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { useAuthStore } from '../stores/auth'; // Ajusta la ruta si es necesario

// 1. Mockeamos Axios para interceptar las llamadas HTTP
vi.mock('axios', () => {
  return {
    default: {
      post: vi.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    }
  };
});

describe('Store: useAuthStore (auth.js)', () => {
  
  beforeEach(() => {
    // 2. Preparamos un entorno limpio para cada test
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    
    // Reiniciamos las cabeceras de axios por si algún test anterior las modificó
    axios.defaults.headers.common = {};
  });

  // --- TEST 1: Estado inicial y Getters ---
  it('debe inicializar con valores nulos si no hay nada en localStorage', () => {
    const store = useAuthStore();
    
    expect(store.usuario).toBeNull();
    expect(store.token).toBeNull();
    expect(store.sessionId).toBeNull();
    expect(store.estaAutenticado).toBe(false);
  });

  it('debe cargar los datos desde localStorage si existen al inicializar', () => {
    // Configuramos localStorage ANTES de instanciar el store
    localStorage.setItem('token', 'token-falso');
    localStorage.setItem('sessionId', 'session-123');
    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Andrés' }));

    const store = useAuthStore();

    expect(store.token).toBe('token-falso');
    expect(store.sessionId).toBe('session-123');
    expect(store.usuario).toEqual({ nombre: 'Andrés' });
    expect(store.estaAutenticado).toBe(true);
  });

  // --- TEST 2: Acción Login (Éxito) ---
  it('debe actualizar el estado, localStorage y Axios tras un login exitoso', async () => {
    const store = useAuthStore();
    const credenciales = { email: 'test@test.com', password: 'password123' };
    
    // Simulamos la respuesta exitosa del backend
    const mockResponse = {
      data: {
        token: 'token-jwt-123',
        usuario: { id: 1, nombre: 'Test User' },
        sessionId: 'session-abc-890'
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    // Ejecutamos la acción
    const resultado = await store.login(credenciales);

    // 1. Verificamos que se llamó a la API correcta
    expect(axios.post).toHaveBeenCalledWith('http://localhost:8087/api/v1/auth/login', credenciales);
    expect(resultado).toBe(true);

    // 2. Verificamos el estado de Pinia
    expect(store.token).toBe('token-jwt-123');
    expect(store.usuario).toEqual({ id: 1, nombre: 'Test User' });
    expect(store.estaAutenticado).toBe(true);

    // 3. Verificamos el localStorage
    expect(localStorage.getItem('token')).toBe('token-jwt-123');
    expect(JSON.parse(localStorage.getItem('usuario'))).toEqual({ id: 1, nombre: 'Test User' });

    // 4. Verificamos la configuración de Axios
    expect(axios.defaults.headers.common['Authorization']).toBe('Bearer token-jwt-123');
    expect(axios.defaults.headers.common['X-Session-ID']).toBe('session-abc-890');
  });

  // --- TEST 3: Acción Login (Fallo) ---
  it('debe lanzar un error si las credenciales son incorrectas (fallo en login)', async () => {
    const store = useAuthStore();
    const credenciales = { email: 'bad@test.com', password: 'wrong' };
    
    // Simulamos un error del backend (ej. 401 Unauthorized)
    const mockError = new Error('No autorizado');
    axios.post.mockRejectedValueOnce(mockError);

    // Verificamos que la promesa es rechazada
    await expect(store.login(credenciales)).rejects.toThrow('No autorizado');

    // Verificamos que no se guardó nada al fallar
    expect(store.estaAutenticado).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });

  // --- TEST 4: Acción Logout ---
  it('debe limpiar el estado, localStorage y cabeceras de Axios al hacer logout', () => {
    // Forzamos un estado "logueado" manualmente
    const store = useAuthStore();
    store.token = 'token-para-borrar';
    store.usuario = { nombre: 'Andrés' };
    store.sessionId = 'sesion-para-borrar';
    
    localStorage.setItem('token', store.token);
    localStorage.setItem('usuario', JSON.stringify(store.usuario));
    localStorage.setItem('sessionId', store.sessionId);
    
    axios.defaults.headers.common['Authorization'] = 'Bearer token-para-borrar';
    axios.defaults.headers.common['X-Session-ID'] = 'sesion-para-borrar';

    // Ejecutamos el logout
    store.logout();

    // 1. Pinia limpio
    expect(store.token).toBeNull();
    expect(store.usuario).toBeNull();
    expect(store.sessionId).toBeNull();
    expect(store.estaAutenticado).toBe(false);

    // 2. localStorage limpio
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
    expect(localStorage.getItem('sessionId')).toBeNull();

    // 3. Axios limpio (las propiedades deben ser undefined porque usamos 'delete' en tu código)
    expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    expect(axios.defaults.headers.common['X-Session-ID']).toBeUndefined();
  });
});