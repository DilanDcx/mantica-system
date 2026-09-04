import React, { useState, useEffect } from 'react';
import { 
  X, User, Calendar, Activity, Phone, MapPin, Heart, 
  Thermometer, PlusCircle, CheckCircle2, ShieldAlert, AlertTriangle, 
  Edit3, Save, History, UploadCloud, FileText, Trash2, ExternalLink
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function MedicalRecordModal({ isOpen, onClose, record, onConsultationSaved }) {
  const { isDark } = useTheme();

  const [currentRecord, setCurrentRecord] = useState(record);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'history' | 'new_consultation'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para edición de antecedentes/alergias (HU-09.2)
  const [isEditingBackground, setIsEditingBackground] = useState(false);
  const [bgData, setBgData] = useState({
    allergies: '',
    medical_background: '',
    family_background: ''
  });
  const [savingBg, setSavingBg] = useState(false);

  // Estados para archivos adjuntos y Drag & Drop (HU-11)
  const [selectedFiles, setSelectedFiles] = useState([]); // Array de { file, title }
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    reason: '',
    symptoms: '',
    physical_examination: '',
    blood_pressure: '',
    weight_kg: '',
    height_m: '',
    temperature_c: '',
    heart_rate_bpm: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
  });

  useEffect(() => {
    setCurrentRecord(record);
    if (record) {
      setBgData({
        allergies: record.allergies || '',
        medical_background: record.medical_background || '',
        family_background: record.family_background || ''
      });
      setIsEditingBackground(false);
      setSelectedFiles([]);
    }
  }, [record]);

  if (!isOpen || !currentRecord) return null;

  const patient = currentRecord.patient || {};
  const lastConsultation = currentRecord.last_consultation;
  const consultations = currentRecord.consultations || [];

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

  const handleSaveBackground = async () => {
    setSavingBg(true);
    setError('');
    try {
      const res = await axiosClient.patch(`/medical-records/${currentRecord.id}/update-clinical-alerts/`, bgData);
      setCurrentRecord(res.data);
      setIsEditingBackground(false);
      if (onConsultationSaved) onConsultationSaved();
    } catch (err) {
      setError('No se pudieron actualizar las alertas y antecedentes.');
    } finally {
      setSavingBg(false);
    }
  };

  // Manejo de Drag & Drop y validación de tipos de archivo (TSK-HU11.2 y TSK-HU11.3)
  const addValidFiles = (files) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const valid = files.filter(f => allowed.includes(f.type));

    if (valid.length !== files.length) {
      setError('Solo se admiten documentos en formato PDF e imágenes PNG o JPG.');
    }

    const fileWrappers = valid.map(f => ({
      file: f,
      title: f.name.replace(/\.[^/.]+$/, "")
    }));

    setSelectedFiles(prev => [...prev, ...fileWrappers]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addValidFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    addValidFiles(files);
  };

  const handleCreateConsultation = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        medical_record: currentRecord.id,
        reason: formData.reason,
        symptoms: formData.symptoms,
        physical_examination: formData.physical_examination,
        blood_pressure: formData.blood_pressure || null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        height_m: formData.height_m ? parseFloat(formData.height_m) : null,
        temperature_c: formData.temperature_c ? parseFloat(formData.temperature_c) : null,
        heart_rate_bpm: formData.heart_rate_bpm ? parseInt(formData.heart_rate_bpm, 10) : null,
        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate, 10) : null,
        oxygen_saturation: formData.oxygen_saturation ? parseFloat(formData.oxygen_saturation) : null,
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatment_plan,
        notes: formData.notes,
      };

      // 1. Crear la atención médica
      const consultationRes = await axiosClient.post('/consultations/', payload);
      const consultationId = consultationRes.data.id;

      // 2. Subir los archivos adjuntos si existen (TSK-HU11.1)
      if (selectedFiles.length > 0) {
        for (const item of selectedFiles) {
          const data = new FormData();
          data.append('consultation', consultationId);
          data.append('file', item.file);
          data.append('title', item.title);
          await axiosClient.post('/attachments/', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      // 3. Recargar expediente completo con las nuevas atenciones y archivos
      const res = await axiosClient.get(`/medical-records/${currentRecord.id}/`);
      setCurrentRecord(res.data);

      // Limpieza de formulario y archivos
      setFormData({
        reason: '',
        symptoms: '',
        physical_examination: '',
        blood_pressure: '',
        weight_kg: '',
        height_m: '',
        temperature_c: '',
        heart_rate_bpm: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        diagnosis: '',
        treatment_plan: '',
        notes: '',
      });
      setSelectedFiles([]);

      setActiveTab('history');
      if (onConsultationSaved) onConsultationSaved();
    } catch (err) {
      setError('Error al registrar la consulta o cargar los archivos adjuntos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-3xl rounded-[28px] shadow-2xl overflow-hidden my-8 transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800 text-slate-100' 
          : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* Cabecera Principal */}
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
                  {currentRecord.record_number} - {patient.identification_card}
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

        {/* Alerta Clínica Fija */}
        <div className={`px-6 py-3 border-b flex items-center gap-3 transition-colors ${
          currentRecord.allergies && currentRecord.allergies.trim() !== ''
            ? isDark ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
            : isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
        }`}>
          {currentRecord.allergies && currentRecord.allergies.trim() !== '' ? (
            <>
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
              <div className="text-xs">
                <span className="font-extrabold uppercase tracking-wide mr-1.5 text-rose-600 dark:text-rose-400">
                  ALERTA CLÍNICA - ALERGIAS:
                </span>
                <span className="font-semibold">{currentRecord.allergies}</span>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="text-xs font-medium">
                Sin alergias conocidas reportadas en el expediente.
              </div>
            </>
          )}
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
            Info General y Antecedentes
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
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          
          {/* TAB 1: INFO GENERAL & ANTECEDENTES */}
          {activeTab === 'info' && (
            <div className="space-y-5">
              <div className={`p-4 rounded-2xl border transition-colors ${
                isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/30">
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? 'text-teal-400' : 'text-[#14958D]'
                  }`}>
                    <ShieldAlert className="w-4 h-4" /> Alertas Clínicas y Antecedentes del Paciente
                  </span>
                  {!isEditingBackground ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingBackground(true)}
                      className="text-xs font-bold flex items-center gap-1 text-teal-500 hover:text-teal-400 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Editar Antecedentes
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingBackground(false)}
                        className="text-xs text-slate-400 hover:text-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={savingBg}
                        onClick={handleSaveBackground}
                        className="text-xs px-3 py-1 bg-teal-500 text-white rounded-lg font-bold flex items-center gap-1 hover:bg-teal-600"
                      >
                        <Save className="w-3.5 h-3.5" /> {savingBg ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingBackground ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className={`p-3 rounded-xl border ${
                      currentRecord.allergies 
                        ? isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50/50 border-rose-200 text-rose-900'
                        : isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'
                    }`}>
                      <span className="font-bold block mb-1">Alergias Conocidas:</span>
                      <p className="text-[11px] leading-relaxed">
                        {currentRecord.allergies || 'Ninguna registrada.'}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <span className="font-bold block mb-1">Antecedentes Personales:</span>
                      <p className="text-[11px] leading-relaxed">
                        {currentRecord.medical_background || 'Sin antecedentes patológicos relevantes.'}
                      </p>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <span className="font-bold block mb-1">Antecedentes Familiares:</span>
                      <p className="text-[11px] leading-relaxed">
                        {currentRecord.family_background || 'Sin antecedentes familiares registrados.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-400 mb-1">Alergias (Medicamentos, alimentos, etc.)</label>
                      <input
                        type="text"
                        value={bgData.allergies}
                        onChange={(e) => setBgData({ ...bgData, allergies: e.target.value })}
                        placeholder="Ej: Penicilina, Dipirona, Mariscos..."
                        className={`w-full px-3 py-2 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Antecedentes Médicos / Patológicos</label>
                        <textarea
                          rows={2}
                          value={bgData.medical_background}
                          onChange={(e) => setBgData({ ...bgData, medical_background: e.target.value })}
                          placeholder="Ej: Hipertensión diagnosticada en 2021..."
                          className={`w-full p-2.5 rounded-xl text-xs outline-none resize-none border ${
                            isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">Antecedentes Heredofamiliares</label>
                        <textarea
                          rows={2}
                          value={bgData.family_background}
                          onChange={(e) => setBgData({ ...bgData, family_background: e.target.value })}
                          placeholder="Ej: Madre diabética, Padre hipertenso..."
                          className={`w-full p-2.5 rounded-xl text-xs outline-none resize-none border ${
                            isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Datos Demográficos */}
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

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className={`p-3 rounded-2xl text-center border transition-colors ${
                    isDark ? 'bg-teal-950/40 border-teal-900/60' : 'bg-teal-50/50 border-teal-100'
                  }`}>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Presión Art.</div>
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Altura</div>
                    <div className={`text-xs font-black mt-1 ${isDark ? 'text-teal-300' : 'text-[#14958D]'}`}>
                      {lastConsultation?.height_m ? `${lastConsultation.height_m} m` : '-- m'}
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

          {/* TAB 2: HISTORIAL DE VISITAS - TIMELINE CON DOCUMENTOS ADJUNTOS (HU-10 y HU-11) */}
          {activeTab === 'history' && (
            <div className="py-2">
              {consultations.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border text-xs ${
                  isDark ? 'bg-[#1E293B]/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}>
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No existen consultas clínicas previas registradas en este expediente.
                </div>
              ) : (
                <div className="relative border-l-2 border-teal-500/30 dark:border-teal-500/20 ml-4 pl-6 space-y-6">
                  {consultations.map((c, index) => {
                    const isLatest = index === 0;

                    return (
                      <div key={c.id} className="relative group">
                        {/* Nodo temporal de la línea de tiempo */}
                        <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                          isLatest 
                            ? 'bg-teal-500 border-white ring-4 ring-teal-400/20' 
                            : isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-300 border-white'
                        }`} />

                        {/* Tarjeta de Atención */}
                        <div className={`p-4 rounded-2xl border transition-all ${
                          isDark 
                            ? 'bg-[#1E293B]/60 border-slate-800 hover:border-slate-700' 
                            : 'bg-white border-slate-200/80 hover:shadow-md'
                        }`}>
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/20">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black ${
                                isDark ? 'text-teal-400' : 'text-[#14958D]'
                              }`}>
                                {c.consultation_date_formatted}
                              </span>
                              {isLatest && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-500 border border-teal-500/30">
                                  Última Atención
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-slate-400">
                              Atendido por: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{c.doctor_name || 'Médico de Turno'}</strong>
                            </span>
                          </div>

                          {/* Signos Vitales */}
                          {(c.blood_pressure || c.temperature_c || c.heart_rate_bpm || c.respiratory_rate || c.oxygen_saturation || c.weight_kg) && (
                            <div className="flex flex-wrap gap-1.5 pt-3">
                              {c.blood_pressure && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  PA: <strong>{c.blood_pressure}</strong>
                                </span>
                              )}
                              {c.temperature_c && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  Temp: <strong>{c.temperature_c} °C</strong>
                                </span>
                              )}
                              {c.heart_rate_bpm && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  FC: <strong>{c.heart_rate_bpm} lpm</strong>
                                </span>
                              )}
                              {c.respiratory_rate && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  FR: <strong>{c.respiratory_rate} rpm</strong>
                                </span>
                              )}
                              {c.oxygen_saturation && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  SpO2: <strong>{c.oxygen_saturation}%</strong>
                                </span>
                              )}
                              {c.weight_kg && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}>
                                  Peso: <strong>{c.weight_kg} kg</strong>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Motivo y Diagnóstico */}
                          <div className="mt-3 space-y-1.5 text-xs">
                            <div>
                              <span className="font-bold text-slate-400">Motivo: </span>
                              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{c.reason}</span>
                            </div>

                            <div className={`p-2.5 rounded-xl border ${
                              isDark ? 'bg-[#0F172A]/50 border-slate-800' : 'bg-teal-50/40 border-teal-100'
                            }`}>
                              <span className={`font-bold block text-[11px] mb-0.5 ${
                                isDark ? 'text-teal-400' : 'text-[#14958D]'
                              }`}>
                                Diagnóstico Clínico:
                              </span>
                              <p className={`text-xs ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                {c.diagnosis}
                              </p>
                            </div>

                            {c.treatment_plan && (
                              <div className="pt-1">
                                <span className="font-bold text-slate-400 block text-[11px]">Plan de Tratamiento / Receta:</span>
                                <p className={`text-xs whitespace-pre-line mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {c.treatment_plan}
                                </p>
                              </div>
                            )}

                            {/* TSK-HU11.2: VISUALIZACIÓN DE ARCHIVOS ADJUNTOS EN LA CONSULTA */}
                            {c.attachments && c.attachments.length > 0 && (
                              <div className="pt-3 border-t border-slate-700/20">
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-2">
                                  <FileText className="w-3.5 h-3.5 text-teal-400" /> Estudios y Documentos Adjuntos ({c.attachments.length}):
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {c.attachments.map((att) => (
                                    <a
                                      key={att.id}
                                      href={att.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all cursor-pointer ${
                                        isDark 
                                          ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-teal-300' 
                                          : 'bg-slate-50 hover:bg-teal-50 border-slate-200 text-[#14958D]'
                                      }`}
                                      title="Clic para ver o descargar"
                                    >
                                      <span className="font-semibold truncate max-w-[180px]">{att.title}</span>
                                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-slate-900/40 text-slate-400">
                                        {att.file_extension}
                                      </span>
                                      <ExternalLink className="w-3 h-3 opacity-60" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REGISTRAR CONSULTA + ADJUNTAR ARCHIVOS (HU-11) */}
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
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <input
                    type="text"
                    name="blood_pressure"
                    placeholder="P.A. (120/80)"
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
                    step="0.01"
                    name="height_m"
                    placeholder="Altura (m, ej 1.70)"
                    value={formData.height_m}
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
                    placeholder="Frec. Card. (lpm)"
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

              {/* TSK-HU11.2: ZONA DRAG & DROP PARA SUBIDA DE ESTUDIOS */}
              <div className="pt-2">
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Estudios o Documentos Adjuntos (PDF, PNG, JPG)
                </label>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? isDark ? 'border-teal-400 bg-teal-500/10' : 'border-[#20C4BA] bg-teal-50/50'
                      : isDark ? 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/60' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                  }`}
                >
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    id="fileUpload" 
                    className="hidden" 
                    onChange={handleFileInput} 
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer text-xs flex flex-col items-center gap-1.5">
                    <UploadCloud className={`w-7 h-7 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
                    <span className="font-bold">
                      Arrastra los archivos aquí o <span className={isDark ? 'text-teal-400 underline' : 'text-[#20C4BA] underline'}>selecciona desde tu equipo</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Formatos soportados: PDF, PNG, JPG (Máx. 10 MB por archivo)
                    </span>
                  </label>
                </div>

                {/* Lista de archivos en cola para subida */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400">Archivos seleccionados:</span>
                    {selectedFiles.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                          <span className="truncate font-medium">{item.file.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({(item.file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Quitar archivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botonera de Envío */}
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