import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function UserModal({ isOpen, onClose, userToEdit = null, onUserSaved }) {
  const isEditing = Boolean(userToEdit);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'MEDICO',
    password: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza los datos cuando se abre en modo edición o creación
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        first_name: userToEdit.first_name || '',
        last_name: userToEdit.last_name || '',
        email: userToEdit.email || '',
        role: userToEdit.role || 'MEDICO',
        password: '', // Se deja vacío para no sobrescribir a menos que se ingrese una nueva
        is_active: userToEdit.is_active ?? true,
      });
    } else {
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        role: 'MEDICO',
        password: '',
        is_active: true,
      });
    }
    setErrorMsg('');
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
    setErrorMsg('');

    // Validaciones básicas de cliente
    if (!formData.username.trim() || !formData.email.trim()) {
      setErrorMsg('El nombre de usuario y el correo son obligatorios.');
      return;
    }

    if (!isEditing && !formData.password) {
      setErrorMsg('La contraseña es requerida para nuevos usuarios.');
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData };
      // Si estamos editando y no se escribió nueva contraseña, se excluye del envío
      if (isEditing && !payload.password) {
        delete payload.password;
      }

      let response;
      if (isEditing) {
        response = await axiosClient.put(`/api/users/${userToEdit.id}/`, payload);
      } else {
        response = await axiosClient.post('/api/users/', payload);
      }

      if (onUserSaved) {
        onUserSaved(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (error.response?.data) {
        const data = error.response.data;
        const firstErrorKey = Object.keys(data)[0];
        const errorText = Array.isArray(data[firstErrorKey]) 
          ? data[firstErrorKey][0] 
          : data.detail || 'Error al guardar los datos del usuario.';
        setErrorMsg(`${firstErrorKey}: ${errorText}`);
      } else {
        setErrorMsg('Error de comunicación con el servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="bg-[#20C4BA] px-6 py-5 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h2>
            <p className="text-xs text-teal-50 font-medium mt-0.5">
              {isEditing ? 'Actualice los datos del perfil' : 'Complete la información para crear la cuenta'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombres */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Nombres</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Ej. Juan"
                className="w-full px-3.5 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
              />
            </div>

            {/* Apellidos */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Apellidos</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Ej. Pérez"
                className="w-full px-3.5 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre de Usuario */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Usuario *</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-[#20C4BA]" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="ej. jperez"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Correo Institucional *</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-[#20C4BA]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@minsa.gob.ni"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rol de Usuario */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Rol del Sistema *</label>
              <div className="relative flex items-center">
                <ShieldCheck className="absolute left-3 w-4 h-4 text-[#20C4BA]" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="MEDICO">Médico</option>
                  <option value="ENFERMERIA">Enfermería</option>
                  <option value="RECEPCION">Recepción</option>
                </select>
              </div>
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-[#20C4BA]" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditing ? 'Dejar en blanco para no cambiar' : 'Mínimo 8 caracteres'}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Estado Activo */}
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 text-[#20C4BA] border-slate-300 rounded focus:ring-[#20C4BA] accent-[#20C4BA] cursor-pointer"
            />
            <label htmlFor="is_active" className="text-xs font-medium text-slate-700 cursor-pointer">
              Usuario activo (permite acceso al sistema)
            </label>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-75"
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