import { defineStore } from 'pinia';
import ReporteService from '../services/reporteService';

export const useReporteAdminStore = defineStore('reporteAdmin', {
  state: () => ({
    reportes: [],
    cargando: false,
    error: null,
  }),

  getters: {
    totalReportes: (state) => state.reportes.length,
  },

  actions: {
    async cargarReportes() {
      this.cargando = true;
      this.error = null;
      try {
        const response = await ReporteService.listarReportes();
        this.reportes = response.data;
      } catch (error) {
        console.error('Error al cargar reportes:', error);
        this.error = 'No se pudieron cargar los reportes de mascotas.';
      } finally {
        this.cargando = false;
      }
    },

    async eliminarReporte(id) {
      this.cargando = true;
      this.error = null;
      try {
        await ReporteService.eliminarReporte(id);
        this.reportes = this.reportes.filter(r => r.id !== id);
      } catch (error) {
        console.error('Error al eliminar reporte:', error);
        this.error = 'Error al eliminar el reporte.';
        throw error;
      } finally {
        this.cargando = false;
      }
    }
  }
});