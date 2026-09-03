import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, RefreshCw, CheckCircle, 
  XCircle, Clock, Edit2, Shield, AlertCircle 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import UserModal from './UserModal';
import { useTheme } from '../context/ThemeContext';

export default function UsersPage() {
  const { isDark } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mapeo de Roles y Estilos de Badge según el tema
  const roleConfig = {
    ADMIN: { 
      label: 'Administrador de TI', 
      color: isDark 
        ? 'bg-purple-950/60 text-purple-300 border-purple-800/60' 
        : 'bg-purple-100 text-purple-700 border-purple-200' 
    },
    DOCTOR: { 
      label: 'Personal Médico', 
      color: isDark 
        ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' 
        : 'bg-cyan-100 text-cyan-700 border-cyan-200' 
    },
    ADMISSION: { 
      label: 'Personal de Admisión', 
      color: isDark 
        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
        : 'bg-emerald-100 text-emerald-700 border-emerald-200' 
    },
    DIRECTOR: { 
      label: 'Dirección del Centro', 
      color: isDark 
        ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' 
        : 'bg-amber-100 text-amber-700 border-amber-200' 
    },
  };

  // Cargar usuarios desde la API de Django
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axiosClient.get('/users/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUsers(data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setErrorMsg('No se pudo cargar la lista de usuarios. Compruebe la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrar por término de búsqueda (nombre, apellido o código de usuario)
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const username = (u.username || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || username.includes(search);
  });

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Acciones Principales */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl shadow-sm transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800/80' 
          : 'bg-white border-slate-100'
      }`}>
        <div>
          <h1 className={`text-xl font-bold flex items-center gap-2 transition-colors ${
            isDark ? 'text-slate-100' : 'text-[#0F3E48]'
          }`}>
            <Shield className={`w-6 h-6 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
            Gestión de Usuarios del Sistema
          </h1>
          <p className={`text-xs mt-1 transition-colors ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Administre los accesos institucionales y roles del personal del centro de salud.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer ${
            isDark 
              ? 'bg-[#0D9488] hover:bg-[#0F766E] text-white' 
              : 'bg-[#20C4BA] hover:bg-[#1bb0a7] text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none transition-all shadow-sm border ${
              isDark 
                ? 'bg-[#1E293B] border-slate-700 text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400' 
                : 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#20C4BA]'
            }`}
          />
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all border cursor-pointer ${
            isDark 
              ? 'bg-[#1E293B] border-slate-700 text-slate-300 hover:bg-slate-800' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
          isDark 
            ? 'bg-rose-950/40 border-rose-900/60 text-rose-300' 
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className={`rounded-2xl shadow-sm overflow-hidden transition-colors duration-200 border ${
        isDark 
          ? 'bg-[#0F172A] border-slate-800/80' 
          : 'bg-white border-slate-100'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider transition-colors ${
                isDark 
                  ? 'bg-slate-800/60 border-slate-800 text-slate-400' 
                  : 'bg-slate-50/75 border-slate-100 text-slate-500'
              }`}>
                <th className="py-3.5 px-6">Usuario / Nombre</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6">Último Acceso</th>
                <th className="py-3.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs transition-colors ${
              isDark ? 'divide-slate-800/80 text-slate-200' : 'divide-slate-100 text-slate-700'
            }`}>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    <RefreshCw className={`w-6 h-6 animate-spin mx-auto mb-2 ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`} />
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleKey = user.role_name || (typeof user.role === 'object' ? user.role?.name : user.role);
                  const roleInfo = roleConfig[roleKey] || { 
                    label: user.role_display || roleKey || 'Sin Rol', 
                    color: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200' 
                  };

                  return (
                    <tr 
                      key={user.id || user.username} 
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Usuario y Nombre */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className={`font-bold transition-colors ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                              : 'Usuario Institucional'}
                          </span>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-teal-400' : 'text-[#20C4BA]'}`}>
                            @{user.username}
                          </span>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6">
                        {user.is_active ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            isDark 
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            <CheckCircle className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} /> Activo
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            isDark 
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            <XCircle className={`w-3.5 h-3.5 ${isDark ? 'text-rose-400' : 'text-red-500'}`} /> Inactivo
                          </span>
                        )}
                      </td>

                      {/* Último Acceso */}
                      <td className={`py-4 px-6 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {user.last_login 
                              ? new Date(user.last_login).toLocaleString('es-NI', { dateStyle: 'short', timeStyle: 'short' })
                              : 'Nunca'}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenModal(user)}
                          title="Editar usuario"
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isDark 
                              ? 'text-slate-400 hover:text-teal-400 hover:bg-slate-800' 
                              : 'text-slate-400 hover:text-[#20C4BA] hover:bg-slate-100'
                          }`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear / Editar Usuario */}
      {isModalOpen && (
        <UserModal
          isOpen={isModalOpen}
          userToEdit={selectedUser}
          onClose={handleCloseModal}
          onUserSaved={() => {
            handleCloseModal();
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}