import { BrowserRouter, Routes, Route, Navigate, useNavigationType, useLocation } from 'react-router-dom';
import Login from './components/login';
import ForgotPassword from './components/ForgotPassword';
import UsersPage from './components/UsersPage';
import PatientsPage from './components/PatientsPage';
import MedicalRecordsPage from './components/MedicalRecordsPage';
import HomePage from './components/HomePage';
import Navbar from './components/Navbar';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

// 🔒 Guardián de Autenticación Base (para Home)
function AuthRoute({ children }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// 🔒 GUARDIÁN ESTRICTO ANTI-URL MANUAL
function StrictInternalRoute({ children, adminOnly = false }) {
  const navType = useNavigationType(); // 'PUSH' o 'REPLACE' cuando se hace clic en la app, 'POP' al escribir en URL o recargar
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const username = (localStorage.getItem('username') || '').trim();
  const rawRole = (localStorage.getItem('user_role') || '').trim().toUpperCase();

  // 1. Si no hay sesión, al login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Detección de entrada manual:
  // Cuando escribes la URL y das Enter, o abres una nueva pestaña, React Router detecta 'POP'
  // y performance.getEntriesByType('navigation')[0].type detecta 'navigate' o 'reload'.
  // Cuando haces clic dentro de la app (Navbar), navType es 'PUSH' o 'REPLACE'.
  const perfNav = performance.getEntriesByType('navigation')[0];
  const isDirectUrlEntry = navType === 'POP' && (!perfNav || perfNav.type === 'navigate' || perfNav.type === 'reload');

  // Si no viene con la bandera interna en el estado Y fue entrada directa:
  if (!location.state?.fromApp && isDirectUrlEntry) {
    return <Navigate to="/home" replace />;
  }

  // 3. Comprobación de Administrador
  const isDoctor = rawRole === 'DOCTOR' || username.toUpperCase().startsWith('DOC');
  const isAdmin = !isDoctor && (rawRole === 'ADMIN' || rawRole === 'ADMINISTRADOR' || username.toUpperCase().startsWith('ADM'));

  if (adminOnly && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Pantalla principal */}
        <Route 
          path="/home" 
          element={
            <AuthRoute>
              <HomePage />
            </AuthRoute>
          } 
        />

        {/* Módulos protegidos contra URL directa */}
        <Route 
          path="/medical-records" 
          element={
            <StrictInternalRoute>
              <AppLayout><MedicalRecordsPage /></AppLayout>
            </StrictInternalRoute>
          } 
        />
        <Route 
          path="/patients" 
          element={
            <StrictInternalRoute>
              <AppLayout><PatientsPage /></AppLayout>
            </StrictInternalRoute>
          } 
        />
        <Route 
          path="/users" 
          element={
            <StrictInternalRoute adminOnly={true}>
              <AppLayout><UsersPage /></AppLayout>
            </StrictInternalRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;