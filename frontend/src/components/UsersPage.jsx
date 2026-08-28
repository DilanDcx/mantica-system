import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Search, RefreshCw, CheckCircle, 
  XCircle, Clock, Edit2, Shield, AlertCircle 
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import UserModal from './UserModal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mapeo de Roles y Estilos de Badge
  const roleConfig = {
    ADMIN: { label: 'Administrador de TI', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    DOCTOR: { label: 'Personal Médico', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    ADMISSION: { label: 'Personal de Admisión', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    DIRECTOR: { label: 'Dirección del Centro', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  };

  // Cargar usuarios desde la API de Django
  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await axiosClient.get('/users/');
      // Manejar respuesta directa o paginada ({ results: [...] })
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-[#0F3E48] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#20C4BA]" />
            Gestión de Usuarios del Sistema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administre los accesos institucionales y roles del personal del centro de salud.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white font-bold rounded-xl text-xs shadow-md transition-all"
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#20C4BA] shadow-sm"
          />
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Usuario / Nombre</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6">Último Acceso</th>
                <th className="py-3.5 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#20C4BA]" />
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
                    color: 'bg-slate-100 text-slate-700 border-slate-200' 
                  };

                  return (
                    <tr key={user.id || user.username} className="hover:bg-slate-50/50 transition-colors">
                      {/* Usuario y Nombre */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                              : 'Usuario Institucional'}
                          </span>
                          <span className="text-[11px] text-[#20C4BA] font-semibold">
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5 text-red-500" /> Inactivo
                          </span>
                        )}
                      </td>

                      {/* Último Acceso */}
                      <td className="py-4 px-6 text-slate-500 text-[11px]">
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
                          className="p-1.5 text-slate-400 hover:text-[#20C4BA] hover:bg-slate-100 rounded-lg transition-all"
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