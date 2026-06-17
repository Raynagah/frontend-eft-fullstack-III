import { render, screen, fireEvent } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import UsuarioForm from '../../components/admin/UsuarioForm.vue';

describe('Componente Admin: UsuarioForm.vue', () => {

    // --- TEST 1: MODO CREACIÓN ---
    it('1. Debe renderizar correctamente en modo creación (inputs vacíos, contraseña visible)', () => {
        render(UsuarioForm);

        expect(screen.getByLabelText(/Nombre Completo/i)).toBeTruthy();
        expect(screen.getByLabelText(/Correo Electrónico/i)).toBeTruthy();
        expect(screen.getByLabelText(/Contraseña de Acceso/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /Registrar Usuario/i })).toBeTruthy();
    });

    // --- TEST 2: MODO EDICIÓN ---
    it('2. Debe renderizar en modo edición, cargar datosIniciales y ocultar la contraseña', async () => {
        const mockDatos = {
            nombre: 'Admin Prueba',
            correo: 'admin@correo.com',
            telefono: '+56912345678',
            tipoUsuario: 'admin',
            edad: 35,
            genero: 'Otro',
            ocupacion: 'INSTITUCION',
            direccion: 'Av. Siempre Viva 742',
            fotoUrl: 'http://foto.com/perfil.jpg'
        };

        render(UsuarioForm, {
            props: {
                esEditar: true,
                datosIniciales: mockDatos
            }
        });

        // Esperamos a que Vue actualice el DOM con los datos de las props
        await nextTick();

        expect(screen.queryByLabelText(/Contraseña de Acceso/i)).toBeNull();

        const inputCorreo = screen.getByLabelText(/Correo Electrónico/i);
        expect(inputCorreo.disabled).toBe(true);

        expect(screen.getByDisplayValue('Admin Prueba')).toBeTruthy();
        expect(screen.getByDisplayValue('admin@correo.com')).toBeTruthy();
        expect(screen.getByDisplayValue('Otro')).toBeTruthy();

        expect(screen.getByRole('button', { name: /Actualizar Usuario/i })).toBeTruthy();
    });

    // --- TEST 3: EVENTO CANCELAR ---
    it('3. Debe emitir el evento "cancelar" al presionar el botón secundario', async () => {
        const { emitted } = render(UsuarioForm);

        const btnCancelar = screen.getByRole('button', { name: /Cancelar/i });
        await fireEvent.click(btnCancelar);

        expect(emitted()).toHaveProperty('cancelar');
    });

    // --- TEST 4: EVENTO GUARDAR (SUBMIT) ---
    it('4. Debe emitir "guardar" con el objeto del formulario completo al hacer submit', async () => {
        const { emitted } = render(UsuarioForm);

        const inputNombre = screen.getByLabelText(/Nombre Completo/i);
        await fireEvent.update(inputNombre, 'María López');

        const formulario = inputNombre.closest('form');
        await fireEvent.submit(formulario);

        expect(emitted()).toHaveProperty('guardar');

        const payloadEmision = emitted().guardar[0][0];
        expect(payloadEmision.nombre).toBe('María López');
        expect(payloadEmision.fotoUrl).toBe('https://cdn-icons-png.flaticon.com/512/149/149071.png');
    });

    // --- TEST 5: ESTADO DE CARGA ---
    it('5. Debe deshabilitar los botones y mostrar el loader si la prop "cargando" es true', () => {
        render(UsuarioForm, {
            props: { cargando: true }
        });

        const btnCancelar = screen.getByRole('button', { name: /Cancelar/i });
        const btnSubmit = screen.getByRole('button', { name: /Guardando.../i });

        expect(btnCancelar.disabled).toBe(true);
        expect(btnSubmit.disabled).toBe(true);
    });

    // --- TEST 6: REACTIVIDAD (WATCHER) ---
    it('6. Debe re-inicializar el formulario si la prop "datosIniciales" cambia externamente', async () => {
        const { rerender } = render(UsuarioForm, {
            props: {
                esEditar: true,
                datosIniciales: { nombre: 'Usuario Antiguo' }
            }
        });

        await nextTick(); // Esperamos a que se pinte el valor inicial
        expect(screen.getByDisplayValue('Usuario Antiguo')).toBeTruthy();

        await rerender({
            esEditar: true,
            datosIniciales: { nombre: 'Usuario Nuevo', correo: 'nuevo@correo.com' }
        });

        await nextTick(); // Esperamos a que reaccione el watcher y pinte el nuevo valor

        expect(screen.getByDisplayValue('Usuario Nuevo')).toBeTruthy();
        expect(screen.getByDisplayValue('nuevo@correo.com')).toBeTruthy();
    });

    // --- TEST 7: COBERTURA DE V-MODEL (TODOS LOS INPUTS) ---
  it('7. Debe actualizar todos los campos del formulario (v-model) correctamente', async () => {
    render(UsuarioForm);

    // Llenamos todos los campos enviando los "values" internos
    await fireEvent.update(screen.getByLabelText(/Correo Electrónico/i), 'nuevo@test.com');
    await fireEvent.update(screen.getByLabelText(/Teléfono de Contacto/i), '+56987654321');
    await fireEvent.update(screen.getByLabelText(/Rol del Sistema/i), 'cliente');
    await fireEvent.update(screen.getByLabelText(/Edad/i), '28');
    await fireEvent.update(screen.getByLabelText(/Género/i), 'Femenino');
    await fireEvent.update(screen.getByLabelText(/Ocupación/i), 'ESTUDIANTE');
    await fireEvent.update(screen.getByLabelText(/Dirección/i), 'Los Pinos 123');
    await fireEvent.update(screen.getByLabelText(/Contraseña de Acceso/i), 'claveSegura123');

    // Verificamos que los valores se hayan enlazado correctamente al DOM
    expect(screen.getByDisplayValue('nuevo@test.com')).toBeTruthy();
    expect(screen.getByDisplayValue('+56987654321')).toBeTruthy();
    expect(screen.getByDisplayValue('28')).toBeTruthy();
    expect(screen.getByDisplayValue('Femenino')).toBeTruthy();
    expect(screen.getByDisplayValue('Los Pinos 123')).toBeTruthy();
    expect(screen.getByDisplayValue('claveSegura123')).toBeTruthy();
    expect(screen.getByDisplayValue('Cliente (Usuario Común)')).toBeTruthy();
    expect(screen.getByDisplayValue('Estudiante')).toBeTruthy();
  });

  // --- TEST 8: COBERTURA DE FALLBACKS (|| '') ---
  it('8. Debe usar valores por defecto al editar si datosIniciales está vacío', async () => {
    render(UsuarioForm, {
      props: {
        esEditar: true,
        datosIniciales: {} // Pasamos un objeto vacío para forzar los `|| ''`
      }
    });

    await nextTick();

    // Comprobamos que el input nombre existe pero su valor es un string vacío
    const inputNombre = screen.getByLabelText(/Nombre Completo/i);
    expect(inputNombre.value).toBe('');
    
    // Podemos comprobar lo mismo con el tipoUsuario
    const selectRol = screen.getByLabelText(/Rol del Sistema/i);
    expect(selectRol.value).toBe('');
  });
});