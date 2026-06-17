import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import CampanaNotificaciones from '../components/notificaciones/CampanaNotificaciones.vue';
import api from '../api/axiosConfig.js';

const pushMock = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: pushMock
    })
}));

const globalMountOptions = {
    stubs: {
        'router-link': {
            template: '<a><slot /></a>'
        }
    }
};

describe('Componente CampanaNotificaciones.vue', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
        vi.spyOn(api, 'put').mockResolvedValue({});
    });

    afterEach(() => {
        vi.restoreAllMocks(); // Limpia los espías y restaura la función original
    });

    // --- TEST 1: Renderizado inicial y localStorage vacío ---
    it('1. Debe renderizar la campana y detener la carga si no hay usuario en localStorage', async () => {
        render(CampanaNotificaciones, { global: globalMountOptions });

        expect(screen.getByText('🔔')).toBeTruthy();
        expect(api.get).not.toHaveBeenCalled();
    });

    // --- TEST 2: Carga de notificaciones exitosa y renderizado del badge ---
    it('2. Debe cargar notificaciones al montar y mostrar el badge con las no leídas', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));

        api.get.mockResolvedValueOnce({
            data: [
                { id: 1, mensaje: 'Notif 1', leido: false },
                { id: 2, mensaje: 'Notif 2', leido: true },
                { id: 3, mensaje: 'Notif 3', leido: false }
            ]
        });

        render(CampanaNotificaciones, { global: globalMountOptions });

        // Envolvemos la búsqueda del badge en waitFor para darle tiempo al DOM de actualizarse
        await waitFor(() => {
            expect(screen.getByText('2')).toBeTruthy();
        });
    });

    // --- TEST 3: Toggle del dropdown y estado vacío ---
    it('3. Debe abrir el dropdown al hacer click y mostrar estado vacío si no hay nuevas', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
        api.get.mockResolvedValue({ data: [] });

        render(CampanaNotificaciones, { global: globalMountOptions });

        const campanaBtn = screen.getByText('🔔');
        await fireEvent.click(campanaBtn);

        expect(screen.getByText('Notificaciones')).toBeTruthy();
        expect(screen.getByText('No tienes notificaciones nuevas.')).toBeTruthy();
        expect(api.get).toHaveBeenCalledTimes(2); // 1 en onMounted, 1 al abrir
    });

    // --- TEST 4: Lista truncada a 5 elementos (slice) ---
    it('4. Debe mostrar un máximo de 5 notificaciones no leídas en la lista', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));

        const mockNotifs = Array.from({ length: 6 }, (_, i) => ({
            id: i + 1, mensaje: `Mensaje ${i + 1}`, leido: false
        }));
        api.get.mockResolvedValue({ data: mockNotifs });

        render(CampanaNotificaciones, { global: globalMountOptions });
        await fireEvent.click(screen.getByText('🔔'));

        await waitFor(() => {
            expect(screen.getByText('Mensaje 1')).toBeTruthy();
            expect(screen.getByText('Mensaje 5')).toBeTruthy();
            expect(screen.queryByText('Mensaje 6')).toBeNull(); // El 6 se corta
        });
    });

    // --- TEST 5: Fallback de IDs y router.push (mascotaId) ---
    it('5. Debe marcar como leída y navegar usando mascotaId', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
        api.get.mockResolvedValue({
            data: [{ id: 10, mensaje: 'Tu mascota fue vista', leido: false, mascotaId: 99 }]
        });

        render(CampanaNotificaciones, { global: globalMountOptions });
        await fireEvent.click(screen.getByText('🔔'));

        const notifItem = await screen.findByText('Tu mascota fue vista');
        await fireEvent.click(notifItem);

        // Envolvemos los expects del router en waitFor porque irADetalle tiene un await interno (api.put)
        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/web/notificaciones/10/leer');
            expect(pushMock).toHaveBeenCalledWith('/mascotas/99');
            expect(screen.queryByText('Notificaciones')).toBeNull();
        });
    });

    // --- TEST 6: Fallback de IDs (reporteId) ---
    it('6. Debe marcar como leída y navegar usando reporteId si mascotaId no existe', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
        api.get.mockResolvedValue({
            data: [{ id: 11, mensaje: 'Nuevo reporte', leido: false, reporteId: 88 }]
        });

        render(CampanaNotificaciones, { global: globalMountOptions });
        await fireEvent.click(screen.getByText('🔔'));

        await fireEvent.click(await screen.findByText('Nuevo reporte'));

        // Lo mismo aquí, damos tiempo a que la promesa interna se resuelva
        await waitFor(() => {
            expect(pushMock).toHaveBeenCalledWith('/mascotas/88');
        });
    });

    // --- TEST 7: Sin redirección (Ausencia de IDs) ---
    it('7. Debe marcar como leída pero no navegar si no hay ids de destino', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
        api.get.mockResolvedValue({
            data: [{ id: 12, mensaje: 'Mensaje de sistema', leido: false }]
        });
        pushMock.mockClear();

        render(CampanaNotificaciones, { global: globalMountOptions });
        await fireEvent.click(screen.getByText('🔔'));
        await fireEvent.click(await screen.findByText('Mensaje de sistema'));

        expect(api.put).toHaveBeenCalledWith('/web/notificaciones/12/leer');
        expect(pushMock).not.toHaveBeenCalled();
    });

    // --- TEST 8: Cerrar dropdown con router-link ---
    it('8. Debe cerrar el dropdown al hacer clic en "Ver toda la bandeja"', async () => {
        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));

        render(CampanaNotificaciones, { global: globalMountOptions });
        await fireEvent.click(screen.getByText('🔔'));

        // Usamos una expresión regular (/.../i) para que sea flexible con espacios y mayúsculas
        const linkBandeja = await screen.findByText(/Ver toda la bandeja/i);
        await fireEvent.click(linkBandeja);

        await waitFor(() => {
            expect(screen.queryByText('Notificaciones')).toBeNull();
        });
    });
    
    // --- TEST 9: Manejo de errores (CATCH block en GET) ---
    it('9. Debe capturar el error silenciosamente si falla cargarNotificaciones', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
        api.get.mockRejectedValueOnce(new Error('Network Error'));

        render(CampanaNotificaciones, { global: globalMountOptions });

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error cargando notificaciones", expect.any(Error));
        });
    });

    // --- TEST 10: Manejo de errores (CATCH block en PUT) ---
    it('10. Debe capturar el error silenciosamente si falla irADetalle al marcar como leída', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        localStorage.setItem('usuario', JSON.stringify({ id: 1 }));
        api.get.mockResolvedValue({
            data: [{ id: 99, mensaje: 'Fallo al leer', leido: false }]
        });

        api.put.mockRejectedValueOnce(new Error('Internal Server Error'));

        render(CampanaNotificaciones, { global: globalMountOptions });
        await fireEvent.click(screen.getByText('🔔'));

        await fireEvent.click(await screen.findByText('Fallo al leer'));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error marcando como leída", expect.any(Error));
        });
    });
});