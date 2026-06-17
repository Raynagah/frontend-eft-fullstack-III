import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReporteService from '../services/reporteService';
import api from '../api/axiosConfig';

describe('ReporteService', () => {
  beforeEach(() => {
    // Interceptamos los métodos que vamos a usar y les damos una respuesta simulada
    vi.spyOn(api, 'get').mockResolvedValue({ data: 'mock-get' });
    vi.spyOn(api, 'delete').mockResolvedValue({ data: 'mock-delete' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Debe listar los reportes llamando al endpoint correcto (GET)', async () => {
    const response = await ReporteService.listarReportes();
    
    // Verificamos que se llamó al método correcto, con la ruta exacta
    expect(api.get).toHaveBeenCalledWith('/web/mascotas');
    // Verificamos que retorna lo que devuelve axios
    expect(response.data).toBe('mock-get');
  });

  it('Debe eliminar un reporte llamando al endpoint con su ID (DELETE)', async () => {
    const idPrueba = 123;
    const response = await ReporteService.eliminarReporte(idPrueba);
    
    // Verificamos la interpolación correcta de la URL
    expect(api.delete).toHaveBeenCalledWith(`/web/mascotas/${idPrueba}`);
    expect(response.data).toBe('mock-delete');
  });
});