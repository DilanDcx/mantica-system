import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Users, 
  UserCheck, 
  Activity, 
  LogOut, 
  ChevronDown,
  Sun,
  Moon 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const navigate = useNavigate();

  const username = (localStorage.getItem('username') || 'Usuario').trim();
  const rawRole = (localStorage.getItem('user_role') || '').trim().toUpperCase();

  const isDoctor = rawRole === 'DOCTOR' || username.toUpperCase().startsWith('DOC');
  const hasOrganizationAccess = !isDoctor && (
    rawRole === 'ADMIN' ||
    rawRole === 'ADMINISTRADOR' ||
    rawRole === 'DIRECTOR' ||
    username.toUpperCase().startsWith('ADM') ||
    username.toUpperCase().startsWith('DIR')
  );

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

  if (hasOrganizationAccess) {
    navItems.push({ label: 'Organización', path: '/users', icon: UserCheck });
  }

  return (
    <header 
      className={`transition-colors duration-200 shadow-md ${
        isDark 
          ? 'bg-[#0B1320] border-b border-slate-800/80 text-slate-100' 
          : 'bg-[#20C4BA] text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Identidad Institucional */}
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
              isDark 
                ? 'bg-slate-800/80 border border-slate-700/60 text-teal-400' 
                : 'bg-white/20 text-white'
            }`}
          >
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight leading-tight">
              Centro de Salud Mántica Berio
            </h1>
            <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-teal-100'}`}>
              Sistema de Gestión Médica Integral
            </p>
          </div>
        </div>

        {/* Controles de Cabecera */}
        <div className="flex items-center gap-3">
          
          {/* Botón Switch Tema */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              isDark 
                ? 'bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-amber-400' 
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Menú de Usuario */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="text-right">
                <span className="block text-xs font-bold leading-tight uppercase">
                  {username}
                </span>
                <span className={`block text-[10px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-teal-100'}`}>
                  {rawRole || 'PERSONAL'}
                </span>
              </div>
              <div 
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isDark 
                    ? 'bg-[#0D9488] text-white' 
                    : 'bg-white text-[#20C4BA]'
                }`}
              >
                {username.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-white/80'}`} />
            </button>

            {menuOpen && (
              <div 
                className={`absolute right-0 mt-2 w-44 rounded-2xl shadow-xl py-1.5 z-50 transition-colors ${
                  isDark 
                    ? 'bg-[#0F172A] border border-slate-800 text-slate-200' 
                    : 'bg-white border border-slate-100 text-slate-800'
                }`}
              >
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      <nav className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              state={{ fromApp: true }}
              className={({ isActive }) => {
                if (isActive) {
                  return isDark
                    ? 'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-[#0D9488]/20 text-[#2DD4BF] border border-[#0D9488]/40 shadow-sm'
                    : 'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-white text-[#14958D] shadow-sm';
                }
                return isDark
                  ? 'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  : 'flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all text-white/80 hover:bg-white/10 hover:text-white';
              }}
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