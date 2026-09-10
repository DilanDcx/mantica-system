import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function RescheduleModal({ isOpen, onClose, appointment, onRescheduled }) {
  const { isDark } = useTheme();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(appointment?.duration_minutes || 30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const scheduled_at = `${date}T${time}:00`;
      await axiosClient.post(`/appointments/${appointment.id}/reschedule/`, {
        scheduled_at,
        duration_minutes: parseInt(duration, 10),
      });

      if (onRescheduled) onRescheduled();
      onClose();
    } catch (err) {
      if (err.response?.data?.scheduled_at) {
        setError(Array.isArray(err.response.data.scheduled_at) ? err.response.data.scheduled_at[0] : err.response.data.scheduled_at);
      } else {
        setError('Error al reprogramar la cita. Verifique la disponibilidad.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-[24px] shadow-2xl p-6 border transition-colors ${
        isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/30">
          <div>
            <h2 className="text-base font-bold">Reprogramar Cita</h2>
            <p className="text-[11px] text-slate-400">Paciente: {appointment.patient_name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-rose-950/40 border-rose-900 text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" /> Nueva Fecha *
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl outline-none border ${
                  isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Nueva Hora *
              </label>
              <input
                required
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl outline-none border ${
                  isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Duración (min)</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl outline-none border ${
                isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-700/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-slate-400 hover:text-slate-200 border-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Reprogramar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}