import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, User, RefreshCw, AlertCircle, 
  ArrowUp, ArrowDown, Calendar as CalendarIcon, Filter, X,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import MedicalRecordModal from '../components/MedicalRecordModal';
import { useTheme } from '../context/ThemeContext';

export default function MedicalRecordsPage() {
  const { isDark } = useTheme();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Orden cronológico
  const [sortOrder, setSortOrder] = useState('desc');

  // Popover de Fechas
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Popover de Filtros Avanzados (Género, Sangre, Edad, Altura)
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

  // Consulta paginada delegada al Backend con todos los filtros
  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      params.append('page', page);

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

      const res = await axiosClient.get(`/medical-records/?${params.toString()}`);
      
      if (res.data.results) {
        setRecords(res.data.results);
        setTotalCount(res.data.count || 0);
      } else {
        const list = Array.isArray(res.data) ? res.data : [];
        setRecords(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      setError('No se pudieron cargar los expedientes médicos.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, startDate, endDate, filters]);

  // Debounce para búsqueda y filtros
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchRecords(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchRecords]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      fetchRecords(newPage);
    }
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

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
  };

  // Ordenamiento cronológico sobre los 15 registros de la página actual
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.last_consultation?.consultation_date || a.opened_at || 0).getTime();
    const dateB = new Date(b.last_consultation?.consultation_date || b.opened_at || 0).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight transition-colors ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}>
            Gestión de Expedientes Médicos
          </h1>
          <p className={`text-xs mt-1 transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Administra, filtra y consulta los expedientes clínicos del centro de salud
          </p>
        </div>
      </div>

      {/* Barra de Búsqueda y Botonera de Filtros */}
      <div className={`relative flex items-center justify-between gap-3 p-4 rounded-2xl shadow-sm transition-colors border ${
        isDark ? 'bg-[#0F172A] border-slate-800/80' : 'bg-white border-slate-100'
      }`}>
        <div className="relative flex-1 max-w-xl flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o número de expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl text-xs focus:outline-none transition-all border ${
              isDark 
                ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
            }`}
          />
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            title={sortOrder === 'desc' ? "Más reciente primero" : "Más antiguo primero"}
            className={`absolute right-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-teal-400 hover:bg-slate-700' : 'text-[#20C4BA] hover:bg-teal-50'
            }`}
          >
            {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold hidden sm:inline ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Total: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{totalCount.toLocaleString()}</strong> registros
          </span>

          {/* 1. Botón de Filtros Avanzados (Género, Sangre, Edad, Altura) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAdvFilterOpen((prev) => !prev);
                setIsDateFilterOpen(false);
              }}
              title="Filtros clínicos avanzados"
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
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                      <input
                        type="number"
                        name="max_age"
                        placeholder="Máx"
                        value={filters.max_age}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Rango de Altura */}
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Altura (Metros, ej. 1.50 - 1.85)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        name="min_height"
                        placeholder="Mín (m)"
                        value={filters.min_height}
                        onChange={handleFilterChange}
                        className={`w-1/2 px-3 py-1.5 rounded-xl text-xs outline-none border ${
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
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
                          isDark ? 'bg-[#1E293B] border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
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

          {/* 2. Botón de Calendario */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDateFilterOpen((prev) => !prev);
                setIsAdvFilterOpen(false);
              }}
              title="Filtrar por rango de fechas"
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
                    <CalendarIcon className="w-3.5 h-3.5 text-teal-400" /> Rango de Fechas
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
            onClick={() => fetchRecords(currentPage)}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800 border-slate-700' : 'text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 border-slate-200'
            }`}
            title="Refrescar expedientes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          isDark ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid de Expedientes con Columnas Fijas */}
      <div className="space-y-3">
        {loading ? (
          <div className={`py-12 text-center rounded-2xl border transition-colors ${
            isDark ? 'bg-[#0F172A] border-slate-800/80 text-slate-400' : 'bg-white border-slate-100 text-slate-400'
          }`}>
            <div className={`inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mb-2 ${
              isDark ? 'border-teal-400' : 'border-[#20C4BA]'
            }`}></div>
            <p className="text-xs">Cargando expedientes médicos...</p>
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className={`py-12 text-center rounded-2xl border text-xs transition-colors ${
            isDark ? 'bg-[#0F172A] border-slate-800/80 text-slate-400' : 'bg-white border-slate-100 text-slate-400'
          }`}>
            No se encontraron expedientes clínicos registrados con los filtros seleccionados.
          </div>
        ) : (
          sortedRecords.map((rec) => {
            const p = rec.patient || {};
            const last = rec.last_consultation;
            return (
              <div
                key={rec.id}
                className={`rounded-2xl p-5 shadow-sm transition-all grid grid-cols-1 md:grid-cols-12 items-center gap-4 border ${
                  isDark ? 'bg-[#0F172A] border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-100 hover:shadow-md'
                }`}
              >
                <div className="md:col-span-4 flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-slate-800 text-teal-400 border border-slate-700/60' : 'bg-teal-50 text-[#20C4BA]'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`} title={`${p.first_name} ${p.last_name}`}>
                        {p.first_name} {p.last_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 border ${
                        isDark ? 'bg-teal-950/60 text-[#2DD4BF] border-teal-800/60' : 'bg-teal-50 text-[#14958D] border-teal-100'
                      }`}>
                        {rec.record_number}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Cédula: <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p.identification_card}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 min-w-0 text-xs pl-2">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Edad</div>
                  <div className={`font-bold mt-0.5 truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {calculateAge(p.birth_date)}
                  </div>
                </div>

                <div className="md:col-span-2 min-w-0 text-xs">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Última Visita</div>
                  <div className={`font-bold mt-0.5 truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {last?.consultation_date_formatted || 'Sin atenciones'}
                  </div>
                </div>

                <div className="md:col-span-2 min-w-0 text-xs pr-2">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Último Diagnóstico</div>
                  <div 
                    className={`font-bold mt-0.5 truncate w-full cursor-help ${isDark ? 'text-slate-200' : 'text-slate-700'}`} 
                    title={last?.diagnosis || 'Chequeo inicial'}
                  >
                    {last?.diagnosis || 'Chequeo inicial'}
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={() => setSelectedRecord(rec) || setIsModalOpen(true)}
                    className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer w-full sm:w-auto text-center ${
                      isDark ? 'bg-[#0D9488] hover:bg-[#0F766E] text-white' : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
                    }`}
                  >
                    Ver Detalles
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginador Interactivo */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors ${
        isDark 
          ? 'border-slate-800/80 bg-[#0F172A] text-slate-400' 
          : 'border-slate-100 bg-white text-slate-500'
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
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de Detalle y Nueva Consulta */}
      <MedicalRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        onConsultationSaved={() => {
          setIsModalOpen(false);
          fetchRecords(currentPage);
        }}
      />
    </div>
  );
}