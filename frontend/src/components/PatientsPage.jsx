import React, { useState, useEffect } from 'react';
import { Search, UserPlus, FileText, Phone, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import PatientModal from '../components/PatientModal';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get('/patients/');
      setPatients(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      setError('No se pudo cargar la lista de pacientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    fetchPatients();
  };

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const idCard = (p.identification_card || '').toLowerCase();
    const recordNum = (p.medical_record?.record_number || '').toLowerCase();
    return fullName.includes(term) || idCard.includes(term) || recordNum.includes(term);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Admisión de Pacientes</h1>
          <p className="text-xs text-slate-500 mt-1">Control de pacientes y apertura de expedientes clínicos</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Controles de Búsqueda y Refresco */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={fetchPatients}
          disabled={loading}
          className="p-2.5 text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 rounded-xl border border-slate-200 transition-colors"
          title="Refrescar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error de Conexión */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de Pacientes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Paciente</th>
                <th className="py-3.5 px-6">Cédula</th>
                <th className="py-3.5 px-6">Expediente Digital</th>
                <th className="py-3.5 px-6">Contacto Emergencia</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-[#20C4BA] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Cargando pacientes...</p>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">{p.first_name} {p.last_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.gender === 'M' ? 'Masculino' : p.gender === 'F' ? 'Femenino' : 'Otro'} • {p.birth_date}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600 font-medium">
                      {p.identification_card}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-[#14958D] font-mono font-bold text-[11px] border border-teal-100">
                        <FileText className="w-3.5 h-3.5" />
                        {p.medical_record?.record_number || 'En proceso'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-700 font-medium">{p.emergency_contact_name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {p.emergency_contact_phone} {p.emergency_contact_relation ? `(${p.emergency_contact_relation})` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 text-slate-400 hover:text-[#20C4BA] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Paciente"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Admisión */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientToEdit={selectedPatient}
        onPatientSaved={handleSaved}
      />
    </div>
  );
}