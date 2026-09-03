import React, { useState, useEffect } from 'react';
import { X, User, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function UserModal({ isOpen, onClose, userToEdit = null, onUserSaved }) {
  const { isDark } = useTheme();
  const isEditing = Boolean(userToEdit);

  // Mapeo de Rol textual a ID en base de datos PostgreSQL
  const roleToId = {
    ADMIN: 1,
    DOCTOR: 2,
    ADMISSION: 3,
    DIRECTOR: 4
  };

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    role: 'DOCTOR',
    password: '',
    is_active: true,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sincroniza los datos al abrir en modo edición o creación
  useEffect(() => {
    if (userToEdit) {
      // Obtener el código de rol si viene como objeto o string
      const currentRole = userToEdit.role_name || (typeof userToEdit.role === 'object' ? userToEdit.role?.name : userToEdit.role) || 'DOCTOR';

      setFormData({
        username: userToEdit.username || '',
        first_name: userToEdit.first_name || '',
        last_name: userToEdit.last_name || '',
        role: currentRole,
        password: '',
        is_active: userToEdit.is_active ?? true,
      });
    } else {
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        role: 'DOCTOR',
        password: '',
        is_active: true,
      });
    }
    setError('');
    setLoading(false);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      username: formData.username.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      role: roleToId[formData.role] || formData.role,
      is_active: formData.is_active,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (userToEdit) {
        await axiosClient.put(`/users/${userToEdit.id}/`, payload);
      } else {
        await axiosClient.post('/users/', payload);
      }
      onUserSaved();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Error al procesar la solicitud.';

      if (data) {
        if (data.detail) {
          msg = data.detail;
        } else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`w-full max-w-xl rounded-[28px] shadow-2xl overflow-hidden transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800 text-slate-100' 
          : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* Cabecera */}
        <div className={`px-6 py-5 flex items-center justify-between text-white transition-colors duration-200 ${
          isDark 
            ? 'bg-[#131E31] border-b border-slate-800' 
            : 'bg-[#20C4BA]'
        }`}>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h2>
            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-teal-50'}`}>
              {isEditing ? 'Actualice los datos del perfil' : 'Complete la información para crear la cuenta'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold border ${
            isDark 
              ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' 
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Fila 1: Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Nombres</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Ej. Roberto"
                className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Apellidos</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Ej. Mendoza"
                className={`w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>
          </div>

          {/* Fila 2: Usuario y Rol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Usuario / Código *</label>
              <div className="relative flex items-center">
                <User className={`absolute left-3.5 w-4 h-4 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
                <input
                  type="text"
                  name="username"
                  required
                  disabled={isEditing}
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ej. DOC-01"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all disabled:opacity-60 border ${
                    isDark 
                      ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                      : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Rol del Sistema *</label>
              <div className="relative flex items-center">
                <ShieldCheck className={`absolute left-3.5 w-4 h-4 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all appearance-none cursor-pointer border ${
                    isDark 
                      ? 'bg-[#1E293B] border-slate-700 text-slate-100 focus:ring-2 focus:ring-teal-400' 
                      : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 focus:ring-2 focus:ring-[#20C4BA]'
                  }`}
                >
                  <option value="ADMIN">Administrador de TI</option>
                  <option value="DOCTOR">Personal Médico</option>
                  <option value="ADMISSION">Personal de Admisión</option>
                  <option value="DIRECTOR">Dirección del Centro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fila 3: Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial *'}
            </label>
            <div className="relative flex items-center">
              <Lock className={`absolute left-3.5 w-4 h-4 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
              <input
                type="password"
                name="password"
                required={!isEditing}
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? 'Dejar en blanco para mantener la actual' : 'Mínimo 8 caracteres'}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all border ${
                  isDark 
                    ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-teal-400' 
                    : 'bg-[#F0FDFA] border-[#99F6E4] text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
                }`}
              />
            </div>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center gap-2.5 mt-1">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className={`w-4 h-4 rounded cursor-pointer ${
                isDark ? 'accent-teal-500' : 'accent-[#20C4BA]'
              }`}
            />
            <label htmlFor="is_active" className={`text-xs font-medium cursor-pointer ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Usuario activo (permite acceso al sistema)
            </label>
          </div>

          {/* Botones */}
          <div className={`flex items-center justify-end gap-3 mt-4 pt-3 border-t ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl border font-semibold text-xs transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-75 cursor-pointer ${
                isDark 
                  ? 'bg-[#0D9488] hover:bg-[#0F766E] text-white' 
                  : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}