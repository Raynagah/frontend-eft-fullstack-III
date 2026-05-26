import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import ReportarView from './ReportarView.vue';
import api from '../api/axiosConfig.js';

// 1. Mock de Axios
vi.mock('../api/axiosConfig.js', () => ({
  default: { post: vi.fn() }
}));

// 2. Mock PROFUNDO de Leaflet para evitar errores de JSDOM
vi.mock('leaflet', () => {
  const mockMarker = {
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn(),
    setLatLng: vi.fn()
  };
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    on: vi.fn()
  };
  return {
    default: {
      map: vi.fn(() => mockMap),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      icon: vi.fn(),
      marker: vi.fn(() => mockMarker)
    }
  };
});

describe('Vista: ReportarView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Simulamos usuario en LocalStorage para pasar la validación
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ 
      id: 99, nombre: 'Test User', correo: 'test@test.com' 
    }));
  });

  it('debe cambiar las etiquetas del formulario según el tipo de reporte', async () => {
    render(ReportarView , {
      global: {
        stubs: ['router-link']
      }});

    const selectReporte = screen.getByTestId('select-tipo-reporte');
    
    // Por defecto es PERDIDA. Usamos regex para ignorar espacios y asteriscos exactos
    expect(screen.getByText(/Nombre de tu mascota/i)).toBeTruthy();

    // Cambiamos a ENCONTRADA
    await fireEvent.update(selectReporte, 'ENCONTRADA');
    
    // La etiqueta debe cambiar
    expect(screen.getByText(/Nombre \(si tiene collar\/placa\)/i)).toBeTruthy();
  });

  it('debe enviar el formulario correctamente y mostrar pantalla de éxito', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(ReportarView , {
      global: {
        stubs: ['router-link']
      }});

    // Llenamos los campos requeridos usando TestIds
    await fireEvent.update(screen.getByTestId('input-nombre-mascota'), 'Boby');
    await fireEvent.update(screen.getByTestId('select-especie'), 'Perro');
    await fireEvent.update(screen.getByTestId('input-color'), 'Café');
    // Nota: El contacto se autocompleta por el LocalStorage mockeado

    // Enviamos
    const form = screen.getByRole('button', { name: /Publicar Reporte/i }).closest('form');
    await fireEvent.submit(form);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/web/mascotas/reportar', expect.objectContaining({
        nombre: 'Boby',
        especie: 'Perro',
        usuarioId: 99
      }));
      
      // Debe aparecer el mensaje de éxito
      expect(screen.getByText('¡Reporte creado con éxito!')).toBeTruthy();
    });
  });

  it('debe mostrar error si no hay usuario en sesión', async () => {
    // Vaciamos el localStorage
    Storage.prototype.getItem.mockReturnValueOnce(null);

    render(ReportarView , {
      global: {
        stubs: ['router-link']
      }});
    
    const form = screen.getByRole('button', { name: /Publicar Reporte/i }).closest('form');
    await fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Debes iniciar sesión para reportar una mascota.')).toBeTruthy();
      expect(api.post).not.toHaveBeenCalled();
    });
  });
});