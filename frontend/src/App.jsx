import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/login';
import ForgotPassword from './components/ForgotPassword';
import UsersPage from './components/UsersPage'; 
import PatientsPage from './components/PatientsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;