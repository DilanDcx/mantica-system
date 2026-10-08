import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CalendarClock, 
  UserCheck, 
  Activity, 
  Clock, 
  PhoneCall, 
  Award, 
  Syringe, 
  TrendingUp 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function HomePage() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState({
    consultations_count: 0,
    active_staff_count: 0,
    pending_appointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/dashboard-stats/');
        setStats(res.data);
      } catch (err) {
        console.error('Error al cargar métricas del inicio:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    axiosClient
      .get('/institutional-config/')
      .then((response) => setInstitution(response.data))
      .catch((error) => {
        console.error('Error al cargar la configuración institucional:', error);
      });
  }, []);

  return (
    <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Banner de Bienvenida */}
      <div 
        className={`rounded-3xl p-8 shadow-md transition-colors duration-200 ${
          isDark 
            ? 'bg-[#131E31] border border-slate-800/80 text-white' 
            : 'bg-[#20C4BA] text-white'
        }`}
      >
        <div className="max-w-2xl space-y-2">
          <div 
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
              isDark 
                ? 'bg-slate-800 border border-slate-700/60 text-teal-400' 
                : 'bg-white/20 text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Portal Principal
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Bienvenido a {institution?.name || 'la institución de salud'}
          </h2>
          <p className={`text-xs sm:text-sm font-normal leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-teal-50'
          }`}>
            Brindando atención médica de calidad con tecnología de vanguardia para el bienestar de nuestra comunidad.
          </p>
        </div>
      </div>

      {/* Tarjetas de Métricas Funcionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Consultas Realizadas */}
        <div 
          className={`rounded-2xl p-5 shadow-sm flex items-center justify-between transition-colors duration-200 border ${
            isDark 
              ? 'bg-[#0F172A] border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-100 text-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className={`flex items-center gap-2 text-xs font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-slate-800 text-teal-400' : 'bg-teal-50 text-[#20C4BA]'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <span>Consultas Realizadas</span>
            </div>
            <div className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {loading ? '...' : stats.consultations_count.toLocaleString()}
            </div>
            <div className={`text-[11px] font-semibold flex items-center gap-1 ${
              isDark ? 'text-teal-400' : 'text-teal-600'
            }`}>
              <TrendingUp className="w-3 h-3" /> Registros clínicos activos
            </div>
          </div>
        </div>

        {/* Citas Pendientes */}
        <div 
          className={`rounded-2xl p-5 shadow-sm flex items-center justify-between transition-colors duration-200 border ${
            isDark 
              ? 'bg-[#0F172A] border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-100 text-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className={`flex items-center gap-2 text-xs font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-500'
              }`}>
                <CalendarClock className="w-4 h-4" />
              </div>
              <span>Citas Pendientes</span>
            </div>
            <div className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {loading ? '...' : stats.pending_appointments}
            </div>
            <div className={`text-[11px] font-semibold ${
              isDark ? 'text-amber-400' : 'text-amber-600'
            }`}>
              Módulo en preparación
            </div>
          </div>
        </div>

        {/* Personal Activo */}
        <div 
          className={`rounded-2xl p-5 shadow-sm flex items-center justify-between transition-colors duration-200 border ${
            isDark 
              ? 'bg-[#0F172A] border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-100 text-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className={`flex items-center gap-2 text-xs font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <div className={`p-2 rounded-xl ${
                isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-500'
              }`}>
                <UserCheck className="w-4 h-4" />
              </div>
              <span>Personal Activo</span>
            </div>
            <div className={`text-2xl font-black ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {loading ? '...' : stats.active_staff_count}
            </div>
            <div className={`text-[11px] font-semibold ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              Usuarios con acceso al sistema
            </div>
          </div>
        </div>

      </div>

      {/* Servicios Destacados & Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Misión Institucional */}
        <div 
          className={`rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 transition-colors duration-200 border ${
            isDark 
              ? 'bg-[#0F172A] border-slate-800/80 text-slate-100' 
              : 'bg-white border-slate-100 text-slate-800'
          }`}
        >
          <div>
            <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {institution?.mission_title || ''}
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {institution?.mission_text || ''}
            </p>
          </div>

          <div 
            className={`flex items-center gap-3 p-3 rounded-2xl border ${
              isDark 
                ? 'bg-slate-800/70 border-slate-700/60' 
                : 'bg-teal-50/50 border-teal-100'
            }`}
          >
            <Award className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
            <div>
              <div className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {institution?.certification_title || ''}
              </div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {institution?.certification_text || ''}
              </div>
            </div>
          </div>
        </div>

        {/* Horarios de Atención */}
        <div
          className={`rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4 transition-colors duration-200 ${
            isDark
              ? 'bg-[#0F172A] border border-slate-800/80 text-white'
              : 'bg-[#20C4BA] text-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-bold mb-3 text-white">
              <Clock className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-100'}`} />
              {institution?.hours_title || 'Horarios de Atención'}
            </div>

            <div
              className={`space-y-2 text-xs divide-y ${
                isDark ? 'divide-slate-800 text-slate-200' : 'divide-white/10 text-white'
              }`}
            >
              {[
                {
                  label: institution?.weekday_label,
                  value: institution?.weekday_hours,
                },
                {
                  label: institution?.saturday_label,
                  value: institution?.saturday_hours,
                },
                {
                  label: institution?.emergency_label,
                  value: institution?.emergency_hours,
                },
              ]
                .filter((item) => item.label || item.value)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between gap-4 pt-2 font-semibold"
                  >
                    <span>{item.label}</span>
                    <span className="text-right">{item.value}</span>
                  </div>
                ))}
            </div>
          </div>

          {(institution?.emergency_phone_label ||
            institution?.emergency_phone ||
            institution?.information_label ||
            institution?.information_phone) && (
            <div
              className={`pt-2 text-[11px] space-y-1 border-t ${
                isDark
                  ? 'border-slate-800 text-slate-400'
                  : 'border-white/20 text-teal-50'
              }`}
            >
              {(institution?.emergency_phone_label || institution?.emergency_phone) && (
                <div className="flex items-center gap-2">
                  <PhoneCall
                    className={`w-3.5 h-3.5 ${
                      isDark ? 'text-teal-400' : 'text-teal-100'
                    }`}
                  />
                  {institution?.emergency_phone_label}
                  {institution?.emergency_phone && (
                    <strong className={isDark ? 'text-slate-200' : 'text-white'}>
                      {institution.emergency_phone}
                    </strong>
                  )}
                </div>
              )}

              {(institution?.information_label || institution?.information_phone) && (
                <div className="flex items-center gap-2">
                  <PhoneCall
                    className={`w-3.5 h-3.5 ${
                      isDark ? 'text-teal-400' : 'text-teal-100'
                    }`}
                  />
                  {institution?.information_label}
                  {institution?.information_phone && (
                    <strong className={isDark ? 'text-slate-200' : 'text-white'}>
                      {institution.information_phone}
                    </strong>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Campaña Informativa */}
      {(institution?.campaign_title || institution?.campaign_text) && (
        <div
          className={`rounded-2xl p-4 flex items-center gap-3 transition-colors duration-200 border ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300'
              : 'bg-teal-50/60 border-teal-100 text-slate-600'
          }`}
        >
          <div
            className={`p-2 rounded-xl ${
              isDark ? 'bg-slate-800 text-teal-400' : 'bg-[#20C4BA] text-white'
            }`}
          >
            <Syringe className="w-4 h-4" />
          </div>

          <div className="text-xs">
            {institution?.campaign_title && (
              <span
                className={`font-bold block mb-0.5 ${
                  isDark ? 'text-teal-400' : 'text-[#14958D]'
                }`}
              >
                {institution.campaign_title}
              </span>
            )}

            {institution?.campaign_text && (
              <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                {institution.campaign_text}
              </span>
            )}
          </div>
        </div>
      )}

    </main>
  );
}