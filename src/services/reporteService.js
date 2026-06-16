import api from '../api/axiosConfig';

const REPORTES_PATH = '/web/mascotas';

const ReporteService = {
  listarReportes() {
    return api.get(REPORTES_PATH);
  },
  eliminarReporte(id) {
    return api.delete(`${REPORTES_PATH}/${id}`);
  }
};

export default ReporteService;  