import React, { useState } from 'react';
import { User, Lock, Activity } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
const navigate = useNavigate(); 

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

      // Limpiar datos previos
      localStorage.clear();

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('username', username.trim());

      // Determinar rol: solo será Administrador si el backend lo indica explícitamente o si el username es exactamente 'admin'
      const backendRole = response.data?.user?.role || response.data?.role;
      const isExplicitAdmin = 
        username.trim().toLowerCase() === 'admin' || 
        (typeof backendRole === 'string' && (backendRole.toLowerCase() === 'admin' || backendRole.toLowerCase() === 'administrador'));

      const finalRole = isExplicitAdmin ? 'Administrador' : (backendRole || 'Personal');
      localStorage.setItem('user_role', finalRole);

      console.log(`[Login] Usuario: ${username.trim()} | Rol asignado: ${finalRole}`);

      alert(`¡Bienvenido ${username}! Inicio de sesión exitoso.`);

      // Redirección con bandera interna
      navigate('/home', { replace: true, state: { fromApp: true } });

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#20C4BA]">
      <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-8 sm:p-10 flex flex-col items-center">

        {/* Ícono de Pulso Médico */}
        <div className="w-20 h-20 bg-[#20C4BA] rounded-2xl flex items-center justify-center shadow-md mb-6">
          <Activity className="w-12 h-12 text-white stroke-[2.5]" />
        </div>

        {/* Encabezado */}
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#0F3E48] tracking-tight text-center">
          Centro de Salud
        </h1>
        <h2 className="text-xl sm:text-2xl font-bold text-[#20C4BA] mt-1 text-center">
          Mantica Berios
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 mb-8 text-center">
          Sistema de Gestión Médica
        </p>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="w-full mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Usuario</label>
            <div className="relative flex items-center">
              <User className="absolute left-4 w-5 h-5 text-[#20C4BA]" />
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Contraseña</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-[#20C4BA]" />
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end -mt-2">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#0F3E48] hover:text-[#20C4BA] transition-colors"
            >
              ¿Olvidó su contraseña?
            </Link>
          </div>
          

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3.5 bg-[#20C4BA] hover:bg-[#1bb0a7] active:scale-[0.99] text-white font-bold rounded-xl text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}