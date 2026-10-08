import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Save } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const valoresIniciales = {
  name: '',
  address: '',
  logo_url: '',
};

export default function InstitutionalSettingsPage() {
  const [datos, setDatos] = useState(valoresIniciales);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarConfiguracion = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await axiosClient.get('/institutional-config/');
      setDatos({
        name: response.data.name || '',
        address: response.data.address || '',
        logo_url: response.data.logo_url || '',
      });
    } catch (err) {
      console.error('Error al cargar la configuración institucional:', err);
      setError('No se pudo cargar la configuración institucional.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cambiarDato = (evento) => {
    const { name, value } = evento.target;
    setDatos((actuales) => ({ ...actuales, [name]: value }));
    setMensaje('');
  };

  const guardarConfiguracion = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const response = await axiosClient.patch('/institutional-config/', datos);
      setDatos({
        name: response.data.name || '',
        address: response.data.address || '',
        logo_url: response.data.logo_url || '',
      });
      setMensaje('La configuración institucional se guardó correctamente.');
    } catch (err) {
      console.error('Error al guardar la configuración institucional:', err);
      const errores = err.response?.data;
      setError(
        errores?.name?.[0] ||
        errores?.address?.[0] ||
        errores?.logo_url?.[0] ||
        'No se pudo guardar la configuración. Comprueba que tengas permisos de administrador.'
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#0F3E48]">
          <Building2 className="h-6 w-6 text-[#20C4BA]" />
          Configuración institucional
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Actualiza el nombre, la dirección y el logo que identifican al centro de salud.
        </p>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mensaje && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
          {mensaje}
        </div>
      )}

      <form
        onSubmit={guardarConfiguracion}
        className="space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <label className="block text-xs font-semibold text-slate-600">
          Nombre del centro de salud
          <input
            type="text"
            name="name"
            value={datos.name}
            onChange={cambiarDato}
            required
            maxLength={200}
            disabled={cargando}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-600">
          Dirección
          <textarea
            name="address"
            value={datos.address}
            onChange={cambiarDato}
            maxLength={300}
            rows={3}
            disabled={cargando}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-600">
          URL del logo
          <input
            type="url"
            name="logo_url"
            value={datos.logo_url}
            onChange={cambiarDato}
            maxLength={500}
            placeholder="https://ejemplo.com/logo.png"
            disabled={cargando}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
          />
        </label>

        {datos.logo_url && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-semibold text-slate-600">Vista previa del logo</p>
            <img
              src={datos.logo_url}
              alt="Vista previa del logo institucional"
              className="h-24 max-w-full object-contain"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={cargando || guardando}
          className="flex items-center gap-2 rounded-xl bg-[#20C4BA] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1bb0a7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </main>
  );
}