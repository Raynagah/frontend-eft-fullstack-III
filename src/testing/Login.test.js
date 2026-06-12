import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'; 
import Login from '../views/Login.vue'; 

// 1. Mockeamos el Vue Router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// 2. Mockeamos la configuración personalizada de Axios
vi.mock('../api/axiosConfig.js', () => ({
  default: {
    post: vi.fn()
  }
}));

import api from '../api/axiosConfig.js';

// 3. Simulamos alertas nativas
vi.spyOn(window, 'alert').mockImplementation(() => {});

describe('Componente: Login.vue', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Ocultamos los console.error esperados en los tests de fallos para mantener limpia la consola
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // --- TEST 1: Renderizado Inicial ---
  it('debe renderizar correctamente la vista de inicio de sesión', () => {
    render(Login, {
      global: {
        stubs: ['router-link']
      }}),
    expect(screen.getByText('Sanos y Salvos')).toBeTruthy();
    expect(screen.getByText('Bienvenido de vuelta')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  });

  // --- TEST 2: Flujo Feliz (Login Exitoso) ---
  it('debe iniciar sesión, guardar credenciales, mostrar alerta y redirigir', async () => {
    render(Login, {
      global: {
        stubs: ['router-link']
      }});

    const mockUsuario = { id: 1, nombre: 'Andrés' };
    api.post.mockResolvedValueOnce({
      data: {
        token: 'token-valido-123',
        sessionId: 'sesion-123',
        usuario: mockUsuario
      }
    });

    const inputCorreo = screen.getByLabelText('Correo Electrónico');
    const inputPassword = screen.getByLabelText('Contraseña');
    const form = screen.getByRole('button', { name: 'Entrar' }).closest('form');

    await fireEvent.update(inputCorreo, 'test@correo.com');
    await fireEvent.update(inputPassword, '12345678');
    
    // Enviamos el formulario
    await fireEvent.submit(form);

    // Usamos waitFor para darle tiempo al microtask de la promesa a resolverse
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('token-valido-123');
    });

    // Una vez confirmamos el token, las demás aserciones pueden ir seguidas
    expect(localStorage.getItem('sessionId')).toBe('sesion-123');
    expect(JSON.parse(localStorage.getItem('usuario'))).toEqual(mockUsuario);

    expect(window.alert).toHaveBeenCalledWith('¡Bienvenido de vuelta, Andrés!');
    expect(mockPush).toHaveBeenCalledWith('/mascotas');
  });

  // --- TEST 3: Flujo de Error (Credenciales Inválidas 401/403) ---
  it('debe mostrar mensaje de credenciales incorrectas si el servidor responde con 401', async () => {
    render(Login, {
      global: {
        stubs: ['router-link']
      }});

    api.post.mockRejectedValueOnce({
      response: { status: 401 }
    });

    const form = screen.getByRole('button', { name: 'Entrar' }).closest('form');
    await fireEvent.submit(form);

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  // --- TEST 4: Flujo de Error (Error de Servidor 500) ---
  it('debe mostrar un mensaje de error genérico si hay un error de conexión', async () => {
    render(Login, {
      global: {
        stubs: ['router-link']
      }});

    api.post.mockRejectedValueOnce({
      response: { status: 500 }
    });

    const form = screen.getByRole('button', { name: 'Entrar' }).closest('form');
    await fireEvent.submit(form);

    expect(await screen.findByText('Error al conectar con el servidor. Intenta más tarde.')).toBeTruthy();
  });

  // --- TEST 5: Estado de Carga ---
  it('debe cambiar el texto del botón y deshabilitarlo mientras carga', async () => {
    render(Login, {
      global: {
        stubs: ['router-link']
      }});

    let resolveApi;
    const promise = new Promise((resolve) => { resolveApi = resolve; });
    api.post.mockReturnValueOnce(promise);

    const boton = screen.getByRole('button', { name: 'Entrar' });
    const form = boton.closest('form');

    await fireEvent.submit(form);

    expect(boton.disabled).toBe(true);
    expect(screen.getByText('Iniciando sesión...')).toBeTruthy();

    resolveApi({ data: { token: '1', sessionId: '2', usuario: { nombre: 'A' } } });
  });
});