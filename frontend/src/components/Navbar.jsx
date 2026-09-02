import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Users, 
  UserCheck, 
  Activity, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const username = (localStorage.getItem('username') || 'Usuario').trim();
  const rawRole = (localStorage.getItem('user_role') || '').trim().toUpperCase();

  const isDoctor = rawRole === 'DOCTOR' || username.toUpperCase().startsWith('DOC');
  const isAdmin = !isDoctor && (rawRole === 'ADMIN' || rawRole === 'ADMINISTRADOR' || username.toUpperCase().startsWith('ADM'));

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Inicio', path: '/home', icon: Home },
    { label: 'Expedientes', path: '/medical-records', icon: FolderOpen },
    { label: 'Pacientes', path: '/patients', icon: Users },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Organización', path: '/users', icon: UserCheck });
  }

  return (
    <header className="bg-[#20C4BA] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">
              Centro de Salud Mantica Berios
            </h1>
            <p className="text-[11px] text-teal-100 font-medium">
              Sistema de Gestión Médica Integral
            </p>
          </div>
        </div>

        {/* Perfil & Logout */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
          >
            <div className="text-right">
              <span className="block text-xs font-bold leading-tight uppercase">{username}</span>
              <span className="block text-[10px] text-teal-100 uppercase font-semibold">{rawRole || 'PERSONAL'}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white text-[#20C4BA] flex items-center justify-center font-bold text-xs">
              {username.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/80" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Rutas */}
      <nav className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              state={{ fromApp: true }}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-[#14958D] shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}