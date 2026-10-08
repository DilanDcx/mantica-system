import React, { useEffect, useState } from 'react';
import { AlertCircle, Building2, Save } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const valoresIniciales = {
  name: '',
  address: '',
  logo_url: '',
  hours_title: '',
  weekday_label: '',
  weekday_hours: '',
  saturday_label: '',
  saturday_hours: '',
  emergency_label: '',
  emergency_hours: '',
  emergency_phone_label: '',
  emergency_phone: '',
  information_label: '',
  information_phone: '',
  campaign_title: '',
  campaign_text: '',
  mission_title: '',
  mission_text: '',
  certification_title: '',
  certification_text: '',
};

const camposHorarioYContacto = [
  { name: 'hours_title', label: 'Título de horarios', maxLength: 100 },
  { name: 'weekday_label', label: 'Días entre semana', maxLength: 100 },
  { name: 'weekday_hours', label: 'Horario de lunes a viernes', maxLength: 100 },
  { name: 'saturday_label', label: 'Días de fin de semana', maxLength: 100 },
  { name: 'saturday_hours', label: 'Horario de sábados', maxLength: 100 },
  { name: 'emergency_label', label: 'Etiqueta de emergencias', maxLength: 100 },
  { name: 'emergency_hours', label: 'Horario de emergencias', maxLength: 100 },
  {
    name: 'emergency_phone_label',
    label: 'Etiqueta del teléfono de emergencias',
    maxLength: 100,
  },
  { name: 'emergency_phone', label: 'Teléfono de emergencias', maxLength: 50 },
  { name: 'information_label', label: 'Etiqueta de información', maxLength: 100 },
  { name: 'information_phone', label: 'Teléfono de información', maxLength: 50 },
];

export default function InstitutionalSettingsPage() {
  const [datos, setDatos] = useState(valoresIniciales);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const prepararDatos = (datosRecibidos = {}) => {
    const configuracion = {};

    Object.keys(valoresIniciales).forEach((campo) => {
      configuracion[campo] = datosRecibidos[campo] ?? '';
    });

    return configuracion;
  };

  const cargarConfiguracion = async () => {
    setCargando(true);
    setError('');

    try {
      const response = await axiosClient.get('/institutional-config/');
      setDatos(prepararDatos(response.data));
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

    setDatos((actuales) => ({
      ...actuales,
      [name]: value,
    }));

    setMensaje('');
  };

  const guardarConfiguracion = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      const response = await axiosClient.patch(
        '/institutional-config/',
        datos
      );

      setDatos(prepararDatos(response.data));
      setMensaje('La configuración institucional se guardó correctamente.');
    } catch (err) {
      console.error('Error al guardar la configuración institucional:', err);

      const errores = err.response?.data;
      const primerError =
        errores?.detail ||
        Object.values(errores || {})
          .flat()
          .find((valor) => typeof valor === 'string');

      setError(
        primerError ||
          'No se pudo guardar la configuración. Comprueba que tengas permisos de administrador.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const campoTexto = ({ name, label, maxLength }) => (
    <label
      key={name}
      className="block text-xs font-semibold text-slate-600"
    >
      {label}
      <input
        type="text"
        name={name}
        value={datos[name]}
        onChange={cambiarDato}
        maxLength={maxLength}
        disabled={cargando || guardando}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
      />
    </label>
  );

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#0F3E48]">
          <Building2 className="h-6 w-6 text-[#20C4BA]" />
          Configuración institucional
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Actualiza los datos institucionales y la información que aparece en el
          panel principal.
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
        className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      >
        <section className="space-y-4">
          <h2 className="text-base font-bold text-[#0F3E48]">
            Identificación del centro
          </h2>

          <label className="block text-xs font-semibold text-slate-600">
            Nombre del centro de salud
            <input
              type="text"
              name="name"
              value={datos.name}
              onChange={cambiarDato}
              required
              maxLength={200}
              disabled={cargando || guardando}
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
              disabled={cargando || guardando}
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
              disabled={cargando || guardando}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
            />
          </label>

          {datos.logo_url && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold text-slate-600">
                Vista previa del logo
              </p>
              <img
                src={datos.logo_url}
                alt="Vista previa del logo institucional"
                className="h-24 max-w-full object-contain"
              />
            </div>
          )}
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-5">
          <h2 className="text-base font-bold text-[#0F3E48]">
            Horarios y teléfonos
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {camposHorarioYContacto.map(campoTexto)}
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-5">
          <h2 className="text-base font-bold text-[#0F3E48]">
            Campaña de vacunación
          </h2>

          {campoTexto({
            name: 'campaign_title',
            label: 'Título de la campaña',
            maxLength: 200,
          })}

          <label className="block text-xs font-semibold text-slate-600">
            Descripción de la campaña
            <textarea
              name="campaign_text"
              value={datos.campaign_text}
              onChange={cambiarDato}
              rows={3}
              disabled={cargando || guardando}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
            />
          </label>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-5">
          <h2 className="text-base font-bold text-[#0F3E48]">
            Misión
          </h2>

          {campoTexto({
            name: 'mission_title',
            label: 'Título de la sección',
            maxLength: 100,
          })}

          <label className="block text-xs font-semibold text-slate-600">
            Texto de la misión
            <textarea
              name="mission_text"
              value={datos.mission_text}
              onChange={cambiarDato}
              rows={5}
              disabled={cargando || guardando}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] disabled:bg-slate-50"
            />
          </label>
        </section>

        <section className="space-y-4 border-t border-slate-100 pt-5">
          <h2 className="text-base font-bold text-[#0F3E48]">
            Certificación
          </h2>

          {campoTexto({
            name: 'certification_title',
            label: 'Título de la certificación',
            maxLength: 200,
          })}

          {campoTexto({
            name: 'certification_text',
            label: 'Descripción de la certificación',
            maxLength: 200,
          })}
        </section>

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