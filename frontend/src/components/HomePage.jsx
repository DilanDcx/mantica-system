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
import Navbar from '../components/Navbar';
import axiosClient from '../api/axiosClient';

export default function HomePage() {
  const [stats, setStats] = useState({
    consultations_count: 0,
    active_staff_count: 0,
    pending_appointments: 0,
  });
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-[#20C4BA] to-[#14958D] rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4" /> Portal Principal
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bienvenido al Centro de Salud Mantica Berios
            </h2>
            <p className="text-xs sm:text-sm text-teal-50 font-normal leading-relaxed">
              Brindando atención médica de calidad con tecnología de vanguardia para el bienestar de nuestra comunidad.
            </p>
          </div>
        </div>

        {/* Tarjetas de Métricas Funcionales (3 Tarjetas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Consultas Realizadas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-2 bg-teal-50 text-[#20C4BA] rounded-xl">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Consultas Realizadas</span>
              </div>
              <div className="text-2xl font-black text-slate-800">
                {loading ? '...' : stats.consultations_count.toLocaleString()}
              </div>
              <div className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Registros clínicos activos
              </div>
            </div>
          </div>

          {/* Citas Pendientes */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <span>Citas Pendientes</span>
              </div>
              <div className="text-2xl font-black text-slate-800">
                {loading ? '...' : stats.pending_appointments}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold">
                Módulo en preparación
              </div>
            </div>
          </div>

          {/* Personal Activo */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>Personal Activo</span>
              </div>
              <div className="text-2xl font-black text-slate-800">
                {loading ? '...' : stats.active_staff_count}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                Usuarios con acceso al sistema
              </div>
            </div>
          </div>

        </div>

        {/* Sección de Servicios Destacados & Horarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Misión Institucional */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Nuestra Misión</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Proporcionar servicios de salud integrales, accesibles y de alta calidad a nuestra comunidad, 
                promoviendo el bienestar físico y mental de nuestros pacientes a través de un equipo médico 
                altamente capacitado y tecnología de vanguardia.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-teal-50/50 rounded-2xl border border-teal-100">
              <Award className="w-5 h-5 text-[#20C4BA]" />
              <div>
                <div className="text-xs font-bold text-slate-800">Certificación ISO 9001:2015</div>
                <div className="text-[10px] text-slate-500">Calidad garantizada en atención primaria</div>
              </div>
            </div>
          </div>

          {/* Horarios de Atención */}
          <div className="bg-[#20C4BA] text-white rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold mb-3">
                <Clock className="w-4 h-4" /> Horarios de Atención
              </div>

              <div className="space-y-2 text-xs divide-y divide-white/10">
                <div className="flex justify-between pt-1 font-semibold">
                  <span className="text-teal-100">Lunes - Viernes</span>
                  <span>7:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between pt-2 font-semibold">
                  <span className="text-teal-100">Sábados</span>
                  <span>8:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between pt-2 font-semibold">
                  <span className="text-teal-100">Emergencias</span>
                  <span>24 / 7</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] space-y-1 text-teal-50 border-t border-white/20">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5" /> Línea de Emergencias: <strong className="text-white">911</strong>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5" /> Información: <strong className="text-white">(505) 2345-6789</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Campaña Informativa */}
        <div className="bg-[#E6FFFA] border border-[#99F6E4] rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 bg-[#20C4BA] text-white rounded-xl">
            <Syringe className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#14958D] block">Campaña de Vacunación 2026</span>
            <span className="text-slate-600">
              Próxima jornada de vacunación gratuita el 25 de marzo. Incluye vacunas contra influenza, COVID-19 y hepatitis B. ¡Inscríbete en recepción!
            </span>
          </div>
        </div>

      </main>
    </div>
  );
}