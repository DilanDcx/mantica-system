import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, FileText, RefreshCw, AlertCircle, Eye, Plus } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import MedicalRecordModal from '../components/MedicalRecordModal';

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const url = query.trim() ? `/medical-records/?search=${encodeURIComponent(query.trim())}` : '/medical-records/';
      const res = await axiosClient.get(url);
      const list = res.data.results ? res.data.results : (Array.isArray(res.data) ? res.data : []);
      setRecords(list);
    } catch (err) {
      setError('No se pudieron cargar los expedientes médicos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecords(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchRecords]);

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return `${age} años`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Título de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Expedientes Médicos</h1>
          <p className="text-xs text-slate-500 mt-1">
            Administra y consulta los expedientes médicos de los pacientes del centro de salud[cite: 1]
          </p>
        </div>
      </div>

      {/* Buscador Mockup */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o número de expediente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={() => fetchRecords(searchTerm)}
          disabled={loading}
          className="p-2.5 text-slate-500 hover:text-[#20C4BA] hover:bg-teal-50 rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Tarjetas de Expedientes (Estilo Mockup) */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
            <div className="inline-block w-6 h-6 border-2 border-[#20C4BA] border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs">Cargando expedientes médicos...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 text-xs">
            No se encontraron expedientes clínicos registrados.
          </div>
        ) : (
          records.map((rec) => {
            const p = rec.patient || {};
            const last = rec.last_consultation;
            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Paciente y Expediente */}
                <div className="flex items-center gap-4 min-w-[240px]">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#20C4BA] flex items-center justify-center shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm">{p.first_name} {p.last_name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#14958D] text-[10px] font-mono font-bold">
                        {rec.record_number}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Cédula: <span className="font-mono text-slate-600">{p.identification_card}</span>
                    </div>
                  </div>
                </div>

                {/* Datos Clínicos Resumidos */}
                <div className="grid grid-cols-3 gap-6 text-xs flex-1 max-w-xl">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Edad</div>
                    <div className="font-bold text-slate-700 mt-0.5">{calculateAge(p.birth_date)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Última Visita</div>
                    <div className="font-bold text-slate-700 mt-0.5">{last?.consultation_date_formatted || 'Sin atenciones'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold">Último Diagnóstico</div>
                    <div className="font-bold text-slate-700 mt-0.5 truncate max-w-[150px]" title={last?.diagnosis}>
                      {last?.diagnosis || 'Chequeo inicial'}
                    </div>
                  </div>
                </div>

                {/* Botón Ver Detalles */}
                <button
                  onClick={() => handleOpenDetail(rec)}
                  className="px-5 py-2.5 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold text-xs rounded-xl shadow-sm transition-all self-end md:self-center shrink-0"
                >
                  Ver Detalles
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Unificado */}
      <MedicalRecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        onConsultationSaved={() => {
          setIsModalOpen(false);
          fetchRecords(searchTerm);
        }}
      />
    </div>
  );
}