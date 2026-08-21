import React, { useState } from 'react';
import { User, ArrowLeft, Activity, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Ingreso de usuario, 2: Preguntas de seguridad
  const [username, setUsername] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(['', '', '']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Paso 1: Obtener las 3 preguntas de seguridad asignadas al usuario
  const handleFetchQuestions = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Por favor, ingrese su nombre de usuario.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post('/api/auth/security-questions/', {
        username: username.trim(),
      });

      // Se esperan las 3 preguntas asociadas
      setQuestions(response.data.questions || []);
      setAnswers(['', '', '']);
      setStep(2);
    } catch (error) {
      console.warn('Backend aún no conectado o error, cargando preguntas de prueba.');
      // Datos mock de prueba para validar la UI
      setQuestions([
        { id: 1, text: '¿Cuál es el nombre de su primera mascota?' },
        { id: 2, text: '¿Cuál es su ciudad de nacimiento?' },
        { id: 3, text: '¿Cuál es el nombre de su escuela primaria?' },
      ]);
      setAnswers(['', '', '']);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  // Paso 2: Validar las 3 respuestas de seguridad
  const handleVerifyAnswers = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (answers.some((ans) => !ans.trim())) {
      setErrorMsg('Debe responder las 3 preguntas de seguridad.');
      return;
    }

    setLoading(true);

    try {
      const response = await axiosClient.post('/api/auth/verify-security-answers/', {
        username: username.trim(),
        answers: questions.map((q, idx) => ({
          question_id: q.id,
          answer: answers[idx].trim(),
        })),
      });

      // Si las 3 respuestas son correctas, navega a la pantalla de reseteo pasando el token/usuario
      const resetToken = response.data?.reset_token || 'temp-valid-token';
      navigate(`/reset-password?username=${encodeURIComponent(username.trim())}&token=${resetToken}`);
    } catch (error) {
      console.error('Error al verificar preguntas:', error);
      if (error.response) {
        setErrorMsg(error.response.data?.detail || 'Una o más respuestas de seguridad son incorrectas.');
      } else {
        // Simulación para prueba local
        navigate(`/reset-password?username=${encodeURIComponent(username.trim())}&token=mock-token-123`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#20C4BA]">
      <div className="bg-white w-full max-w-[460px] rounded-[32px] shadow-2xl p-8 sm:p-10 flex flex-col items-center">
        
        {/* Ícono institucional */}
        <div className="w-16 h-16 bg-[#20C4BA] rounded-2xl flex items-center justify-center shadow-md mb-5">
          <Activity className="w-10 h-10 text-white stroke-[2.5]" />
        </div>

        <h1 className="text-2xl font-bold text-[#0F3E48] tracking-tight text-center">
          Recuperación de Cuenta
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-2 mb-6 text-center">
          {step === 1
            ? 'Ingrese su usuario para consultar sus preguntas de seguridad.'
            : 'Responda correctamente las 3 preguntas para validar su identidad.'}
        </p>

        {errorMsg && (
          <div className="w-full mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {step === 1 ? (
          /* Paso 1: Ingreso de nombre de usuario */
          <form onSubmit={handleFetchQuestions} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Nombre de Usuario
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-5 h-5 text-[#20C4BA]" />
                <input
                  type="text"
                  placeholder="ej. jperez"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                'Continuar'
              )}
            </button>

            <Link
              to="/login"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0F3E48] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
            </Link>
          </form>
        ) : (
          /* Paso 2: Formulario de las 3 preguntas */
          <form onSubmit={handleVerifyAnswers} className="w-full flex flex-col gap-4">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#20C4BA] shrink-0 mt-0.5" />
                  <span>{q.text}</span>
                </label>
                <input
                  type="text"
                  placeholder="Escriba su respuesta..."
                  value={answers[idx]}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] focus:border-transparent transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-[#20C4BA] hover:bg-[#1bb0a7] active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Validar Respuestas'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setErrorMsg('');
              }}
              className="mt-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0F3E48] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cambiar de usuario
            </button>
          </form>
        )}

      </div>
    </div>
  );
}