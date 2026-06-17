import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useReporteAdminStore } from '../../stores/reporteAdminStore'; // Ajusta tu ruta
import ReporteService from '../../services/reporteService'; // Ajusta tu ruta

describe('ReporteAdminStore', () => {
  let store;

  beforeEach(() => {
    // Levantamos un Pinia limpio antes de cada test
    setActivePinia(createPinia());
    store = useReporteAdminStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- GETTERS ---
  it('Debe calcular el total de reportes correctamente (totalReportes)', () => {
    store.reportes = [{ id: 1 }, { id: 2 }];
    expect(store.totalReportes).toBe(2);
  });

  // --- ACTIONS: cargarReportes ---
  it('Debe cargar los reportes correctamente (Éxito)', async () => {
    const mockData = [{ id: 1, mascota: 'Firulais' }];
    vi.spyOn(ReporteService, 'listarReportes').mockResolvedValue({ data: mockData });

    // Verificamos el estado inicial de carga
    expect(store.cargando).toBe(false);
    
    // Disparamos la acción
    const promesa = store.cargarReportes();
    expect(store.cargando).toBe(true); // Se evalúa mientras espera la respuesta
    
    await promesa;

    expect(store.reportes).toEqual(mockData);
    expect(store.error).toBeNull();
    expect(store.cargando).toBe(false); // Validamos que el finally funcionó
  });

  it('Debe manejar errores al cargar los reportes (Error)', async () => {
    vi.spyOn(ReporteService, 'listarReportes').mockRejectedValue(new Error('Network Error'));

    await store.cargarReportes();

    expect(store.error).toBe('No se pudieron cargar los reportes de mascotas.');
    expect(store.reportes).toEqual([]);
    expect(store.cargando).toBe(false);
  });

  // --- ACTIONS: eliminarReporte ---
  it('Debe eliminar un reporte correctamente (Éxito)', async () => {
    store.reportes = [{ id: 1 }, { id: 2 }];
    vi.spyOn(ReporteService, 'eliminarReporte').mockResolvedValue({});

    await store.eliminarReporte(1);

    expect(store.reportes.length).toBe(1);
    expect(store.reportes[0].id).toBe(2);
    expect(store.cargando).toBe(false);
  });

  it('Debe manejar errores al eliminar un reporte (Error)', async () => {
    store.reportes = [{ id: 1 }];
    vi.spyOn(ReporteService, 'eliminarReporte').mockRejectedValue(new Error('Network Error'));

    // Como la función hace un throw error, debemos capturarlo en el test
    await expect(store.eliminarReporte(1)).rejects.toThrow('Network Error');
    
    expect(store.error).toBe('Error al eliminar el reporte.');
    expect(store.reportes.length).toBe(1); // No debió eliminarse
    expect(store.cargando).toBe(false);
  });
});