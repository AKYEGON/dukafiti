import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import LoginPage from './pages/Login';
import ProtectedApp from './components/ProtectedApp';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no auth context needed */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* All other routes go to the protected app */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  );
}