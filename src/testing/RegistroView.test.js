import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import RegistroView from '../views/RegistroView.vue';
import api from '../api/axiosConfig.js';

// Mocks
vi.mock('../api/axiosConfig.js', () => ({
  default: { post: vi.fn() }
}));

const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush })
}));

describe('Vista: RegistroView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('debe registrar al usuario y redirigir al login en caso de éxito', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(RegistroView);

    // Llenamos campos obligatorios básicos
    await fireEvent.update(screen.getByLabelText('Nombre Completo'), 'Pedro Páramo');
    await fireEvent.update(screen.getByLabelText('Correo Electrónico'), 'pedro@test.com');
    await fireEvent.update(screen.getByLabelText('Contraseña'), '12345678');
    await fireEvent.update(screen.getByLabelText('Teléfono'), '+569123456');
    await fireEvent.update(screen.getByLabelText('Edad'), '30');
    await fireEvent.update(screen.getByLabelText('Género'), 'Masculino');
    await fireEvent.update(screen.getByLabelText('Ocupación'), 'PARTICULAR');
    await fireEvent.update(screen.getByLabelText('Dirección'), 'Calle Falsa 123');

    // Enviamos el formulario
    const btnSubmit = screen.getByRole('button', { name: /Crear mi cuenta/i });
    await fireEvent.click(btnSubmit);

    await waitFor(() => {
      // Verificamos la llamada a la API
      expect(api.post).toHaveBeenCalledWith('/auth/registro', expect.objectContaining({
        nombre: 'Pedro Páramo',
        correo: 'pedro@test.com'
      }));
      
      // Verificamos el alert y la redirección
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('éxito'));
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('debe mostrar mensaje de error si falla el registro', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'El correo ya existe' } }
    });

    render(RegistroView);

    // Forzamos el envío (saltando la validación HTML para el test)
    await fireEvent.submit(screen.getByRole('button', { name: /Crear mi cuenta/i }).closest('form'));

    await waitFor(() => {
      expect(screen.getByText('El correo ya existe')).toBeTruthy();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('debe mostrar mensaje de error genérico si el backend no devuelve un mensaje específico', async () => {
    // Simulamos un error genérico sin la propiedad response.data.message
    api.post.mockRejectedValueOnce(new Error('Network Error'));

    render(RegistroView);

    // Forzamos el envío del formulario
    const form = screen.getByRole('button', { name: /Crear mi cuenta/i }).closest('form');
    await fireEvent.submit(form);

    // Buscamos una porción del texto real que tienes en el fallback de tu vista
    const mensajeError = await screen.findByText(/Error al registrar\. Revisa los datos/i);
    expect(mensajeError).toBeTruthy();
    
    // Confirmamos que no navegó a otra ruta
    expect(mockPush).not.toHaveBeenCalled();
  });
});