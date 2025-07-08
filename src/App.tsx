import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FullScreenSpinner from './components/FullScreenSpinner';
import MainLayout from './components/MainLayout';
import Landing from './pages/Landing';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import TestDataLayer from './pages/TestDataLayer';

export default function App() {
  const { user, loading } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route 
            path="/dashboard" 
            element={loading ? <FullScreenSpinner /> : (user ? <Dashboard /> : <Navigate to="/login" replace />)} 
          />
          <Route 
            path="/inventory" 
            element={loading ? <FullScreenSpinner /> : (user ? <Inventory /> : <Navigate to="/login" replace />)} 
          />
          <Route 
            path="/customers" 
            element={loading ? <FullScreenSpinner /> : (user ? <Customers /> : <Navigate to="/login" replace />)} 
          />
          <Route 
            path="/test" 
            element={loading ? <FullScreenSpinner /> : (user ? <TestDataLayer /> : <Navigate to="/login" replace />)} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}