import axios from 'axios';

// Instancia base apuntando a nuestro BFF / Gateway
const api = axios.create({
  baseURL: 'http://localhost:8087/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Interceptor para inyectar seguridad en cada petición
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  const sessionId = localStorage.getItem('sessionId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId; 
  }
  return config;
});

// Interceptor para detectar si la sesión expiró o fue cerrada desde otro lado
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn("Sesión expirada o no autorizada. Redirigiendo al login...");
      localStorage.clear();
      globalThis.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;