import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    ui: {
      open: false // Evita que intente abrir el navegador en Docker
    },
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**' // Evita el colapso de I/O al generar los reportes
    ],
    api: {
      host: '0.0.0.0',
      port: 51204
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/main.js',            // Inicializador de Vue
        'src/containers/**',
        'src/components/mapa/**',
        'src/components/mascotas/listaMascotas.vue',
        'src/components/usuarios/**',
        'src/views/HomeView.vue',
        'src/views/MascotaView.vue',
        'src/router/**',          // Configuración de rutas
        'src/api/axiosConfig.js', // Configuración de Axios
        '**/*.config.{js,ts}',    // Configs de vite, tailwind, etc.
        '**/*.test.js'            // Los mismos archivos de pruebas
      ],
      reporter: ['text', 'html'], // 'html' genera una web interactiva propia
      thresholds: {
        statements: 90,
        functions: 90,
        lines: 90,
        branches: 90
      }
    }
  }
});