import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import PerfilView from './PerfilView.vue';
import api from '../api/axiosConfig.js';

// Mocks
vi.mock('../api/axiosConfig.js', () => ({
  default: { get: vi.fn(), put: vi.fn() }
}));

vi.mock('../components/mascotas/MascotaCard.vue', () => ({
  default: {
    name: 'MascotaCard',
    props: ['mascota'],
    template: '<div data-testid="mascota-card">{{ mascota.nombre }}</div>'
  }
}));

describe('Vista: PerfilView.vue', () => {
  const mockUsuario = {
    id: 1, nombre: 'Ana Gómez', correo: 'ana@test.com', telefono: '123456', rol: 'ADMIN'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Simulamos un usuario en el localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ id: 1 }));
    
    // Configuramos respuestas exitosas por defecto
    api.get.mockImplementation((url) => {
      if (url.includes('/reportes')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: mockUsuario });
    });
  });

  it('debe cargar y mostrar los datos del usuario al montarse', async () => {
    render(PerfilView);

    // Esperamos a que los datos se rendericen
    await waitFor(() => {
      expect(screen.getByText('Ana Gómez')).toBeTruthy();
      expect(screen.getByText('ana@test.com')).toBeTruthy();
      expect(screen.getByText('ADMIN')).toBeTruthy(); // Badge de rol
    });
  });

  it('debe cambiar al modo edición y guardar los cambios', async () => {
    // Simulamos la respuesta del PUT (guardado)
    api.put.mockResolvedValueOnce({ data: { ...mockUsuario, nombre: 'Ana Maria' } });

    render(PerfilView);
    await waitFor(() => screen.getByText('Ana Gómez'));

    // Entramos al modo edición
    const btnEditar = screen.getByRole('button', { name: /Editar Perfil/i });
    await fireEvent.click(btnEditar);

    // Modificamos el nombre
    const inputNombre = screen.getByLabelText('Nombre Completo*');
    await fireEvent.update(inputNombre, 'Ana Maria');

    // Guardamos
    const btnGuardar = screen.getByRole('button', { name: /Guardar Cambios/i });
    await fireEvent.click(btnGuardar);

    // Verificamos que se llamó a la API con los datos correctos
    expect(api.put).toHaveBeenCalledWith('/web/usuarios/1', expect.objectContaining({
      nombre: 'Ana Maria'
    }));

    // Verificamos el mensaje de éxito
    await waitFor(() => {
      expect(screen.getByText('¡Perfil actualizado con éxito!')).toBeTruthy();
    });
  });
});