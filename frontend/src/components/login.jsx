import React, { useState } from 'react';
import { User, Lock, Activity, Sun, Moon, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post('/auth/login/', {
        username: username.trim(),
        password: password,
      });

      const { access, refresh } = response.data;

      // Limpieza y almacenamiento seguro de credenciales
      localStorage.clear();
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('username', username.trim());

      const backendRole = response.data?.user?.role || response.data?.role;
      const isExplicitAdmin = 
        username.trim().toLowerCase() === 'admin' || 
        (typeof backendRole === 'string' && (backendRole.toLowerCase() === 'admin' || backendRole.toLowerCase() === 'administrador'));

      const finalRole = isExplicitAdmin ? 'Administrador' : (backendRole || 'Personal');
      localStorage.setItem('user_role', finalRole);

      // Notificación Toast visual temporal y redirección fluida
      setSuccessToast(`¡Bienvenido ${username.trim()}! Accediendo al sistema...`);

      setTimeout(() => {
        navigate('/home', { replace: true, state: { fromApp: true } });
      }, 700);

    } catch (error) {
      console.error('Error en login:', error);

      if (error.response) {
        const errorDetail =
          error.response.data?.detail ||
          error.response.data?.message ||
          'Credenciales inválidas. Verifique sus datos.';
        setErrorMsg(errorDetail);
      } else {
        setErrorMsg('No se pudo conectar con el servidor backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative transition-colors duration-200 ${
      isDark ? 'bg-[#0B1320]' : 'bg-[#20C4BA]'
    }`}>
      
      {/* Toast Animado Flotante de Éxito */}
      {successToast && (
        <div className="fixed top-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 ${
            isDark 
              ? 'bg-[#0F172A] border-teal-500/40 text-slate-100' 
              : 'bg-white border-teal-200 text-slate-800'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Inicio de sesión exitoso</p>
              <p className={`text-[11px] font-medium ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                {successToast}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante minimalista para alternar tema */}
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
        className={`absolute top-6 right-6 p-2.5 rounded-2xl backdrop-blur-md shadow-md transition-all cursor-pointer border ${
          isDark 
            ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-300' 
            : 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
        }`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className={`w-full max-w-[420px] rounded-[32px] shadow-2xl p-8 sm:p-10 flex flex-col items-center transition-colors duration-200 border ${
        isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>

        {/* Ícono Institucional */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-md mb-6 transition-colors ${
          isDark ? 'bg-slate-800 border border-slate-700/80 text-teal-400' : 'bg-[#20C4BA] text-white'
        }`}>
          <Activity className="w-12 h-12 stroke-[2.5]" />
        </div>

        {/* Encabezado */}
        <h1 className={`text-2xl sm:text-[28px] font-bold tracking-tight text-center ${
          isDark ? 'text-slate-100' : 'text-[#0F3E48]'
        }`}>
          Centro de Salud
        </h1>
        <h2 className={`text-xl sm:text-2xl font-bold mt-1 text-center ${
          isDark ? 'text-teal-400' : 'text-[#20C4BA]'
        }`}>
          Mántica Berio
        </h2>
        <p className="text-sm font-medium text-slate-400 mt-2 mb-8 text-center">
          Sistema de Gestión Médica
        </p>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className={`w-full mb-5 p-3 rounded-xl text-xs font-semibold text-center border ${
            isDark ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Usuario
            </label>
            <div className="relative flex items-center">
              <User className={`absolute left-4 w-5 h-5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={Boolean(successToast)}
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className={`absolute left-4 w-5 h-5 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={Boolean(successToast)}
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end -mt-2">
            <Link
              to="/forgot-password"
              className={`text-xs font-semibold transition-colors ${
                isDark ? 'text-slate-400 hover:text-teal-400' : 'text-[#0F3E48] hover:text-[#20C4BA]'
              }`}
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(successToast)}
            className={`w-full mt-3 py-3.5 font-bold rounded-xl text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer ${
              isDark 
                ? 'bg-[#0D9488] hover:bg-[#0F766E] text-white' 
                : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
            }`}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : successToast ? (
              'Ingresando...'
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}