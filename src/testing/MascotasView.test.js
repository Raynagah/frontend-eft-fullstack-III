import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import MascotasView from '../views/MascotasView.vue'; // Ajustar la ruta si es necesario

// 1. Mockeamos la configuración de Axios
vi.mock('../api/axiosConfig.js', () => ({
  default: {
    get: vi.fn()
  }
}));

import api from '../api/axiosConfig.js';

// 2. Mockeamos el componente hijo MascotaCard para aislar la prueba de la vista
vi.mock('../components/mascotas/mascotaCard.vue', () => ({
  default: {
    name: 'MascotaCard',
    props: ['mascota'],
    template: '<div data-testid="mascota-card">{{ mascota.tipoReporte }}</div>'
  }
}));

describe('Vista: MascotasView.vue', () => {

  const mockMascotas = [
    { id: 1, nombre: 'Firulais', tipoReporte: 'PERDIDA' },
    { id: 2, nombre: 'Michi', tipoReporte: 'ENCONTRADA' },
    { id: 3, nombre: 'Rex', tipoReporte: 'PERDIDA' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Silenciamos los console.error y console.log esperados
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  // --- TEST 1: Estado de Carga ---
  it('debe mostrar el mensaje de carga al montarse', () => {
    api.get.mockReturnValue(new Promise(() => { }));

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    expect(screen.getByText('Cargando información desde el orquestador...')).toBeTruthy();
  });

  // --- TEST 2: Flujo Feliz (Carga Exitosa) ---
  it('debe renderizar la lista de mascotas tras una petición exitosa', async () => {
    api.get.mockResolvedValueOnce({
      data: { content: mockMascotas }
    });

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Cargando información desde el orquestador...')).toBeNull();
    });

    const cards = screen.getAllByTestId('mascota-card');
    expect(cards.length).toBe(3);
    expect(api.get).toHaveBeenCalledWith('/web/mascotas');
  });

  // --- TEST 3: Flujo de Error y Reintento ---
  it('debe mostrar mensaje de error si falla la API y permitir reintentar', async () => {
    api.get.mockRejectedValueOnce(new Error('Error 500'));

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    const botonReintentar = await screen.findByRole('button', { name: 'Reintentar' });
    expect(screen.getByText('Ocurrió un problema de conexión: Error 500')).toBeTruthy();

    api.get.mockResolvedValueOnce({
      data: mockMascotas 
    });

    await fireEvent.click(botonReintentar);

    expect(screen.getByText('Cargando información desde el orquestador...')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card').length).toBe(3);
    });

    expect(api.get).toHaveBeenCalledTimes(2);
  });

  // --- TEST 4: Filtrado ---
  it('debe filtrar las mascotas correctamente según la selección del usuario', async () => {
    api.get.mockResolvedValueOnce({ data: { content: mockMascotas } });
    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card').length).toBe(3);
    });

    const select = screen.getByLabelText('Filtrar por:');

    await fireEvent.update(select, 'PERDIDA');
    expect(screen.getAllByTestId('mascota-card').length).toBe(2);

    await fireEvent.update(select, 'ENCONTRADA');
    expect(screen.getAllByTestId('mascota-card').length).toBe(1);

    await fireEvent.update(select, 'TODOS');
    expect(screen.getAllByTestId('mascota-card').length).toBe(3);
  });

  // --- TEST 5: Estado Vacío ---
  it('debe mostrar mensaje de vacío si no hay mascotas con el filtro seleccionado', async () => {
    api.get.mockResolvedValueOnce({
      data: [{ id: 1, tipoReporte: 'PERDIDA' }]
    });

    render(MascotasView , {
      global: {
        stubs: ['router-link']
      }
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card').length).toBe(1);
    });

    const select = screen.getByLabelText('Filtrar por:');
    await fireEvent.update(select, 'ENCONTRADA');

    expect(screen.queryByTestId('mascota-card')).toBeNull();
    expect(screen.getByText('No se encontraron mascotas con este filtro.')).toBeTruthy();
  });

  // --- TEST 6 ---
  it('debe asignar un arreglo vacío si la API devuelve datos que no son un array', async () => {
    // Usamos un objeto vacío válido. La línea 53 resolverá data = {} sin romperse,
    // y la línea 54 evaluará Array.isArray({}) como FALSE, forzando la asignación de []
    api.get.mockResolvedValueOnce({
      data: { content: {} } 
    });

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Cargando información desde el orquestador...')).toBeNull();
    });

    // Al asignarse [], se mostrará directamente el texto de lista vacía
    expect(screen.queryByTestId('mascota-card')).toBeNull();
    expect(screen.getByText('No se encontraron mascotas con este filtro.')).toBeTruthy();
  });

  // --- TEST 7: Respaldo para Mensaje de Error ---
  it('debe mostrar el mensaje de error por defecto si la excepción no tiene propiedad message', async () => {
    api.get.mockRejectedValueOnce({});

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    const mensajeErrorFallback = await screen.findByText('Ocurrió un problema de conexión: No se pudo conectar con el servidor.');
    expect(mensajeErrorFallback).toBeTruthy();
  });

});