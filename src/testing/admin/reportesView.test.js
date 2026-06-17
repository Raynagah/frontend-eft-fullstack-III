import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import reportesView from '../../views/admin/reportesView.vue';

enableAutoUnmount(afterEach);

// 1. Mocks de Vue Router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockPush
    })
}));

// 2. Definición de variables reactivas compartidas para el mock del Store
let storeEstadoMocados = {
    reportes: [],
    cargando: false,
    error: null,
    cargarReportes: vi.fn(),
    eliminarReporte: vi.fn()
};

vi.mock('../../stores/reporteAdminStore', () => ({
    useReporteAdminStore: () => storeEstadoMocados
}));

describe('reportesView.vue', () => {
    // Helpers de fechas dinámicas sincronizadas con el día de hoy
    const hoyString = new Date().toISOString().split('T')[0];
    const ayerString = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const mockReportesLista = [
        { id: 1, nombre: 'Firulais', titulo: 'Extraviado', resumen: 'Perrito negro', tipoReporte: 'PERDIDA', estado: 'Abierto', fechaReporte: hoyString },
        { id: 2, nombre: 'Mia', titulo: 'Encontrada gata', resumen: 'Gata siamesa', tipoReporte: 'ENCONTRADA', estado: 'Resuelto', createdAt: ayerString },
        { id: 3, nombre: null, titulo: 'Buscamos Dueño', resumen: 'Loro verde', tipoReporte: 'ENCONTRADO', estado: 'Abierto', fechaCreacion: ayerString },
        { id: 4, nombre: 'Sin Fecha', titulo: 'Caso Raro', resumen: 'Test fallback', tipoReporte: 'PERDIDA', estado: 'Abierto', fechaReporte: null }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Reiniciamos el estado por defecto del store antes de cada test
        storeEstadoMocados.reportes = [...mockReportesLista];
        storeEstadoMocados.cargando = false;
        storeEstadoMocados.error = null;
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    const mountComponent = () => mount(reportesView);

    it('1. Debe invocar a cargarReportes al montarse la vista (onMounted)', () => {
        mountComponent();
        expect(storeEstadoMocados.cargarReportes).toHaveBeenCalledTimes(1);
    });

    it('2. Debe renderizar correctamente la interfaz en estado de carga (loading)', () => {
        storeEstadoMocados.cargando = true;
        const wrapper = mountComponent();

        expect(wrapper.find('.state-container.loading').exists()).toBe(true);
        expect(wrapper.text()).toContain('Cargando reportes del sistema...');
        expect(wrapper.find('.custom-table').exists()).toBe(false);
    });

    it('3. Debe renderizar correctamente la interfaz en estado de error', () => {
        storeEstadoMocados.error = 'Error de timeout de red 504';
        const wrapper = mountComponent();

        expect(wrapper.find('.state-container.error').exists()).toBe(true);
        expect(wrapper.text()).toContain('Error de conexión');
        expect(wrapper.text()).toContain('Error de timeout de red 504');
    });

    it('4. Debe calcular correctamente las estadísticas computadas incluyendo reportes de hoy', () => {
        const wrapper = mountComponent();

        expect(wrapper.vm.totalReportes).toBe(4);
        expect(wrapper.vm.totalPerdidas).toBe(2);    // IDs 1 y 4
        expect(wrapper.vm.totalEncontradas).toBe(2); // IDs 2 (ENCONTRADA) y 3 (ENCONTRADO)
        expect(wrapper.vm.reportesHoy).toBe(1);       // ID 1 coincide con hoyString
    });

    it('5. Debe navegar de regreso al panel administrativo al pulsar volver', async () => {
        const wrapper = mountComponent();
        await wrapper.find('.btn-back').trigger('click');
        expect(mockPush).toHaveBeenCalledWith('/admin');
    });

    it('6. Debe filtrar y ordenar los reportes dinámicamente por tipo y fecha (ASC/DESC)', async () => {
        const wrapper = mountComponent();

        // Por defecto: TODOS y DESC (Más recientes primero)
        expect(wrapper.vm.reportesFiltrados[0].id).toBe(1); // El de hoy va primero

        // Cambiar orden a ASC (Más antiguos primero)
        const selectOrden = wrapper.findAll('select').at(1);
        await selectOrden.setValue('ASC');
        // El ID 4 va primero al evaluar sus fallbacks de fecha como 0 (tiempo epoch mínimo)
        expect(wrapper.vm.reportesFiltrados[0].id).toBe(4);

        // Cambiar filtro a Solo Mascotas Perdidas
        const selectFiltro = wrapper.findAll('select').at(0);
        await selectFiltro.setValue('PERDIDA');
        expect(wrapper.vm.reportesFiltrados.every(r => r.tipoReporte === 'PERDIDA')).toBe(true);

        // Cambiar filtro a Solo Mascotas Encontradas (Debe agrupar ENCONTRADA y ENCONTRADO)
        await selectFiltro.setValue('ENCONTRADA');
        expect(wrapper.vm.reportesFiltrados.length).toBe(2);
    });

    it('7. Debe renderizar filas vacías con mensajes dinámicos si no hay elementos', async () => {
        // Escenario A: Base de datos totalmente vacía
        storeEstadoMocados.reportes = [];
        let wrapper = mountComponent();
        expect(wrapper.text()).toContain('No hay reportes registrados actualmente en la base de datos.');

        // Escenario B: Hay reportes pero el filtro no devuelve coincidencias
        storeEstadoMocados.reportes = [{ id: 9, tipoReporte: 'PERDIDA', fechaReporte: hoyString }];
        wrapper = mountComponent();
        const selectFiltro = wrapper.find('.custom-select');
        await selectFiltro.setValue('ENCONTRADA');
        expect(wrapper.text()).toContain('No hay reportes que coincidan con los filtros actuales.');
    });

    it('8. Debe abrir la modal, confirmar la eliminación con éxito y actualizar la interfaz', async () => {
        // Creamos una promesa controlada manualmente para pausar el hilo asíncrono
        let resolverEliminacion;
        const promesaControlada = new Promise((resolve) => {
            resolverEliminacion = resolve;
        });
        storeEstadoMocados.eliminarReporte.mockReturnValueOnce(promesaControlada);

        const wrapper = mountComponent();

        // Validamos que la modal esté oculta inicialmente
        expect(wrapper.find('.modal-overlay').exists()).toBe(false);

        // Hacemos clic en el botón de eliminar de la primera fila (ID 1: Firulais)
        await wrapper.find('.btn-delete').trigger('click');
        expect(wrapper.find('.modal-overlay').exists()).toBe(true);
        expect(wrapper.find('.modal-box h3').text()).toBe('Eliminar Reporte');
        expect(wrapper.find('.modal-box').text()).toContain('Firulais');

        // Pulsamos el botón Confirmar y Eliminar dentro de la modal
        const btnConfirmar = wrapper.find('.btn-danger');
        await btnConfirmar.trigger('click');

        // Ahora sí se queda pausado en el "await store.eliminarReporte" y podemos capturar el estado de carga
        expect(wrapper.vm.eliminando).toBe(true);

        // Liberamos la promesa del store para que termine el flujo
        resolverEliminacion();
        await flushPromises();

        expect(storeEstadoMocados.eliminarReporte).toHaveBeenCalledWith(1);
        expect(wrapper.find('.modal-overlay').exists()).toBe(false); // Modal cerrada con éxito
        expect(wrapper.vm.eliminando).toBe(false); // Bandera limpia tras el finally
    });

    it('9. Debe cerrar la modal de eliminación sin ejecutar acciones al pulsar cancelar', async () => {
        const wrapper = mountComponent();

        await wrapper.find('.btn-delete').trigger('click');
        expect(wrapper.find('.modal-overlay').exists()).toBe(true);

        // Pulsamos el botón cancelar del pie de la modal
        await wrapper.find('.modal-footer .btn-secondary').trigger('click');
        expect(wrapper.find('.modal-overlay').exists()).toBe(false);
        expect(storeEstadoMocados.eliminarReporte).not.toHaveBeenCalled();
    });

    it('10. Debe manejar errores de excepción controlados en el catch si falla la eliminación en el store', async () => {
        storeEstadoMocados.eliminarReporte.mockRejectedValueOnce(new Error('Fallo de base de datos distribuidora'));
        const wrapper = mountComponent();

        await wrapper.find('.btn-delete').trigger('click');
        // Intentamos ejecutar la eliminación
        await wrapper.find('.btn-danger').trigger('click');
        await flushPromises();

        expect(console.error).toHaveBeenCalledWith("Falló la eliminación", expect.any(Error));
        // La bandera vuelve a su estado normal tras el bloque finally
        expect(wrapper.vm.eliminando).toBe(false);
    });

    it('11. Debe retornar de inmediato en ejecutarEliminacion si no hay un reporte seleccionado previamente', async () => {
        const wrapper = mountComponent();
        // Invocamos directamente la función interna de la instancia sin haber abierto la modal antes
        await wrapper.vm.ejecutarEliminacion();

        expect(storeEstadoMocados.eliminarReporte).not.toHaveBeenCalled();
        expect(wrapper.vm.eliminando).toBe(false);
    });
});