import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import MascotasView from './MascotasView.vue'; // Ajustar la ruta si es necesario

// 1. Mockeamos la configuración de Axios
vi.mock('../api/axiosConfig.js', () => ({
  default: {
    get: vi.fn()
  }
}));

import api from '../api/axiosConfig.js';

// 2. Mockeamos el componente hijo MascotaCard para aislar la prueba de la vista
// Esto evita errores si MascotaCard requiere props complejas o plugins de Vue
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
    // Congelamos la respuesta de la API devolviendo una promesa sin resolver
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
    // Simulamos respuesta exitosa
    api.get.mockResolvedValueOnce({
      data: { content: mockMascotas }
    });

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    // Esperamos a que el texto de carga desaparezca
    await waitFor(() => {
      expect(screen.queryByText('Cargando información desde el orquestador...')).toBeNull();
    });

    // Verificamos que se renderizó el componente hijo la cantidad correcta de veces
    const cards = screen.getAllByTestId('mascota-card');
    expect(cards.length).toBe(3);

    // Verificamos que se llamó a la ruta correcta
    expect(api.get).toHaveBeenCalledWith('/web/mascotas');
  });

  // --- TEST 3: Flujo de Error y Reintento ---
  it('debe mostrar mensaje de error si falla la API y permitir reintentar', async () => {
    // 1er intento: Falla
    api.get.mockRejectedValueOnce(new Error('Error 500'));

    render(MascotasView, {
      global: {
        stubs: ['router-link']
      }
    });

    // Esperamos a que aparezca el botón de reintentar
    const botonReintentar = await screen.findByRole('button', { name: 'Reintentar' });
    expect(screen.getByText('Ocurrió un problema de conexión: Error 500')).toBeTruthy();

    // 2do intento: Éxito (preparamos la API para que responda bien ahora)
    api.get.mockResolvedValueOnce({
      data: mockMascotas // Probamos el fallback en caso de que la API devuelva un array directo sin 'content'
    });

    // Hacemos clic en Reintentar
    await fireEvent.click(botonReintentar);

    // Verificamos que vuelve a mostrar el estado de carga brevemente
    expect(screen.getByText('Cargando información desde el orquestador...')).toBeTruthy();

    // Esperamos a que carguen las mascotas
    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card').length).toBe(3);
    });

    // Verificamos que la API fue llamada 2 veces en total
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

    // Esperamos a que carguen los datos
    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card').length).toBe(3);
    });

    const select = screen.getByLabelText('Filtrar por:');

    // Filtramos por PERDIDA
    await fireEvent.update(select, 'PERDIDA');
    expect(screen.getAllByTestId('mascota-card').length).toBe(2);

    // Filtramos por ENCONTRADA
    await fireEvent.update(select, 'ENCONTRADA');
    expect(screen.getAllByTestId('mascota-card').length).toBe(1);

    // Volvemos a TODOS
    await fireEvent.update(select, 'TODOS');
    expect(screen.getAllByTestId('mascota-card').length).toBe(3);
  });

  // --- TEST 5: Estado Vacío ---
  it('debe mostrar mensaje de vacío si no hay mascotas con el filtro seleccionado', async () => {
    // Cargamos una lista donde solo hay mascotas perdidas
    api.get.mockResolvedValueOnce({
      data: [{ id: 1, tipoReporte: 'PERDIDA' }]
    });

    render(MascotasView , {
      global: {
        stubs: ['router-link']
      }});

    await waitFor(() => {
      expect(screen.getAllByTestId('mascota-card').length).toBe(1);
    });

    const select = screen.getByLabelText('Filtrar por:');

    // Filtramos por ENCONTRADA (no hay ninguna)
    await fireEvent.update(select, 'ENCONTRADA');

    // Verificamos que la lista se vacía y aparece el mensaje
    expect(screen.queryByTestId('mascota-card')).toBeNull();
    expect(screen.getByText('No se encontraron mascotas con este filtro.')).toBeTruthy();
  });
});