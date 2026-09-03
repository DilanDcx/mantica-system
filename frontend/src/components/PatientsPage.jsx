import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, UserPlus, FileText, Phone, Edit, RefreshCw, AlertCircle, 
  UserCheck, UserX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import PatientModal from '../components/PatientModal';
import { useTheme } from '../context/ThemeContext';

export default function PatientsPage() {
  const { isDark } = useTheme();

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
    if (ordering === field) {
      return <ArrowUp className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />;
    }
    if (ordering === `-${field}`) {
      return <ArrowDown className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />;
    }
    return (
      <ArrowUpDown className={`w-3.5 h-3.5 ${
        isDark ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-300 group-hover:text-slate-500'
      }`} />
    );
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
          <h1 className={`text-2xl font-black tracking-tight transition-colors ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}>
            Listado General de Pacientes
          </h1>
          <p className={`text-xs mt-1 transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Visualización paginada, ordenamiento dinámico y consulta de registros
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer ${
            isDark 
              ? 'bg-[#0D9488] hover:bg-[#0f766e] text-white' 
              : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Paciente
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className={`flex items-center justify-between gap-4 p-4 rounded-2xl shadow-sm transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800/80' 
          : 'bg-white border-slate-100'
      }`}>
        <div className="relative flex-1 max-w-lg">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, teléfono o expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all border ${
              isDark 
                ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2DD4BF]' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
            }`}
          />
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold hidden sm:inline ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Total: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalCount.toLocaleString()}</strong> registros
          </span>
          <button
            onClick={() => fetchPatients(searchTerm, currentPage, ordering)}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800 border-slate-700' 
                : 'text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 border-slate-200'
            }`}
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          isDark 
            ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla con Ordenamiento por Columna */}
      <div className={`rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800/80' 
          : 'bg-white border-slate-100'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider transition-colors ${
                isDark 
                  ? 'border-slate-800 bg-slate-800/60 text-slate-400' 
                  : 'border-slate-100 bg-slate-50/75 text-slate-500'
              }`}>
                
                <th className="py-3.5 px-6">
                  <button 
                    onClick={() => handleSort('first_name')}
                    className={`group inline-flex items-center gap-1.5 transition-colors uppercase font-bold cursor-pointer ${
                      isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
                    }`}
                  >
                    Paciente {getSortIcon('first_name')}
                  </button>
                </th>

                <th className="py-3.5 px-6">
                  <button 
                    onClick={() => handleSort('identification_card')}
                    className={`group inline-flex items-center gap-1.5 transition-colors uppercase font-bold cursor-pointer ${
                      isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
                    }`}
                  >
                    Cédula {getSortIcon('identification_card')}
                  </button>
                </th>

                <th className="py-3.5 px-6">Expediente Digital</th>

                <th className="py-3.5 px-6">
                  <button 
                    onClick={() => handleSort('is_active')}
                    className={`group inline-flex items-center gap-1.5 transition-colors uppercase font-bold cursor-pointer ${
                      isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
                    }`}
                  >
                    Estado {getSortIcon('is_active')}
                  </button>
                </th>

                <th className="py-3.5 px-6">Contacto / Teléfono</th>

                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs transition-colors ${
              isDark ? 'divide-slate-800/80' : 'divide-slate-100'
            }`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className={`py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <div className={`inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mb-2 ${
                      isDark ? 'border-teal-400' : 'border-[#20C4BA]'
                    }`}></div>
                    <p>Cargando registros...</p>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No se encontraron pacientes registrados.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr 
                    key={p.id} 
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3.5 px-6">
                      <div className={`font-bold transition-colors ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        {p.first_name} {p.last_name}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-400'
                      }`}>
                        {p.gender === 'M' ? 'Masculino' : p.gender === 'F' ? 'Femenino' : 'Otro'} • {p.birth_date}
                      </div>
                    </td>
                    <td className={`py-3.5 px-6 font-mono font-medium ${
                      isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {p.identification_card}
                    </td>
                    <td className="py-3.5 px-6">
                      <button
                        onClick={() => handleOpenRecord(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] border transition-colors cursor-pointer ${
                          isDark 
                            ? 'bg-teal-950/60 hover:bg-teal-900/60 text-[#2DD4BF] border-teal-800/60' 
                            : 'bg-teal-50 hover:bg-teal-100 text-[#14958D] border-teal-100'
                        }`}
                        title="Ver Expediente Clínico"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {p.medical_record?.record_number || 'En proceso'}
                      </button>
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          p.is_active
                            ? isDark 
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : isDark 
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' 
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                      >
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {p.phone_number || 'Sin teléfono'}
                      </div>
                      {p.emergency_contact_phone && (
                        <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-400'
                        }`}>
                          <Phone className="w-3 h-3" />
                          {p.emergency_contact_name} ({p.emergency_contact_phone})
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isDark 
                              ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800' 
                              : 'text-slate-400 hover:text-[#20C4BA] hover:bg-slate-100'
                          }`}
                          title="Editar Datos"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          disabled={actionLoadingId === p.id}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            p.is_active
                              ? isDark 
                                ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40' 
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : isDark 
                                ? 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40' 
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

        {/* Paginador Interactivo */}
        <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
          isDark 
            ? 'border-slate-800 bg-slate-900/60 text-slate-400' 
            : 'border-slate-100 bg-slate-50/50 text-slate-500'
        }`}>
          <div className="text-xs font-medium">
            Mostrando página <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{currentPage}</strong> de <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalPages.toLocaleString()}</strong> ({totalCount.toLocaleString()} registros en total)
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || loading}
              className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-600 hover:bg-white'
              }`}
              title="Primera página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-600 hover:bg-white'
              }`}
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border ${
              isDark 
                ? 'text-[#2DD4BF] bg-teal-950/80 border-teal-800/80' 
                : 'text-[#14958D] bg-teal-50 border-[#99F6E4]'
            }`}>
              {currentPage}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-600 hover:bg-white'
              }`}
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || loading}
              className={`p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-600 hover:bg-white'
              }`}
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Expediente Clínico */}
      {activeRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 border transition-colors ${
            isDark 
              ? 'bg-[#0F172A] border-slate-800 text-slate-200' 
              : 'bg-white border-slate-100 text-slate-600'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
                <h3 className={`font-bold text-base ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  Expediente Clínico Digital
                </h3>
              </div>
              <button
                onClick={() => setActiveRecordModal(null)}
                className={`text-sm font-bold cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className={`p-3 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700' 
                  : 'bg-teal-50/60 border-teal-100'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isDark ? 'text-teal-400' : 'text-teal-700'
                }`}>
                  Código Único
                </span>
                <span className={`font-mono text-sm font-black ${
                  isDark ? 'text-teal-300' : 'text-[#14958D]'
                }`}>
                  {activeRecordModal.medical_record?.record_number}
                </span>
              </div>
              <div><strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Paciente:</strong> {activeRecordModal.first_name} {activeRecordModal.last_name}</div>
              <div><strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Cédula:</strong> {activeRecordModal.identification_card}</div>
              <div><strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Teléfono:</strong> {activeRecordModal.phone_number || 'N/A'}</div>
              <div><strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Dirección:</strong> {activeRecordModal.address || 'N/A'}</div>
              <div><strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>Contacto Emergencia:</strong> {activeRecordModal.emergency_contact_name || 'N/A'} ({activeRecordModal.emergency_contact_phone || 'N/A'})</div>
            </div>

            <div className={`pt-3 border-t flex justify-end ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button
                onClick={() => setActiveRecordModal(null)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  isDark 
                    ? 'bg-[#0D9488] hover:bg-[#0f766e] text-white' 
                    : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
                }`}
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