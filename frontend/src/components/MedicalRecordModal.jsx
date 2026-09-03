import React, { useState } from 'react';
import { 
  X, User, Calendar, Activity, Phone, MapPin, Heart, 
  Thermometer, PlusCircle, CheckCircle2, ShieldAlert, History
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function MedicalRecordModal({ isOpen, onClose, record, onConsultationSaved }) {
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'history' | 'new_consultation'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    reason: '',
    symptoms: '',
    physical_examination: '',
    blood_pressure: '',
    weight_kg: '',
    temperature_c: '',
    heart_rate_bpm: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
  });

  if (!isOpen || !record) return null;

  const patient = record.patient || {};
  const lastConsultation = record.last_consultation;
  const consultations = record.consultations || [];

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateConsultation = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        medical_record: record.id,
        reason: formData.reason,
        symptoms: formData.symptoms,
        physical_examination: formData.physical_examination,
        blood_pressure: formData.blood_pressure || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        temperature_c: formData.temperature_c ? parseFloat(formData.temperature_c) : null,
        heart_rate_bpm: formData.heart_rate_bpm ? parseInt(formData.heart_rate_bpm, 10) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate, 10) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseFloat(formData.oxygen_saturation) : null,
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatment_plan,
        notes: formData.notes,
      };

      await axiosClient.post('/consultations/', payload);
      setActiveTab('info');
      if (onConsultationSaved) onConsultationSaved();
    } catch (err) {
      setError('Error al registrar la consulta. Verifique los campos obligatorios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden my-8 transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800 text-slate-100' 
          : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* Cabecera Mockup */}
        <div className={`px-6 py-5 flex items-center justify-between text-white transition-colors duration-200 ${
          isDark 
            ? 'bg-[#131E31] border-b border-slate-800' 
            : 'bg-[#20C4BA]'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-slate-800 text-teal-400 border border-slate-700' : 'bg-white/20 text-white'
            }`}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-snug">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                  isDark ? 'bg-slate-800 text-teal-300' : 'bg-teal-800/20 text-white'
                }`}>
                  {record.record_number} - {patient.identification_card}
                </span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-white/20 text-white'
                }`}>
                  {patient.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className={`flex border-b px-6 pt-3 gap-6 text-xs font-bold transition-colors ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info' 
                ? isDark ? 'border-teal-400 text-teal-400' : 'border-[#20C4BA] text-[#20C4BA]'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Info General
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history' 
                ? isDark ? 'border-teal-400 text-teal-400' : 'border-[#20C4BA] text-[#20C4BA]'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Historial de Visitas ({consultations.length})
          </button>
          <button
            onClick={() => setActiveTab('new_consultation')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'new_consultation' 
                ? isDark ? 'border-teal-400 text-teal-400' : 'border-[#20C4BA] text-[#20C4BA]'
                : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Registrar Consulta
          </button>
        </div>

        {/* Contenido según Pestaña */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: INFO GENERAL */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Fecha de Nacimiento
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {patient.birth_date || 'N/A'}
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <User className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Edad
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {calculateAge(patient.birth_date)}
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <User className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Sexo
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Phone className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Teléfono
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {patient.phone_number || 'N/A'}
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Heart className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Tipo de Sangre
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {patient.blood_type || 'No registrado'}
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Última Visita
                  </div>
                  <div className={`text-xs font-bold mt-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {lastConsultation?.consultation_date_formatted || 'Sin atenciones'}
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className={`p-3 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Dirección
                </div>
                <div className={`text-xs font-semibold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {patient.address || 'No registrada'}
                </div>
              </div>

              {/* Últimos Signos Vitales */}
              <div className="pt-2">
                <h4 className={`text-xs font-bold flex items-center gap-1.5 mb-2.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  <Activity className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} /> Últimos Signos Vitales
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({lastConsultation?.consultation_date_formatted || 'Sin registros'})
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className={`p-3 rounded-2xl text-center border transition-colors ${
                    isDark ? 'bg-teal-950/40 border-teal-900/60' : 'bg-teal-50/50 border-teal-100'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Presión Arterial</div>
                    <div className={`text-xs font-black mt-1 ${isDark ? 'text-teal-300' : 'text-[#14958D]'}`}>
                      {lastConsultation?.blood_pressure || '--/-- mmHg'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl text-center border transition-colors ${
                    isDark ? 'bg-teal-950/40 border-teal-900/60' : 'bg-teal-50/50 border-teal-100'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Peso</div>
                    <div className={`text-xs font-black mt-1 ${isDark ? 'text-teal-300' : 'text-[#14958D]'}`}>
                      {lastConsultation?.weight_kg ? `${lastConsultation.weight_kg} kg` : '-- kg'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl text-center border transition-colors ${
                    isDark ? 'bg-teal-950/40 border-teal-900/60' : 'bg-teal-50/50 border-teal-100'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Temperatura</div>
                    <div className={`text-xs font-black mt-1 ${isDark ? 'text-teal-300' : 'text-[#14958D]'}`}>
                      {lastConsultation?.temperature_c ? `${lastConsultation.temperature_c} °C` : '-- °C'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-2xl text-center border transition-colors ${
                    isDark ? 'bg-teal-950/40 border-teal-900/60' : 'bg-teal-50/50 border-teal-100'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Frec. Cardíaca</div>
                    <div className={`text-xs font-black mt-1 ${isDark ? 'text-teal-300' : 'text-[#14958D]'}`}>
                      {lastConsultation?.heart_rate_bpm ? `${lastConsultation.heart_rate_bpm} lpm` : '-- lpm'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnóstico Reciente */}
              {lastConsultation && (
                <div className={`p-3 rounded-xl text-xs border transition-colors ${
                  isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Último diagnóstico: </span>
                  <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{lastConsultation.diagnosis}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORIAL DE VISITAS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {consultations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No hay consultas previas registradas.</p>
              ) : (
                consultations.map((c) => (
                  <div key={c.id} className={`p-4 rounded-2xl border space-y-2 transition-colors ${
                    isDark ? 'bg-[#1E293B]/60 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-bold ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`}>
                        {c.consultation_date_formatted}
                      </span>
                      <span className="text-slate-400">Atendido por: {c.doctor_name || 'Médico de Turno'}</span>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      <strong>Motivo:</strong> {c.reason}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      <strong>Diagnóstico:</strong> {c.diagnosis}
                    </div>
                    {c.treatment_plan && (
                      <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <strong>Plan:</strong> {c.treatment_plan}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: REGISTRAR CONSULTA (TSK-HU09.1.2) */}
          {activeTab === 'new_consultation' && (
            <form onSubmit={handleCreateConsultation} className="space-y-4">
              {error && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  isDark ? 'bg-rose-950/40 border-rose-900 text-rose-300' : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Constantes Vitales */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                  isDark ? 'text-teal-400' : 'text-[#20C4BA]'
                }`}>
                  <Thermometer className="w-4 h-4" /> Constantes y Signos Vitales
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    name="blood_pressure"
                    placeholder="P.A. (ej. 120/80)"
                    value={formData.blood_pressure}
                    onChange={handleInputChange}
                    className={`px-3 py-2 rounded-xl text-xs focus:outline-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                  <input
                    type="number"
                    step="0.1"
                    name="weight_kg"
                    placeholder="Peso (kg)"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    className={`px-3 py-2 rounded-xl text-xs focus:outline-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                  <input
                    type="number"
                    step="0.1"
                    name="temperature_c"
                    placeholder="Temp (°C)"
                    value={formData.temperature_c}
                    onChange={handleInputChange}
                    className={`px-3 py-2 rounded-xl text-xs focus:outline-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                  <input
                    type="number"
                    name="heart_rate_bpm"
                    placeholder="Frec. Cardíaca (lpm)"
                    value={formData.heart_rate_bpm}
                    onChange={handleInputChange}
                    className={`px-3 py-2 rounded-xl text-xs focus:outline-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                </div>
              </div>

              {/* Motivo y Diagnóstico */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Motivo de Consulta *
                  </label>
                  <textarea
                    required
                    rows={2}
                    name="reason"
                    placeholder="Describa el motivo principal de la visita..."
                    value={formData.reason}
                    onChange={handleInputChange}
                    className={`p-3 rounded-xl text-xs focus:outline-none resize-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'p-3 bg-[#F0FDFA] border-[#99F6E4] text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Diagnóstico Clínico *
                  </label>
                  <textarea
                    required
                    rows={2}
                    name="diagnosis"
                    placeholder="Diagnóstico emitido tras la valoración..."
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    className={`p-3 rounded-xl text-xs focus:outline-none resize-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'p-3 bg-[#F0FDFA] border-[#99F6E4] text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Plan de Tratamiento / Receta
                  </label>
                  <textarea
                    rows={2}
                    name="treatment_plan"
                    placeholder="Indicaciones médicas y medicamentos formulados..."
                    value={formData.treatment_plan}
                    onChange={handleInputChange}
                    className={`p-3 rounded-xl text-xs focus:outline-none resize-none border ${
                      isDark 
                        ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                        : 'p-3 bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                    }`}
                  />
                </div>
              </div>

              <div className={`pt-3 flex justify-end gap-2 border-t ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-2 border text-xs font-semibold rounded-xl cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors ${
                    isDark 
                      ? 'bg-[#0D9488] hover:bg-[#0F766E]' 
                      : 'bg-[#20C4BA] hover:bg-[#1bb0a7]'
                  }`}
                >
                  {loading ? 'Guardando...' : <><CheckCircle2 className="w-4 h-4" /> Guardar Atención</>}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pie del Modal */}
        <div className={`px-6 py-3 border-t flex justify-end transition-colors ${
          isDark 
            ? 'bg-[#0B1320] border-slate-800' 
            : 'bg-slate-50 border-slate-100'
        }`}>
          <button
            onClick={onClose}
            className={`text-xs font-semibold transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}