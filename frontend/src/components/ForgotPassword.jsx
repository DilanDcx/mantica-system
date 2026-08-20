import React, { useState } from 'react';
import { Mail, ArrowLeft, Activity, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Por favor, ingrese su correo electrónico institucional.');
      return;
    }

    setLoading(true);

    try {
      // Endpoint de solicitud de recuperación de contraseña
      await axiosClient.post('/api/auth/password-reset/', {
        email: email.trim(),
      });

      // Se muestra mensaje de éxito genérico para mitigar enumeración de cuentas
      setSuccess(true);
    } catch (error) {
      console.error('Error al solicitar restablecimiento:', error);
      if (error.response) {
        setErrorMsg(
          error.response.data?.detail ||
          error.response.data?.email?.[0] ||
          'No se pudo procesar la solicitud. Verifique los datos ingresados.'
        );
      } else {
        setErrorMsg('Error de conexión con el servidor.');
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
          Recuperar Contraseña
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 mb-6 text-center">
          Ingrese su correo registrado para enviarle un enlace seguro de restablecimiento.
        </p>

        {errorMsg && (
          <div className="w-full mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {success ? (
          <div className="w-full flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Enlace enviado
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              Si el correo <strong>{email}</strong> coincide con una cuenta activa, recibirá las instrucciones para restablecer su contraseña en los próximos minutos.
            </p>
            <Link
              to="/login"
              className="w-full py-3 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Correo Electrónico
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 w-5 h-5 text-[#20C4BA]" />
                <input
                  type="email"
                  placeholder="ejemplo@minsa.gob.ni"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                'Enviar Enlace de Recuperación'
              )}
            </button>

            <Link
              to="/login"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0F3E48] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}