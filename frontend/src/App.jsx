import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UsersPage from './components/UsersPage'; // Importa la página de prueba

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;