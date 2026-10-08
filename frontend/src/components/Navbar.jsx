import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Users, 
  UserCheck, 
  Activity, 
  LogOut, 
  ClipboardList,
  Settings,
  ChevronDown,
} from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    let active = true;

    axiosClient.get('/institutional-config/')
      .then((response) => {
        if (active) setInstitution(response.data);
      })
      .catch((error) => {
        console.error('Error al cargar la configuración institucional:', error);
      });

    return () => {
      active = false;
    };
  }, []);
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
    navItems.push({ label: 'Auditoría', path: '/audit-logs', icon: ClipboardList });
    navItems.push({ label: 'Configuración', path: '/institutional-settings', icon: Settings });
  }

  return (
    <header className="bg-[#20C4BA] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
            {institution?.logo_url && !logoError ? (
              <img
                src={institution.logo_url}
                alt="Logo institucional"
                onError={() => setLogoError(true)}
                className="h-10 w-10 rounded-2xl bg-white p-1 object-contain"
              />
            ) : (
              <Activity className="h-6 w-6 text-white" />
            )}
          </div>

          <div>
            <h1 className="text-base font-black leading-tight tracking-tight">
              {institution?.name || 'Centro de Salud Pedro Arauz Palacios'}
            </h1>

            <p className="text-[11px] font-medium text-teal-100">
              Sistema de Gestión Médica Integral
            </p>

            {institution?.address && (
              <p
                className="max-w-xs truncate text-[10px] text-teal-100"
                title={institution.address}
              >
                {institution.address}
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3 py-1.5 transition-all hover:bg-white/20"
          >
            <div className="text-right">
              <span className="block text-xs font-bold uppercase leading-tight">{username}</span>
              <span className="block text-[10px] font-semibold uppercase text-teal-100">
                {rawRole || 'PERSONAL'}
              </span>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#20C4BA]">
              {username.charAt(0).toUpperCase()}
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-white/80" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
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