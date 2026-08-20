import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Edit2, 
  Search, 
  Shield, 
  CheckCircle, 
  XCircle, 
  History, 
  RefreshCw,
  Clock,
  X
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import UserModal from '../components/UserModal';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Control del modal de edición/creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Control del modal de historial/auditoría
  const [historyUser, setHistoryUser] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Cargar usuarios desde la API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/api/users/');
      setUsers(response.data);
    } catch (error) {
      console.warn('Backend aún no disponible o sin datos, cargando datos de demostración para UI.');
      // Datos mock para visualización y pruebas de interfaz
      setUsers([
        {
          id: 1,
          username: 'admin.mantica',
          first_name: 'Administrador',
          last_name: 'General',
          email: 'admin@minsa.gob.ni',
          role: 'ADMIN',
          is_active: true,
          last_login: '2026-08-19 14:30',
          created_at: '2026-01-10',
          history: [
            { action: 'Inicio de sesión exitoso', date: '2026-08-19 14:30', ip: '192.168.1.45' },
            { action: 'Actualización de rol de usuario #3', date: '2026-08-15 09:12', ip: '192.168.1.45' }
          ]
        },
        {
          id: 2,
          username: 'dr.martinez',
          first_name: 'Carlos',
          last_name: 'Martínez Ruiz',
          email: 'cmartinez@minsa.gob.ni',
          role: 'MEDICO',
          is_active: true,
          last_login: '2026-08-18 10:15',
          created_at: '2026-02-01',
          history: [
            { action: 'Inicio de sesión exitoso', date: '2026-08-18 10:15', ip: '192.168.1.102' },
            { action: 'Registro de consulta médica #1042', date: '2026-08-18 11:00', ip: '192.168.1.102' }
          ]
        },
        {
          id: 3,
          username: 'enf.gonzalez',
          first_name: 'Elena',
          last_name: 'González Valle',
          email: 'egonzalez@minsa.gob.ni',
          role: 'ENFERMERIA',
          is_active: false,
          last_login: '2026-07-22 08:00',
          created_at: '2026-03-15',
          history: [
            { action: 'Cuenta suspendida por administración', date: '2026-07-25 16:00', ip: '192.168.1.45' },
            { action: 'Inicio de sesión fallido', date: '2026-07-22 07:58', ip: '192.168.1.80' }
          ]
        },
        {
          id: 4,
          username: 'rec.torres',
          first_name: 'Sofía',
          last_name: 'Torres Morales',
          email: 'storres@minsa.gob.ni',
          role: 'RECEPCION',
          is_active: true,
          last_login: '2026-08-20 07:45',
          created_at: '2026-04-05',
          history: [
            { action: 'Inicio de sesión exitoso', date: '2026-08-20 07:45', ip: '192.168.1.12' },
            { action: 'Admisión de paciente expediente #4521', date: '2026-08-20 08:10', ip: '192.168.1.12' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handlers para modal de usuario
  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleViewHistory = (user) => {
    setHistoryUser(user);
    setIsHistoryModalOpen(true);
  };

  const handleUserSaved = () => {
    fetchUsers();
  };

  // Filtrado reactivo en la tabla
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Mapeo de estilos para los roles
  const getRoleBadge = (role) => {
    const rolesMap = {
      ADMIN: { label: 'Administrador', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
      MEDICO: { label: 'Médico', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
      ENFERMERIA: { label: 'Enfermería', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      RECEPCION: { label: 'Recepción', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    };
    const current = rolesMap[role] || { label: role, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${current.bg}`}>
        {current.label}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Cabecera del Módulo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3E48] tracking-tight">Administración de Usuarios</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Gestión centralizada del personal, credenciales, niveles de acceso y auditoría.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-[#20C4BA] hover:bg-[#1bb0a7] text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#20C4BA] focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600">Rol:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-[#20C4BA] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="MEDICO">Médico</option>
            <option value="ENFERMERIA">Enfermería</option>
            <option value="RECEPCION">Recepción</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Usuario / Nombre</th>
                <th className="py-3.5 px-6">Correo</th>
                <th className="py-3.5 px-6">Rol</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
                <th className="py-3.5 px-6">Último Acceso</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Usuario y Nombre */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">
                        {user.first_name || user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user.username}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                    </td>

                    {/* Correo */}
                    <td className="py-4 px-6 text-slate-600 font-medium">{user.email}</td>

                    {/* Rol */}
                    <td className="py-4 px-6">{getRoleBadge(user.role)}</td>

                    {/* Indicador de Estado */}
                    <td className="py-4 px-6 text-center">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Último Acceso */}
                    <td className="py-4 px-6 text-slate-500">
                      {user.last_login ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.last_login}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Nunca</span>
                      )}
                    </td>

                    {/* Botones de Acciones */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botón de Historial */}
                        <button
                          onClick={() => handleViewHistory(user)}
                          title="Ver Historial / Auditoría"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#0F3E48] hover:bg-slate-100 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Botón de Edición (Abre UserModal) */}
                        <button
                          onClick={() => handleEdit(user)}
                          title="Editar Usuario"
                          className="p-1.5 rounded-lg bg-teal-50 border border-teal-200 text-[#20C4BA] hover:bg-[#20C4BA] hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No se encontraron usuarios con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={selectedUser}
        onUserSaved={handleUserSaved}
      />

      {/* Modal de Historial / Auditoría de Usuario */}
      {isHistoryModalOpen && historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-[#0F3E48] px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#20C4BA]" />
                <div>
                  <h3 className="font-bold text-sm">Historial de Auditoría</h3>
                  <p className="text-[11px] text-slate-300">Usuario: @{historyUser.username}</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-80 overflow-y-auto">
              {historyUser.history && historyUser.history.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-4">
                  {historyUser.history.map((item, idx) => (
                    <div key={idx} className="relative pl-5">
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-[#20C4BA] border-2 border-white"></div>
                      <p className="text-xs font-semibold text-slate-800">{item.action}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>IP: {item.ip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No hay registros de auditoría recientes.</p>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}