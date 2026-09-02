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


  if (!token) {
    return <Navigate to="/login" replace />;
  }


  const perfNav = performance.getEntriesByType('navigation')[0];
  const isDirectUrlEntry = navType === 'POP' && (!perfNav || perfNav.type === 'navigate' || perfNav.type === 'reload');


  if (!location.state?.fromApp && isDirectUrlEntry) {
    return <Navigate to="/home" replace />;
  }

  const isDoctor = rawRole === 'DOCTOR' || username.toUpperCase().startsWith('DOC');
  const hasOrganizationAccess = !isDoctor && (
    rawRole === 'ADMIN' ||
    rawRole === 'ADMINISTRADOR' ||
    rawRole === 'DIRECTOR' ||
    username.toUpperCase().startsWith('ADM') ||
    username.toUpperCase().startsWith('DIR')
  );

  if (adminOnly && !hasOrganizationAccess) {
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