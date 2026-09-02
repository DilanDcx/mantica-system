import React, { useState } from 'react';
import { 
  X, User, Calendar, Activity, Phone, MapPin, Heart, 
  Thermometer, PlusCircle, CheckCircle2, ShieldAlert, History
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function MedicalRecordModal({ isOpen, onClose, record, onConsultationSaved }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 my-8">
        
        {/* Cabecera Mockup */}
        <div className="bg-[#20C4BA] px-6 py-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-snug">
                {patient.first_name} {patient.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono bg-teal-800/20 px-2 py-0.5 rounded-md">
                  {record.record_number} - {patient.identification_card}
                </span>
                <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-md">
                  {patient.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-100 px-6 pt-3 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'info' ? 'border-[#20C4BA] text-[#20C4BA]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Info General
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'history' ? 'border-[#20C4BA] text-[#20C4BA]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Historial de Visitas ({consultations.length})
          </button>
          <button
            onClick={() => setActiveTab('new_consultation')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1 ${
              activeTab === 'new_consultation' ? 'border-[#20C4BA] text-[#20C4BA]' : 'border-transparent text-slate-400 hover:text-slate-600'
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
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#20C4BA]" /> Fecha de Nacimiento
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">{patient.birth_date || 'N/A'}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-[#20C4BA]" /> Edad
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">{calculateAge(patient.birth_date)}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-[#20C4BA]" /> Sexo
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-[#20C4BA]" /> Teléfono
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">{patient.phone_number || 'N/A'}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Heart className="w-3.5 h-3.5 text-[#20C4BA]" /> Tipo de Sangre
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {patient.blood_type || 'No registrado'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#20C4BA]" /> Última Visita
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    {lastConsultation?.consultation_date_formatted || 'Sin atenciones'}
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#20C4BA]" /> Dirección
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1">{patient.address || 'No registrada'}</div>
              </div>

              {/* Últimos Signos Vitales */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2.5">
                  <Activity className="w-4 h-4 text-[#20C4BA]" /> Últimos Signos Vitales
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({lastConsultation?.consultation_date_formatted || 'Sin registros'})
                  </span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Presión Arterial</div>
                    <div className="text-xs font-black text-[#14958D] mt-1">
                      {lastConsultation?.blood_pressure || '--/-- mmHg'}
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Peso</div>
                    <div className="text-xs font-black text-[#14958D] mt-1">
                      {lastConsultation?.weight_kg ? `${lastConsultation.weight_kg} kg` : '-- kg'}
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Temperatura</div>
                    <div className="text-xs font-black text-[#14958D] mt-1">
                      {lastConsultation?.temperature_c ? `${lastConsultation.temperature_c} °C` : '-- °C'}
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-2xl text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Frec. Cardíaca</div>
                    <div className="text-xs font-black text-[#14958D] mt-1">
                      {lastConsultation?.heart_rate_bpm ? `${lastConsultation.heart_rate_bpm} lpm` : '-- lpm'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnóstico Reciente */}
              {lastConsultation && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="font-bold text-slate-700">Último diagnóstico: </span>
                  <span className="text-slate-600">{lastConsultation.diagnosis}</span>
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
                  <div key={c.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#20C4BA]">{c.consultation_date_formatted}</span>
                      <span className="text-slate-400">Atendido por: {c.doctor_name || 'Médico de Turno'}</span>
                    </div>
                    <div className="text-xs text-slate-700"><strong>Motivo:</strong> {c.reason}</div>
                    <div className="text-xs text-slate-700"><strong>Diagnóstico:</strong> {c.diagnosis}</div>
                    {c.treatment_plan && (
                      <div className="text-xs text-slate-500"><strong>Plan:</strong> {c.treatment_plan}</div>
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
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Constantes Vitales */}
              <div>
                <h4 className="text-xs font-bold text-[#20C4BA] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4" /> Constantes y Signos Vitales
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    name="blood_pressure"
                    placeholder="P.A. (ej. 120/80)"
                    value={formData.blood_pressure}
                    onChange={handleInputChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    name="weight_kg"
                    placeholder="Peso (kg)"
                    value={formData.weight_kg}
                    onChange={handleInputChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none"
                  />
                  <input
                    type="number"
                    step="0.1"
                    name="temperature_c"
                    placeholder="Temp (°C)"
                    value={formData.temperature_c}
                    onChange={handleInputChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none"
                  />
                  <input
                    type="number"
                    name="heart_rate_bpm"
                    placeholder="Frec. Cardíaca (lpm)"
                    value={formData.heart_rate_bpm}
                    onChange={handleInputChange}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none"
                  />
                </div>
              </div>

              {/* Motivo y Diagnóstico */}
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Motivo de Consulta *</label>
                  <textarea
                    required
                    rows={2}
                    name="reason"
                    placeholder="Describa el motivo principal de la visita..."
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="p-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Diagnóstico Clínico *</label>
                  <textarea
                    required
                    rows={2}
                    name="diagnosis"
                    placeholder="Diagnóstico emitido tras la valoración..."
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    className="p-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Plan de Tratamiento / Receta</label>
                  <textarea
                    rows={2}
                    name="treatment_plan"
                    placeholder="Indicaciones médicas y medicamentos formulados..."
                    value={formData.treatment_plan}
                    onChange={handleInputChange}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {loading ? 'Guardando...' : <><CheckCircle2 className="w-4 h-4" /> Guardar Atención</>}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}