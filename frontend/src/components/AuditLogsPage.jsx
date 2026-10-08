import React, { useEffect, useState } from 'react';
import { AlertCircle, ClipboardList, RefreshCw, Search } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const filtrosVacios = {
  fecha_desde: '',
  fecha_hasta: '',
  usuario: '',
  modulo: '',
};

const etiquetasCampos = {
  notes: 'Notas',
  reason: 'Motivo',
  symptoms: 'Síntomas',
  diagnosis: 'Diagnóstico',
  is_active: 'Estado',
  weight_kg: 'Peso (kg)',
  height_m: 'Altura (m)',
  temperature_c: 'Temperatura (°C)',
  blood_pressure: 'Presión arterial',
  heart_rate_bpm: 'Frecuencia cardíaca (lpm)',
  treatment_plan: 'Plan de tratamiento',
  respiratory_rate: 'Frecuencia respiratoria (rpm)',
  oxygen_saturation: 'Saturación de oxígeno (%)',
  physical_examination: 'Examen físico',
};

const etiquetasAcciones = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Baja lógica',
  SOFT_DELETE: 'Baja lógica',
};

function mostrarCampo(campo) {
  if (etiquetasCampos[campo]) {
    return etiquetasCampos[campo];
  }

  return campo
    .replaceAll('_', ' ')
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

function mostrarAccion(accion) {
  if (!accion) {
    return '—';
  }

  const accionNormalizada = String(accion).toUpperCase();

  return (
    etiquetasAcciones[accionNormalizada] ||
    String(accion)
      .replaceAll('_', ' ')
      .replace(/^\w/, (letra) => letra.toUpperCase())
  );
}

function mostrarValor(valor, campo) {
  if (valor === null || valor === undefined || valor === '') {
    return '—';
  }

  if (typeof valor === 'boolean') {
    if (campo === 'is_active') {
      return valor ? 'Activo' : 'Inactivo';
    }

    return valor ? 'Sí' : 'No';
  }

  return typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
}

export default function AuditLogsPage() {
  const [registros, setRegistros] = useState([]);
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarRegistros = async (filtrosAplicados = filtrosVacios) => {
    setCargando(true);
    setError('');

    const params = Object.fromEntries(
      Object.entries(filtrosAplicados).filter(([, valor]) => valor)
    );

    try {
      const response = await axiosClient.get('/audit-logs/', { params });
      const datos = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setRegistros(datos);
    } catch (err) {
      console.error('Error al cargar la auditoría:', err);

      const errores = err.response?.data;
      setError(
        errores?.fecha_desde?.[0] ||
          errores?.fecha_hasta?.[0] ||
          errores?.detail ||
          'No se pudo cargar la bitácora. Comprueba la conexión y tu acceso.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cambiarFiltro = (evento) => {
    const { name, value } = evento.target;
    setFiltros((actuales) => ({ ...actuales, [name]: value }));
  };

  const aplicarFiltros = (evento) => {
    evento.preventDefault();
    cargarRegistros(filtros);
  };

  const limpiarFiltros = () => {
    setFiltros(filtrosVacios);
    cargarRegistros(filtrosVacios);
  };

  return (
    <main className="max-w-7xl mx-auto space-y-6 p-6">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h1 className="flex items-center gap-2 text-xl font-bold text-[#0F3E48]">
          <ClipboardList className="h-6 w-6 text-[#20C4BA]" />
          Bitácora de auditoría
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Consulta los cambios y las bajas lógicas registrados en las consultas clínicas.
        </p>
      </section>

      <form
        onSubmit={aplicarFiltros}
        className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="text-xs font-semibold text-slate-600">
          Desde
          <input
            type="date"
            name="fecha_desde"
            value={filtros.fecha_desde}
            onChange={cambiarFiltro}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA]"
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          Hasta
          <input
            type="date"
            name="fecha_hasta"
            value={filtros.fecha_hasta}
            onChange={cambiarFiltro}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA]"
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          Usuario
          <input
            type="text"
            name="usuario"
            value={filtros.usuario}
            onChange={cambiarFiltro}
            placeholder="Nombre de usuario"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA]"
          />
        </label>

        <label className="text-xs font-semibold text-slate-600">
          Módulo
          <select
            name="modulo"
            value={filtros.modulo}
            onChange={cambiarFiltro}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#20C4BA]"
          >
            <option value="">Todos</option>
            <option value="consultas">Consultas</option>
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={cargando}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#20C4BA] px-3 py-2 text-xs font-bold text-white hover:bg-[#1bb0a7] disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </button>
          <button
            type="button"
            onClick={limpiarFiltros}
            disabled={cargando}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Limpiar
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Fecha y hora</th>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Módulo</th>
                <th className="px-5 py-3">Acción</th>
                <th className="px-5 py-3">Expediente</th>
                <th className="px-5 py-3">Cambios registrados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-[#20C4BA]" />
                    Cargando bitácora...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr key={registro.id} className="align-top hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-4">
                      {new Date(registro.timestamp).toLocaleString('es-NI')}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      {registro.performed_by}
                    </td>
                    <td className="px-5 py-4">Consultas</td>
                    <td className="px-5 py-4">
                      {mostrarAccion(registro.action)}
                    </td>
                    <td className="px-5 py-4">{registro.record_number}</td>
                    <td className="min-w-64 px-5 py-4">
                      <details>
                        <summary className="cursor-pointer font-semibold text-[#14958D]">
                          Ver detalles
                        </summary>
                        <ul className="mt-2 space-y-2">
                          {Object.entries(registro.details || {}).map(
                            ([campo, valores]) => (
                              <li key={campo} className="break-words">
                                <span className="font-semibold">
                                  {mostrarCampo(campo)}:
                                </span>{' '}
                                {mostrarValor(valores?.old, campo)}
                                {' → '}
                                {mostrarValor(valores?.new, campo)}
                              </li>
                            )
                          )}
                        </ul>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}