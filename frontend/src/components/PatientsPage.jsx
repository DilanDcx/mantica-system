import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, UserPlus, FileText, Phone, Edit, RefreshCw, AlertCircle, 
  UserCheck, UserX, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Calendar as CalendarIcon, Filter, X
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

  // Popover de Fechas
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Popover de Filtros Avanzados
  const [isAdvFilterOpen, setIsAdvFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    blood_type: '',
    min_age: '',
    max_age: '',
    min_height: '',
    max_height: '',
    min_weight: '',
    max_weight: '',
  });

  const pageSize = 15;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const fetchPatients = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      params.append('page', page);
      if (ordering) params.append('ordering', ordering);

      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.blood_type) params.append('blood_type', filters.blood_type);
      if (filters.min_age) params.append('min_age', filters.min_age);
      if (filters.max_age) params.append('max_age', filters.max_age);
      if (filters.min_height) params.append('min_height', filters.min_height);
      if (filters.max_height) params.append('max_height', filters.max_height);
      if (filters.min_weight) params.append('min_weight', filters.min_weight);
      if (filters.max_weight) params.append('max_weight', filters.max_weight);

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
  }, [searchTerm, ordering, startDate, endDate, filters]);

  // Debounce para búsqueda y filtros reactivos
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchPatients(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchPatients]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchPatients(newPage);
    }
  };

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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearAdvFilters = () => {
    setFilters({
      gender: '',
      blood_type: '',
      min_age: '',
      max_age: '',
      min_height: '',
      max_height: '',
      min_weight: '',
      max_weight: '',
    });
  };

  const hasActiveAdvFilters = Object.values(filters).some((val) => val !== '');

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
    fetchPatients(currentPage);
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula, teléfono o expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all border ${
              isDark 
                ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2DD4BF]' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className={`text-xs font-semibold hidden md:inline ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Total: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalCount.toLocaleString()}</strong> registros
          </span>

          {/* 1. Botón de Filtros Clínicos Avanzados */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAdvFilterOpen((prev) => !prev);
                setIsDateFilterOpen(false);
              }}
              title="Filtros avanzados"
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                hasActiveAdvFilters
                  ? isDark ? 'bg-teal-950/60 border-teal-500 text-teal-300' : 'bg-teal-50 border-teal-400 text-[#14958D]'
                  : isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800 border-slate-700' : 'text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 border-slate-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              {hasActiveAdvFilters && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>}
            </button>

            {/* Popover Filtros Avanzados */}
            {isAdvFilterOpen && (
              <div className={`absolute right-0 top-12 z-30 p-5 rounded-2xl shadow-2xl border w-80 ${
                isDark ? 'bg-[#0F172A] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/40">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-teal-400" /> Filtros Avanzados
                  </span>
                  <button onClick={() => setIsAdvFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Género */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Género</label>
                    <select
                      name="gender"
                      value={filters.gender}
                      onChange={handleFilterChange}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">Todos los géneros</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>

                  {/* Tipo de Sangre */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tipo de Sangre</label>
                    <select
                      name="blood_type"
                      value={filters.blood_type}
                      onChange={handleFilterChange}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="">Todos los tipos</option>
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

                  {/* Rango de Edad */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Rango de Edad (Años)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="min_age"
                        placeholder="Mín"
                        value={filters.min_age}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                      <input
                        type="number"
                        name="max_age"
                        placeholder="Máx"
                        value={filters.max_age}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Rango de Altura */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Altura (m, ej. 1.50 - 1.85)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        name="min_height"
                        placeholder="Mín (m)"
                        value={filters.min_height}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                      <input
                        type="number"
                        step="0.01"
                        name="max_height"
                        placeholder="Máx (m)"
                        value={filters.max_height}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Rango de Peso */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Peso (kg, ej. 50 - 90)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.1"
                        name="min_weight"
                        placeholder="Mín (kg)"
                        value={filters.min_weight}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                      <input
                        type="number"
                        step="0.1"
                        name="max_weight"
                        placeholder="Máx (kg)"
                        value={filters.max_weight}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {hasActiveAdvFilters && (
                    <button
                      type="button"
                      onClick={clearAdvFilters}
                      className="w-full py-2 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer text-center"
                    >
                      Limpiar filtros avanzados
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Botón de Rango de Fechas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDateFilterOpen((prev) => !prev);
                setIsAdvFilterOpen(false);
              }}
              title="Filtrar por fecha de registro"
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                startDate || endDate
                  ? isDark ? 'bg-teal-950/60 border-teal-500 text-teal-300' : 'bg-teal-50 border-teal-400 text-[#14958D]'
                  : isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800 border-slate-700' : 'text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 border-slate-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              {(startDate || endDate) && <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>}
            </button>

            {isDateFilterOpen && (
              <div className={`absolute right-0 top-12 z-30 p-4 rounded-2xl shadow-xl border w-72 ${
                isDark ? 'bg-[#0F172A] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700/40">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-teal-400" /> Fecha de Registro
                  </span>
                  <button onClick={() => setIsDateFilterOpen(false)} className="p-1 text-slate-400 hover:text-slate-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Desde</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-xl text-xs outline-none border ${
                        isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="w-full py-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Limpiar fechas
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => fetchPatients(currentPage)}
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
                    No se encontraron pacientes que coincidan con los criterios de búsqueda y filtros.
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
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : isDark 
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' 
                              : 'bg-rose-50 text-rose-600 border-rose-200'
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

      {/* Modal de Expediente Clínico Rápido */}
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