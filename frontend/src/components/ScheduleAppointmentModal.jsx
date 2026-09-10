import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Check, 
  UserX 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function ScheduleAppointmentModal({ isOpen, onClose, onAppointmentCreated }) {
  const { isDark } = useTheme();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del Buscador de Paciente
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    doctor: '',
    date: '',
    time: '',
    duration_minutes: 30,
    reason: '',
  });

  // Cerrar dropdown si se hace click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      setError('');
      setSuccess('');
      setSelectedPatient(null);
      setPatientSearch('');
      setPatientResults([]);
      setShowDropdown(false);
    }
  }, [isOpen]);

  const fetchDoctors = async () => {
    try {
      const res = await axiosClient.get('/appointments/doctors-list/');
      setDoctors(res.data || []);
    } catch (err) {
      setError('No se pudo cargar la lista de médicos.');
    }
  };

  // Búsqueda reactiva con Debounce hacia /patients/?search=...
  useEffect(() => {
    if (selectedPatient) return;
    
    const query = patientSearch.trim();
    if (!query) {
      setPatientResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await axiosClient.get(`/patients/?search=${encodeURIComponent(query)}&page_size=8`);
        const list = res.data.results ? res.data.results : (Array.isArray(res.data) ? res.data : []);
        setPatientResults(list);
        setShowDropdown(true);
      } catch (e) {
        console.error('Error al buscar pacientes:', e);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch, selectedPatient]);

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.first_name} ${patient.last_name}`);
    setShowDropdown(false);
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedPatient) {
      setError('Debe seleccionar un paciente de la lista.');
      return;
    }

    setLoading(true);

    try {
      const scheduled_at = `${formData.date}T${formData.time}:00`;

      await axiosClient.post('/appointments/', {
        patient: selectedPatient.id,
        doctor: formData.doctor,
        scheduled_at: scheduled_at,
        duration_minutes: parseInt(formData.duration_minutes, 10),
        reason: formData.reason,
      });

      setSuccess('¡Cita médica programada con éxito!');
      setTimeout(() => {
        if (onAppointmentCreated) onAppointmentCreated();
        onClose();
      }, 1200);
    } catch (err) {
      if (err.response?.data?.scheduled_at) {
        setError(Array.isArray(err.response.data.scheduled_at) ? err.response.data.scheduled_at[0] : err.response.data.scheduled_at);
      } else if (err.response?.data?.patient) {
        setError(Array.isArray(err.response.data.patient) ? err.response.data.patient[0] : err.response.data.patient);
      } else {
        setError(err.response?.data?.detail || 'Error al programar la cita. Verifique la disponibilidad.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden my-8 border transition-colors ${
        isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        {/* Cabecera */}
        <div className={`px-6 py-5 flex items-center justify-between text-white ${
          isDark ? 'bg-[#131E31] border-b border-slate-800' : 'bg-[#20C4BA]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-slate-800 text-teal-400' : 'bg-white/20 text-white'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Programar Cita Médica</h2>
              <p className="text-[11px] opacity-80">Asignación con validación de agenda en tiempo real</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alertas */}
        {error && (
          <div className="m-5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-rose-950/40 border-rose-900 text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="m-5 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border bg-emerald-950/40 border-emerald-900 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Buscador de Paciente */}
          <div ref={searchContainerRef} className="relative">
            <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-teal-400" /> Paciente *
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Buscar por nombre, cédula o número de expediente..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  if (selectedPatient) setSelectedPatient(null);
                }}
                onFocus={() => {
                  if (patientResults.length > 0) setShowDropdown(true);
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl outline-none border transition-all ${
                  selectedPatient
                    ? isDark ? 'bg-teal-950/20 border-teal-500/50 text-teal-300' : 'bg-teal-50/50 border-teal-400 text-teal-900'
                    : isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-[#20C4BA]'
                }`}
              />

              {/* Botón para limpiar paciente seleccionado */}
              {selectedPatient && (
                <button
                  type="button"
                  onClick={handleClearSelectedPatient}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                  title="Cambiar paciente"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Menú Desplegable Flotante de Coincidencias */}
            {showDropdown && !selectedPatient && (
              <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-2xl shadow-2xl border ${
                isDark ? 'bg-[#131E31] border-slate-700/80 text-slate-200 divide-y divide-slate-800' : 'bg-white border-slate-200 text-slate-800 divide-y divide-slate-100'
              }`}>
                {searchingPatients ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    Buscando pacientes...
                  </div>
                ) : patientResults.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <UserX className="w-4 h-4 text-slate-500" />
                    <span>No se encontraron pacientes registrados</span>
                  </div>
                ) : (
                  patientResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${
                        isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Cédula: <span className="font-mono text-slate-300">{p.identification_card || 'S/C'}</span></span>
                          {p.medical_record_number && (
                            <>
                              <span>•</span>
                              <span>Exp: <span className="font-mono text-teal-400">{p.medical_record_number}</span></span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-teal-400 opacity-80">Seleccionar</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Badge de Confirmación de Selección */}
            {selectedPatient && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Paciente seleccionado: {selectedPatient.first_name} {selectedPatient.last_name} (Expediente: {selectedPatient.medical_record_number || 'General'})</span>
              </div>
            )}
          </div>

          {/* Médico Asignado */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" /> Médico Especialista *
            </label>
            <select
              required
              name="doctor"
              value={formData.doctor}
              onChange={handleInputChange}
              className={`w-full px-3 py-2.5 rounded-xl outline-none border ${
                isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="">Seleccione al médico...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr(a). {d.first_name} {d.last_name || d.username}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha, Hora y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-400" /> Fecha *
              </label>
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-xl outline-none border ${
                  isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Hora de Inicio *
              </label>
              <input
                required
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 rounded-xl outline-none border ${
                  isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Duración (min)</label>
              <select
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
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
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Motivo de la Cita *</label>
            <textarea
              required
              rows={2}
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Describa brevemente el motivo de la cita..."
              className={`w-full p-2.5 rounded-xl outline-none resize-none border ${
                isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
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
              {loading ? 'Validando...' : 'Confirmar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}