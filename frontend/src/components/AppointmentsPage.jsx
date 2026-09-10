import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  PlusCircle, 
  Clock, 
  User, 
  Stethoscope, 
  AlertCircle, 
  RefreshCw, 
  CalendarClock, 
  XCircle,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Filter
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';
import ScheduleAppointmentModal from './ScheduleAppointmentModal';
import RescheduleModal from './RescheduleModal';

export default function AppointmentsPage() {
  const { isDark } = useTheme();

  const todayStr = new Date().toISOString().split('T')[0];

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState(null);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const [confirmCancelApt, setConfirmCancelApt] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await axiosClient.get('/appointments/doctors-list/');
        setDoctors(res.data || []);
      } catch (e) {
        console.error('Error al cargar médicos:', e);
      }
    };
    loadDoctors();
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedDoctor) params.append('doctor', selectedDoctor);

      const res = await axiosClient.get(`/appointments/?${params.toString()}`);
      const list = res.data.results ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setAppointments(list);
    } catch (err) {
      setError('No se pudo cargar la agenda diaria de citas médicas.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDoctor]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const showToast = (title, message) => {
    setToastMessage({ title, message });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleMarkArrived = async (aptId) => {
    try {
      await axiosClient.post(`/appointments/${aptId}/mark-arrived/`);
      showToast('Paciente en sala', 'Se registró la presencia del paciente en sala de espera.');
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al registrar la llegada del paciente.');
    }
  };

  const handleCompleteAppointment = async (aptId) => {
    try {
      await axiosClient.post(`/appointments/${aptId}/complete/`);
      showToast('Cita completada', 'La atención médica ha finalizado con éxito.');
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al completar la cita médica.');
    }
  };

  const handleExecuteCancel = async () => {
    if (!confirmCancelApt) return;
    setCancelling(true);
    try {
      await axiosClient.post(`/appointments/${confirmCancelApt.id}/cancel/`);
      setConfirmCancelApt(null);
      showToast('Cita cancelada con éxito', 'El bloque de horario ha quedado disponible en la agenda.');
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.detail || 'No se pudo cancelar la cita médica.');
    } finally {
      setCancelling(false);
    }
  };

  const stats = {
    total: appointments.length,
    waiting: appointments.filter(a => a.status === 'WAITING').length,
    scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      {/* Toast Flotante */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md bg-[#0F172A]/95 border-teal-500/30 text-white transition-all animate-in fade-in slide-in-from-top-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight">{toastMessage.title}</div>
            <div className="text-[11px] text-teal-300 font-medium leading-snug">{toastMessage.message}</div>
          </div>
        </div>
      )}

      {/* Modal de Cancelación */}
      {confirmCancelApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-[24px] shadow-2xl border p-5 transition-all ${
            isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black">¿Cancelar cita médica?</h3>
                <p className="text-[11px] text-slate-400 leading-tight">Esta acción liberará el espacio de consulta.</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border my-3 text-xs ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="font-bold text-teal-400">{confirmCancelApt.patient_name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {confirmCancelApt.scheduled_at_formatted} con Dr(a). {confirmCancelApt.doctor_name}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setConfirmCancelApt(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                No, mantener
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleExecuteCancel}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-950"
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar cita'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            Tablero de Agenda Diaria
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Control de asistencia, carga diaria por especialista y recepción en sala
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-all cursor-pointer ${
            isDark ? 'bg-[#0D9488] hover:bg-[#0F766E]' : 'bg-[#20C4BA] hover:bg-[#1bb0a7]'
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Programar Cita
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          <div className={`text-xl font-black mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{stats.total}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50/60 border-amber-200 text-amber-900'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">En Sala</span>
          <div className="text-xl font-black mt-1">{stats.waiting}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? 'bg-sky-950/20 border-sky-900/40 text-sky-300' : 'bg-sky-50/60 border-sky-200 text-sky-900'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Pendientes</span>
          <div className="text-xl font-black mt-1">{stats.scheduled}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Completadas</span>
          <div className="text-xl font-black mt-1">{stats.completed}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition-colors ${
          isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50/60 border-rose-200 text-rose-900'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Canceladas</span>
          <div className="text-xl font-black mt-1">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
        isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span>Filtros:</span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs outline-none border ${
              isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />

          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs outline-none border ${
              isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="">Todos los médicos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                Dr(a). {d.first_name} {d.last_name || d.username}
              </option>
            ))}
          </select>

          {(selectedDoctor || selectedDate !== todayStr) && (
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                setSelectedDoctor('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Restablecer a hoy
            </button>
          )}
        </div>

        <button
          onClick={fetchAppointments}
          disabled={loading}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            isDark ? 'border-slate-700 text-slate-400 hover:text-teal-400' : 'border-slate-200 text-slate-500 hover:text-[#20C4BA]'
          }`}
          title="Refrescar agenda"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border bg-rose-950/40 border-rose-900 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Citas */}
      <div className="space-y-3">
        {loading ? (
          <div className={`py-12 text-center rounded-2xl border text-xs ${
            isDark ? 'bg-[#0F172A] border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-400'
          }`}>
            Cargando agenda de citas...
          </div>
        ) : appointments.length === 0 ? (
          <div className={`py-12 text-center rounded-2xl border text-xs ${
            isDark ? 'bg-[#0F172A] border-slate-800 text-slate-400' : 'bg-white border-slate-100 text-slate-400'
          }`}>
            No hay citas registradas para este criterio de búsqueda.
          </div>
        ) : (
          appointments.map((apt) => {
            const isWaiting = apt.status === 'WAITING';
            const isScheduled = apt.status === 'SCHEDULED';
            const isCompleted = apt.status === 'COMPLETED';
            const isCancelled = apt.status === 'CANCELLED';

            return (
              <div
                key={apt.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isWaiting 
                    ? isDark ? 'bg-amber-950/20 border-amber-800/60' : 'bg-amber-50/50 border-amber-200'
                    : isCompleted
                    ? isDark ? 'bg-emerald-950/15 border-emerald-800/40' : 'bg-emerald-50/40 border-emerald-200'
                    : isDark ? 'bg-[#0F172A] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                    isWaiting
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : isDark ? 'bg-teal-950/60 text-teal-400 border border-teal-800/60' : 'bg-teal-50 text-[#14958D]'
                  }`}>
                    {isWaiting ? <UserCheck className="w-5 h-5" /> : isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black ${
                        isWaiting ? 'text-amber-400' : isCompleted ? 'text-emerald-400' : isDark ? 'text-teal-400' : 'text-[#14958D]'
                      }`}>
                        {apt.scheduled_at_formatted}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-800 text-slate-300">
                        {apt.duration_minutes} min
                      </span>
                    </div>
                    <h3 className={`text-sm font-bold mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      {apt.patient_name}
                    </h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                      <span>Dr(a). {apt.doctor_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="text-xs sm:text-right max-w-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Motivo:</span>
                    <p className={`truncate font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {apt.reason}
                    </p>
                    
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                      isWaiting 
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : isCompleted
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : isScheduled
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {isWaiting ? 'En Sala de Espera' : isCompleted ? 'Completada' : isScheduled ? 'Programada' : 'Cancelada'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 sm:pt-0">
                    {/* Botón Marcar Llegada */}
                    {isScheduled && (
                      <button
                        onClick={() => handleMarkArrived(apt.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                        title="Marcar paciente en sala de espera"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Llegó</span>
                      </button>
                    )}

                    {/* Botón Finalizar Atención */}
                    {(isWaiting || isScheduled) && (
                      <button
                        onClick={() => handleCompleteAppointment(apt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                        title="Marcar consulta como completada"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Finalizar</span>
                      </button>
                    )}

                    {/* Reprogramar y Cancelar */}
                    {!isCancelled && !isCompleted && (
                      <>
                        <button
                          onClick={() => setRescheduleApt(apt)}
                          title="Reprogramar fecha y hora"
                          className="p-2 rounded-xl text-teal-400 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/30 transition-all cursor-pointer"
                        >
                          <CalendarClock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmCancelApt(apt)}
                          title="Cancelar cita médica"
                          className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ScheduleAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAppointmentCreated={fetchAppointments}
      />

      <RescheduleModal
        isOpen={Boolean(rescheduleApt)}
        onClose={() => setRescheduleApt(null)}
        appointment={rescheduleApt}
        onRescheduled={() => {
          showToast('Cita reprogramada', 'El nuevo horario se guardó correctamente.');
          fetchAppointments();
        }}
      />
    </div>
  );
}