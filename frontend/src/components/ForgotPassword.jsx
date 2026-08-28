import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check, X, ArrowLeft, CheckCircle2, User, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axiosClient';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Código de usuario, 2 = Preguntas + Nueva contraseña
  const [username, setUsername] = useState('');
  
  // Preguntas y respuestas
  const [questions, setQuestions] = useState({ q1: '', q2: '', q3: '' });
  const [answers, setAnswers] = useState({ a1: '', a2: '', a3: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Validación de requisitos de contraseña
  const rules = {
    length: newPassword.length >= 8,
    hasNumber: /\d/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };

  const isPasswordValid = rules.length && rules.hasNumber && rules.hasUpper && rules.matches;

  // Paso 1: Obtener las preguntas del usuario
  const handleFetchQuestions = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Ingrese su código de usuario.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.post('/auth/security-questions/', {
        username: username.trim(),
      });
      setQuestions({
        q1: res.data.question_1,
        q2: res.data.question_2,
        q3: res.data.question_3,
      });
      setStep(2);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail ||
        err.response?.data?.username?.[0] ||
        'Usuario no encontrado o sin preguntas registradas.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Validar respuestas y restablecer clave
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!answers.a1.trim() || !answers.a2.trim() || !answers.a3.trim()) {
      setErrorMsg('Debe responder a las 3 preguntas de seguridad.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('La nueva contraseña no cumple con los requisitos de seguridad.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password-questions/', {
        username: username.trim(),
        answer_1: answers.a1.trim(),
        answer_2: answers.a2.trim(),
        answer_3: answers.a3.trim(),
        new_password: newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Respuestas incorrectas o error al actualizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#20C4BA]">
      <div className="bg-white w-full max-w-[460px] rounded-[32px] shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        
        <div className="w-16 h-16 bg-[#20C4BA] rounded-2xl flex items-center justify-center shadow-md mb-4">
          <KeyRound className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-[#0F3E48] tracking-tight text-center">
          Recuperación de Cuenta
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6 text-center">
          {step === 1 
            ? 'Ingrese su código institucional para recuperar su acceso' 
            : `Responda las preguntas para el usuario @${username}`}
        </p>

        {errorMsg && (
          <div className="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="w-full p-6 flex flex-col items-center text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-slate-800">¡Contraseña Restablecida!</h3>
            <p className="text-xs text-slate-500 mt-1">Redirigiendo a la pantalla de inicio de sesión...</p>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleFetchQuestions} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Código de Usuario</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-[#20C4BA]" />
                <input
                  type="text"
                  placeholder="Ej. ADM-01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA] outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center disabled:opacity-75"
            >
              {loading ? 'Consultando preguntas...' : 'Continuar'}
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 mt-2">
              <ArrowLeft className="w-4 h-4" /> Volver al Inicio de Sesión
            </Link>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-3.5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#20C4BA]" /> {questions.q1}
              </label>
              <input
                type="text"
                placeholder="Su respuesta"
                value={answers.a1}
                onChange={(e) => setAnswers({ ...answers, a1: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#99F6E4] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#20C4BA]"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#20C4BA]" /> {questions.q2}
              </label>
              <input
                type="text"
                placeholder="Su respuesta"
                value={answers.a2}
                onChange={(e) => setAnswers({ ...answers, a2: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#99F6E4] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#20C4BA]"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#20C4BA]" /> {questions.q3}
              </label>
              <input
                type="text"
                placeholder="Su respuesta"
                value={answers.a3}
                onChange={(e) => setAnswers({ ...answers, a3: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#99F6E4] rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#20C4BA]"
                required
              />
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <label className="text-xs font-bold text-slate-700">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#20C4BA]"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Repita la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#20C4BA]"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-1 text-[11px]">
              <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Mínimo 8 caracteres
              </div>
              <div className={`flex items-center gap-1.5 ${rules.hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Al menos una mayúscula
              </div>
              <div className={`flex items-center gap-1.5 ${rules.hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Al menos un número
              </div>
              <div className={`flex items-center gap-1.5 ${rules.matches ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {rules.matches ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Las contraseñas coinciden
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-2/3 py-2.5 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold rounded-xl text-xs shadow disabled:opacity-50"
              >
                {loading ? 'Restableciendo...' : 'Restablecer Clave'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}