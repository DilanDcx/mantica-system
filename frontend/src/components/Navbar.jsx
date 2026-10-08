import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FolderOpen,
  Users,
  Calendar,
  UserCheck,
  Activity,
  LogOut,
  ClipboardList,
  Settings,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    axiosClient
      .get('/institutional-config/')
      .then((response) => {
        if (active) setInstitution(response.data);
      })
      .catch((error) => {
        console.error(
          'Error al cargar la configuración institucional:',
          error
        );
      });

    return () => {
      active = false;
    };
  }, []);

  const username = (localStorage.getItem('username') || 'Usuario').trim();
  const rawRole = (localStorage.getItem('user_role') || '')
    .trim()
    .toUpperCase();

  const isDoctor =
    rawRole === 'DOCTOR' || username.toUpperCase().startsWith('DOC');

  const hasOrganizationAccess =
    !isDoctor &&
    (
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
    { label: 'Citas', path: '/appointments', icon: Calendar },
  ];

  if (hasOrganizationAccess) {
    navItems.push(
      { label: 'Organización', path: '/users', icon: UserCheck },
      { label: 'Auditoría', path: '/audit-logs', icon: ClipboardList },
      {
        label: 'Configuración',
        path: '/institutional-settings',
        icon: Settings,
      }
    );
  }

  return (
    <header
      className={`shadow-md transition-colors duration-200 ${
        isDark
          ? 'border-b border-slate-800/80 bg-[#0B1320] text-slate-100'
          : 'bg-[#20C4BA] text-white'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Identidad institucional */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
              isDark
                ? 'border border-slate-700/60 bg-slate-800/80'
                : 'bg-white/20'
            }`}
          >
            {institution?.logo_url && !logoError ? (
              <img
                src={institution.logo_url}
                alt="Logo institucional"
                onError={() => setLogoError(true)}
                className="h-10 w-10 rounded-2xl bg-white p-1 object-contain"
              />
            ) : (
              <Activity
                className={`h-6 w-6 ${
                  isDark ? 'text-teal-400' : 'text-white'
                }`}
              />
            )}
          </div>

          <div>
            <h1 className="text-base font-black leading-tight tracking-tight">
              {institution?.name || 'Centro de Salud Pedro Arauz Palacios'}
            </h1>

            <p
              className={`text-[11px] font-medium ${
                isDark ? 'text-slate-400' : 'text-teal-100'
              }`}
            >
              Sistema de Gestión Médica Integral
            </p>

            {institution?.address && (
              <p
                className={`max-w-xs truncate text-[10px] ${
                  isDark ? 'text-slate-400' : 'text-teal-100'
                }`}
                title={institution.address}
              >
                {institution.address}
              </p>
            )}
          </div>
        </div>

        {/* Controles de cabecera */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className={`flex cursor-pointer items-center justify-center rounded-xl p-2 transition-all ${
              isDark
                ? 'border border-slate-700/60 bg-slate-800/80 text-amber-400 hover:bg-slate-700'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all ${
                isDark
                  ? 'border border-slate-700/60 bg-slate-800/70 hover:bg-slate-800'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <div className="text-right">
                <span className="block text-xs font-bold uppercase leading-tight">
                  {username}
                </span>
                <span
                  className={`block text-[10px] font-semibold uppercase ${
                    isDark ? 'text-slate-400' : 'text-teal-100'
                  }`}
                >
                  {rawRole || 'PERSONAL'}
                </span>
              </div>

              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                  isDark
                    ? 'bg-[#0D9488] text-white'
                    : 'bg-white text-[#20C4BA]'
                }`}
              >
                {username.charAt(0).toUpperCase()}
              </div>

              <ChevronDown
                className={`h-3.5 w-3.5 ${
                  isDark ? 'text-slate-400' : 'text-white/80'
                }`}
              />
            </button>

            {menuOpen && (
              <div
                className={`absolute right-0 z-50 mt-2 w-44 rounded-2xl py-1.5 shadow-xl transition-colors ${
                  isDark
                    ? 'border border-slate-800 bg-[#0F172A] text-slate-200'
                    : 'border border-slate-100 bg-white text-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-xs font-bold text-rose-500 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 pb-2">
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
                    ? 'flex items-center gap-2 rounded-xl border border-[#0D9488]/40 bg-[#0D9488]/20 px-4 py-1.5 text-xs font-bold text-[#2DD4BF] shadow-sm transition-all'
                    : 'flex items-center gap-2 rounded-xl bg-white px-4 py-1.5 text-xs font-bold text-[#14958D] shadow-sm transition-all';
                }

                return isDark
                  ? 'flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold text-slate-400 transition-all hover:bg-slate-800/60 hover:text-slate-200'
                  : 'flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-bold text-white/80 transition-all hover:bg-white/10 hover:text-white';
              }}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}