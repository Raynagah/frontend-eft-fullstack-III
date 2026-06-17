import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import UsuariosAdminView from '../../views/admin/UsuariosAdminView.vue';

enableAutoUnmount(afterEach);

// 1. Mocks de Vue Router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockPush
    })
}));

// 2. Estado de datos mocado dinámicamente para el Store de Pinia
let storeMocado = {
    usuarios: [],
    cargando: false,
    error: null,
    totalUsuarios: 0,
    totalAdministradores: 0,
    totalClientes: 0,
    cargarUsuarios: vi.fn(),
    eliminarUsuario: vi.fn()
};

vi.mock('../../stores/usuarioAdminStore', () => ({
    useUsuarioAdminStore: () => storeMocado
}));

describe('UsuariosAdminView.vue', () => {
    const listadoUsuariosDePrueba = [
        { id: 1, nombre: 'Ana', correo: 'ana@test.com', telefono: '9999', ocupacion: 'Doctora', cantidadReportes: 5, tipoUsuario: 'admin' },
        { id: 2, nombre: 'Carlos', correo: 'carlos@test.com', telefono: null, ocupacion: 'Abogado', cantidadReportes: 2, tipoUsuario: 'cliente' },
        { id: 3, nombre: 'Bruno', correo: 'bruno@test.com', telefono: '1111', ocupacion: '', cantidadReportes: 0, tipoUsuario: 'cliente' },
        { id: 4, nombre: 'Zoe', correo: 'zoe@test.com', telefono: '2222', ocupacion: null, cantidadReportes: 10, tipoUsuario: 'admin' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Restablecer de forma explícita todos los estados del store antes de cada test
        storeMocado.usuarios = [...listadoUsuariosDePrueba];
        storeMocado.cargando = false;
        storeMocado.error = null;
        storeMocado.totalUsuarios = 4;
        storeMocado.totalAdministradores = 2;
        storeMocado.totalClientes = 2;
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    const mountComponent = () => mount(UsuariosAdminView);

    it('1. Debe llamar a cargarUsuarios al montarse (onMounted)', () => {
        mountComponent();
        expect(storeMocado.cargarUsuarios).toHaveBeenCalledTimes(1);
    });

    it('2. Debe renderizar correctamente los estados de carga y error de conexión', () => {
        // Caso de carga activa
        storeMocado.cargando = true;
        let wrapper = mountComponent();
        expect(wrapper.find('.state-container.loading').exists()).toBe(true);

        // Caso de error activo
        storeMocado.cargando = false;
        storeMocado.error = 'Fallo de pasarela 502';
        wrapper = mountComponent();
        expect(wrapper.find('.state-container.error').exists()).toBe(true);
        expect(wrapper.text()).toContain('Fallo de pasarela 502');
    });

    it('3. Debe extraer correctamente una lista ordenada de ocupaciones únicas', () => {
        const wrapper = mountComponent();
        // Filtra cadenas vacías o valores nulos y ordena alfabéticamente
        expect(wrapper.vm.ocupacionesUnicas).toEqual(['Abogado', 'Doctora']);
    });

    it('4. Debe retornar una lista vacía en las propiedades computadas si store.usuarios no está definido', () => {
        storeMocado.usuarios = null;
        const wrapper = mountComponent();
        expect(wrapper.vm.ocupacionesUnicas).toEqual([]);
        expect(wrapper.vm.usuariosProcesados).toEqual([]);
    });

    it('5. Debe filtrar correctamente por rol y por ocupación', async () => {
        const wrapper = mountComponent();

        // Obtenemos todos los selectores personalizados
        const selects = wrapper.findAll('.custom-select');
        const selectRol = selects[0];       // Primer select del template (filtroRol)
        const selectOcupacion = selects[1]; // Segundo select del template (filtroOcupacion)

        // Filtrar por rol 'admin'
        await selectRol.setValue('admin');
        expect(wrapper.vm.usuariosProcesados.length).toBe(2);
        expect(wrapper.vm.usuariosProcesados.every(u => u.tipoUsuario === 'admin')).toBe(true);

        // Filtrar también por ocupación 'Doctora'
        await selectOcupacion.setValue('Doctora');
        expect(wrapper.vm.usuariosProcesados.length).toBe(1);
        expect(wrapper.vm.usuariosProcesados[0].nombre).toBe('Ana');
    });

    it('6. Debe ejecutar todas las ramas de ordenamiento múltiple (A-Z, Z-A, reportes y ocupación)', async () => {
        const wrapper = mountComponent();

        // Buscamos directamente la clase específica del select de ordenamiento (.sort-select)
        const selectOrden = wrapper.find('.sort-select');

        // Nombre descendente (Z-A)
        await selectOrden.setValue('nombre_desc');
        expect(wrapper.vm.usuariosProcesados[0].nombre).toBe('Zoe');

        // Tipo de usuario / Rol ascendente
        await selectOrden.setValue('tipoUsuario_asc');
        expect(wrapper.vm.usuariosProcesados[0].tipoUsuario).toBe('admin');

        // Reportes descendente (Más reportes)
        await selectOrden.setValue('reportes_desc');
        expect(wrapper.vm.usuariosProcesados[0].cantidadReportes).toBe(10); // Zoe (10)

        // Reportes ascendente (Menos reportes)
        await selectOrden.setValue('reportes_asc');
        expect(wrapper.vm.usuariosProcesados[0].cantidadReportes).toBe(0);  // Bruno (0)

        // Ocupación ascendente (Maneja los null / vacíos mandándolos al final como 'Z_Sin especificar')
        await selectOrden.setValue('ocupacion_asc');
        expect(wrapper.vm.usuariosProcesados[0].ocupacion).toBe('Abogado');
    });

    it('7. Debe mostrar una fila vacía si ningún usuario cumple con los filtros', async () => {
        const wrapper = mountComponent();

        const selects = wrapper.findAll('.custom-select');
        const selectRol = selects[0];
        const selectOcupacion = selects[1];

        await selectRol.setValue('cliente');
        await selectOcupacion.setValue('Doctora');

        expect(wrapper.vm.usuariosProcesados.length).toBe(0);
        expect(wrapper.text()).toContain('No se encontraron usuarios con esos criterios.');
    });

    it('8. Debe redirigir a las rutas correctas al presionar los botones de navegar, crear y editar', async () => {
        const wrapper = mountComponent();

        // Botón Volver al Dashboard
        await wrapper.find('.btn-back').trigger('click');
        expect(mockPush).toHaveBeenCalledWith('/admin');

        // Botón Crear Nuevo Usuario
        await wrapper.find('.page-header .btn-primary').trigger('click');
        expect(mockPush).toHaveBeenCalledWith('/admin/usuarios/nuevo');

        // Botón Editar de la primera celda (ID 1)
        await wrapper.find('.btn-edit').trigger('click');
        expect(mockPush).toHaveBeenCalledWith('/admin/usuarios/editar/1');
    });

    it('9. Debe abrir y cerrar la modal de eliminación correctamente sin ejecutar mutaciones', async () => {
        const wrapper = mountComponent();

        expect(wrapper.find('.modal-overlay').exists()).toBe(false);

        // Abrir modal usando el botón de la primera fila
        await wrapper.find('.btn-delete').trigger('click');
        expect(wrapper.find('.modal-overlay').exists()).toBe(true);
        expect(wrapper.find('.modal-box').text()).toContain('Ana');

        // Cancelar cierre
        await wrapper.find('.modal-footer .btn-secondary').trigger('click');
        expect(wrapper.find('.modal-overlay').exists()).toBe(false);
        expect(storeMocado.eliminarUsuario).not.toHaveBeenCalled();
    });

    it('10. Debe confirmar la eliminación, manejar el estado cargando con promesas suspendidas y cerrar la modal', async () => {
        let liberarPromesa;
        const promesaControlada = new Promise((resolve) => { liberarPromesa = resolve; });
        storeMocado.eliminarUsuario.mockReturnValueOnce(promesaControlada);

        const wrapper = mountComponent();
        await wrapper.find('.btn-delete').trigger('click'); // Selecciona a Ana

        // Confirmar eliminación
        await wrapper.find('.modal-footer .btn-danger').trigger('click');
        expect(wrapper.vm.eliminando).toBe(true); // Se detiene con éxito en el estado de carga

        liberarPromesa();
        await flushPromises();

        expect(storeMocado.eliminarUsuario).toHaveBeenCalledWith(1);
        expect(wrapper.find('.modal-overlay').exists()).toBe(false);
        expect(wrapper.vm.eliminando).toBe(false);
    });

    it('11. Debe capturar errores controlados en el catch si la eliminación falla en el servidor', async () => {
        storeMocado.eliminarUsuario.mockRejectedValueOnce(new Error('Internal Server Error 500'));
        const wrapper = mountComponent();

        await wrapper.find('.btn-delete').trigger('click');
        await wrapper.find('.modal-footer .btn-danger').trigger('click');
        await flushPromises();

        expect(console.error).toHaveBeenCalledWith("Falló la eliminación", expect.any(Error));
        expect(wrapper.vm.eliminando).toBe(false);
    });

    it('12. Debe salir inmediatamente de ejecutarEliminacion si la variable de usuario seleccionado está vacía', async () => {
        const wrapper = mountComponent();
        await wrapper.vm.ejecutarEliminacion();

        expect(storeMocado.eliminarUsuario).not.toHaveBeenCalled();
        expect(wrapper.vm.eliminando).toBe(false);
    });
});