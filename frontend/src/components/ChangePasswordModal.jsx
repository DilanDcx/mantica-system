import React, { useState } from 'react';
import { Lock, X, Check, CheckCircle2, ShieldAlert } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ChangePasswordModal({ isOpen, onClose }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden border border-slate-100">
        
        <div className="bg-[#20C4BA] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <h3 className="font-bold text-sm">Cambiar Contraseña</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
            <p className="font-bold text-slate-800 text-sm">Contraseña actualizada exitosamente</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-3.5">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Contraseña Actual *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#20C4BA] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Nueva Contraseña *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#20C4BA] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Confirmar Nueva Contraseña *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#20C4BA] outline-none"
              />
            </div>

            {/* Requisitos */}
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Mínimo 8 caracteres
              </div>
              <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Una mayúscula
              </div>
              <div className={`flex items-center gap-1.5 ${rules.hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Un número
              </div>
              <div className={`flex items-center gap-1.5 ${rules.matches ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.matches ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Las contraseñas coinciden
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-4 py-2 rounded-xl bg-[#20C4BA] hover:bg-[#1bb0a7] text-white text-xs font-bold shadow disabled:opacity-50"
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