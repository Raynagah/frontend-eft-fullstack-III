// src/services/api.js
import axios from "import axios from 'axios'";

// Instancia base apuntando a nuestro BFF
const apiClient = axios.create({
    baseURL: 'http://localhost:8087/api/v1/web', // Ajusta el puerto si es distinto
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 10000 // 10 segundos de timeout para evitar cuelgues
});

// Opcional: Interceptor para manejo de errores globales (ej: 500 del servidor)
apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error("Error en comunicación con el BFF:", error);
        return Promise.reject(error);
    }
);

export default apiClient;