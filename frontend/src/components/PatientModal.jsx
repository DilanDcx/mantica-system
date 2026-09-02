import React, { useState, useEffect } from 'react';
import { X, User, Phone, ShieldAlert, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function PatientModal({ isOpen, onClose, patientToEdit = null, onPatientSaved }) {
  const isEditing = Boolean(patientToEdit);

  const initialFormState = {
    first_name: '',
    last_name: '',
    identification_card: '',
    birth_date: '',
    gender: 'M',
    blood_type: '', // <-- Agregado
    phone_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patientToEdit) {
      setFormData({
        first_name: patientToEdit.first_name || '',
        last_name: patientToEdit.last_name || '',
        identification_card: patientToEdit.identification_card || '',
        birth_date: patientToEdit.birth_date || '',
        gender: patientToEdit.gender || 'M',
        blood_type: patientToEdit.blood_type || '', // <-- Agregado
        phone_number: patientToEdit.phone_number || '',
        address: patientToEdit.address || '',
        emergency_contact_name: patientToEdit.emergency_contact_name || '',
        emergency_contact_phone: patientToEdit.emergency_contact_phone || '',
        emergency_contact_relation: patientToEdit.emergency_contact_relation || '',
        is_active: patientToEdit.is_active ?? true,
      });
    } else {
      setFormData(initialFormState);
    }
    setError('');
    setLoading(false);
  }, [patientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      ...formData,
      identification_card: formData.identification_card.trim().toUpperCase(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
    };

    try {
      if (patientToEdit) {
        await axiosClient.put(`/patients/${patientToEdit.id}/`, payload);
      } else {
        await axiosClient.post('/patients/', payload);
      }
      onPatientSaved();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Error al procesar la solicitud.';
      if (data) {
        if (data.identification_card) {
          msg = Array.isArray(data.identification_card) ? data.identification_card[0] : data.identification_card;
        } else if (data.detail) {
          msg = data.detail;
        } else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 my-8">
        
        {/* Encabezado */}
        <div className="bg-[#20C4BA] px-6 py-5 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isEditing ? 'Editar Datos del Paciente' : 'Admisión y Apertura de Expediente'}
            </h2>
            <p className="text-xs text-teal-50 font-medium mt-0.5">
              {isEditing ? 'Actualice la ficha demográfica y datos de contacto' : 'Registro de nuevo paciente y apertura automática de expediente'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          
          <div>
            <h3 className="text-xs font-bold text-[#20C4BA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Datos de Identificación
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Nombres *</label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Apellidos *</label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Número de Cédula *</label>
                <input
                  type="text"
                  name="identification_card"
                  required
                  value={formData.identification_card}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:col-span-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Nacimiento *</label>
                  <input
                    type="date"
                    name="birth_date"
                    required
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Género *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700">Tipo de Sangre</label>
                  <select
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                  >
                    <option value="">No especificado</option>
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="B-">B Negativo (B-)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="AB-">AB Negativo (AB-)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Teléfono</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Ej. +505 8888-8888"
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Dirección Domiciliar</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-[#20C4BA] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Contacto de Emergencia
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Nombre Completo</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Teléfono</label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700">Parentesco</label>
                <input
                  type="text"
                  name="emergency_contact_relation"
                  value={formData.emergency_contact_relation}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-75"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? 'Guardar Cambios' : 'Registrar Paciente'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}