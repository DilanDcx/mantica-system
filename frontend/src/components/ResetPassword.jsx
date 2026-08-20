import React, { useState } from 'react';
import { Lock, Activity, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Obtiene los parámetros del enlace seguro enviado por correo (?uid=...&token=...)
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password || !confirmPassword) {
      setErrorMsg('Por favor, complete todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas ingresadas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('La contraseña debe contener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // Endpoint de confirmación de cambio de contraseña
      await axiosClient.post('/api/auth/password-reset-confirm/', {
        uid: uid,
        token: token,
        new_password: password,
      });

      setIsCompleted(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      if (error.response) {
        setErrorMsg(
          error.response.data?.detail ||
          error.response.data?.new_password?.[0] ||
          'El enlace de recuperación ha expirado o es inválido.'
        );
      } else {
        setErrorMsg('Error de comunicación con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#20C4BA]">
      <div className="bg-white w-full max-w-[420px] rounded-[32px] shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        
        {/* Ícono institucional */}
        <div className="w-16 h-16 bg-[#20C4BA] rounded-2xl flex items-center justify-center shadow-md mb-5">
          <Activity className="w-10 h-10 text-white stroke-[2.5]" />
        </div>

        <h1 className="text-2xl font-bold text-[#0F3E48] tracking-tight text-center">
          Nueva Contraseña
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 mb-6 text-center">
          Establezca una nueva clave de acceso segura para su cuenta.
        </p>

        {errorMsg && (
          <div className="w-full mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {isCompleted ? (
          <div className="w-full flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              ¡Contraseña actualizada!
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Su clave se modificó con éxito. Será redirigido al inicio de sesión en unos segundos...
            </p>
            <Link
              to="/login"
              className="w-full py-3 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold rounded-xl text-sm shadow-md transition-all text-center"
            >
              Ir al Login ahora
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Nueva Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-[#20C4BA]" />
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Confirmar Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 w-5 h-5 text-[#20C4BA]" />
                <input
                  type="password"
                  placeholder="Repita la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-[#20C4BA] hover:bg-[#1bb0a7] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Guardar Nueva Contraseña'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}