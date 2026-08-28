import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, UserPlus, FileText, Phone, Edit, RefreshCw, AlertCircle, 
  UserCheck, UserX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import PatientModal from '../components/PatientModal';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [ordering, setOrdering] = useState('-created_at');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [activeRecordModal, setActiveRecordModal] = useState(null);

  const pageSize = 15;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const fetchPatients = useCallback(async (query = '', page = 1, order = '-created_at') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('search', query.trim());
      params.append('page', page);
      if (order) params.append('ordering', order);

      const res = await axiosClient.get(`/patients/?${params.toString()}`);
      
      if (res.data.results) {
        setPatients(res.data.results);
        setTotalCount(res.data.count || 0);
        return res.data.results;
      } else {
        const list = Array.isArray(res.data) ? res.data : [];
        setPatients(list);
        setTotalCount(list.length);
        return list;
      }
    } catch (err) {
      setError('No se pudo cargar la lista de pacientes.');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Búsqueda con debounce (reinicia a la página 1)
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchPatients(searchTerm, 1, ordering);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, ordering, fetchPatients]);

  // Cambio de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchPatients(searchTerm, newPage, ordering);
    }
  };

  // Manejo de ordenamiento por columna
  const handleSort = (field) => {
    let nextOrder = field;
    if (ordering === field) {
      nextOrder = `-${field}`;
    } else if (ordering === `-${field}`) {
      nextOrder = 'created_at';
    }
    setOrdering(nextOrder);
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (ordering === field) return <ArrowUp className="w-3.5 h-3.5 text-[#20C4BA]" />;
    if (ordering === `-${field}`) return <ArrowDown className="w-3.5 h-3.5 text-[#20C4BA]" />;
    return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500" />;
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentResults = await fetchPatients(searchTerm, 1, ordering);
      if (currentResults.length === 1) {
        handleOpenRecord(currentResults[0]);
      }
    }
  };

  const handleOpenCreate = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleOpenRecord = (patient) => {
    setActiveRecordModal(patient);
  };

  const handleToggleStatus = async (patient) => {
    setActionLoadingId(patient.id);
    try {
      await axiosClient.patch(`/patients/${patient.id}/toggle-status/`);
      setPatients((prev) =>
        prev.map((p) => (p.id === patient.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      setError('No se pudo cambiar el estado del paciente.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaved = () => {
    setIsModalOpen(false);
    fetchPatients(searchTerm, currentPage, ordering);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Listado General de Pacientes</h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualización paginada, ordenamiento dinámico y consulta de registros
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, teléfono o expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Total: <strong className="text-slate-800">{totalCount.toLocaleString()}</strong> registros
          </span>
          <button
            onClick={() => fetchPatients(searchTerm, currentPage, ordering)}
            disabled={loading}
            className="p-2.5 text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 rounded-xl border border-slate-200 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla con Ordenamiento por Columna */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                
                <th className="py-3.5 px-6">
                  <button 
                    onClick={() => handleSort('first_name')}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors uppercase font-bold"
                  >
                    Paciente {getSortIcon('first_name')}
                  </button>
                </th>

                <th className="py-3.5 px-6">
                  <button 
                    onClick={() => handleSort('identification_card')}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors uppercase font-bold"
                  >
                    Cédula {getSortIcon('identification_card')}
                  </button>
                </th>

                <th className="py-3.5 px-6">Expediente Digital</th>

                <th className="py-3.5 px-6">
                  <button 
                    onClick={() => handleSort('is_active')}
                    className="group inline-flex items-center gap-1.5 hover:text-slate-800 transition-colors uppercase font-bold"
                  >
                    Estado {getSortIcon('is_active')}
                  </button>
                </th>

                <th className="py-3.5 px-6">Contacto / Teléfono</th>

                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-[#20C4BA] border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>Cargando registros...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-slate-800">{p.first_name} {p.last_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.gender === 'M' ? 'Masculino' : p.gender === 'F' ? 'Femenino' : 'Otro'} • {p.birth_date}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-600 font-medium">
                      {p.identification_card}
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleOpenRecord(p)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#14958D] font-mono font-bold text-[11px] border border-teal-100 transition-colors"
                        title="Ver Expediente Clínico"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {p.medical_record?.record_number || 'En proceso'}
                      </button>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="text-slate-700 font-medium">
                        {p.phone_number || 'Sin teléfono'}
                      </div>
                      {p.emergency_contact_phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {p.emergency_contact_name} ({p.emergency_contact_phone})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-slate-400 hover:text-[#20C4BA] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar Datos"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          disabled={actionLoadingId === p.id}
                          className={`p-2 rounded-lg transition-colors ${
                            p.is_active
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={p.is_active ? 'Inactivar Paciente' : 'Activar Paciente'}
                        >
                          {p.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginador Interactivo (TSK-HU08.2) */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Mostrando página <strong className="text-slate-800">{currentPage}</strong> de <strong className="text-slate-800">{totalPages.toLocaleString()}</strong> ({totalCount.toLocaleString()} registros en total)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Primera página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3.5 py-1.5 text-xs font-bold text-[#14958D] bg-teal-50 border border-[#99F6E4] rounded-lg">
              {currentPage}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Expediente Clínico */}
      {activeRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#20C4BA]" />
                <h3 className="font-bold text-slate-800 text-base">Expediente Clínico Digital</h3>
              </div>
              <button
                onClick={() => setActiveRecordModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">Código Único</span>
                <span className="font-mono text-sm font-black text-[#14958D]">{activeRecordModal.medical_record?.record_number}</span>
              </div>
              <div><strong className="text-slate-700">Paciente:</strong> {activeRecordModal.first_name} {activeRecordModal.last_name}</div>
              <div><strong className="text-slate-700">Cédula:</strong> {activeRecordModal.identification_card}</div>
              <div><strong className="text-slate-700">Teléfono:</strong> {activeRecordModal.phone_number || 'N/A'}</div>
              <div><strong className="text-slate-700">Dirección:</strong> {activeRecordModal.address || 'N/A'}</div>
              <div><strong className="text-slate-700">Contacto Emergencia:</strong> {activeRecordModal.emergency_contact_name || 'N/A'} ({activeRecordModal.emergency_contact_phone || 'N/A'})</div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveRecordModal(null)}
                className="px-4 py-2 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white text-xs font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro / Edición */}
      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientToEdit={selectedPatient}
        onPatientSaved={handleSaved}
      />
    </div>
  );
}