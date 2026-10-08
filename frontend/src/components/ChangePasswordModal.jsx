import React, { useState } from 'react';
import { Lock, X, Check, CheckCircle2, ShieldAlert } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const rules = {
    length: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isFormValid = currentPassword && rules.length && rules.hasNumber && rules.hasUpper && rules.matches;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isFormValid) {
      setErrorMsg('Complete todos los campos respetando los requisitos de seguridad.');
      return;
    }

    setLoading(true);

    try {
      await axiosClient.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setErrorMsg(error.response?.data?.detail || 'La contraseña actual no es correcta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className={`w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden transition-colors duration-200 border ${
        isDark ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        <div className={`px-6 py-4 flex items-center justify-between text-white transition-colors ${
          isDark ? 'bg-[#131E31] border-b border-slate-800' : 'bg-[#20C4BA]'
        }`}>
          <div className="flex items-center gap-2">
            <Lock className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-white'}`} />
            <h3 className="font-bold text-sm">Cambiar Contraseña</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <p className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              Contraseña actualizada exitosamente
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5">
            {errorMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                isDark ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Contraseña Actual *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nueva Contraseña *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Confirmar Nueva Contraseña *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>

            {/* Requisitos */}
            <div className={`p-2.5 rounded-xl flex flex-col gap-1 text-[11px] border transition-colors ${
              isDark ? 'bg-[#1E293B]/70 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {rules.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Mínimo 8 caracteres
              </div>
              <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {rules.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Una mayúscula
              </div>
              <div className={`flex items-center gap-1.5 ${rules.hasNumber ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {rules.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Un número
              </div>
              <div className={`flex items-center gap-1.5 ${rules.matches ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {rules.matches ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Las contraseñas coinciden
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow disabled:opacity-50 transition-all cursor-pointer ${
                  isDark ? 'bg-[#0D9488] hover:bg-[#0F766E] text-white' : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
                }`}
              >
                Actualizar Contraseña
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}