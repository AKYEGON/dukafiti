import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import FullScreenSpinner from './components/FullScreenSpinner';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import TestDataLayer from './pages/TestDataLayer';

export default function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while initializing auth
  if (loading) {
    return <FullScreenSpinner />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route 
            path="/" 
            element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/inventory" 
            element={user ? <Inventory /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/customers" 
            element={user ? <Customers /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/test" 
            element={user ? <TestDataLayer /> : <Navigate to="/login" replace />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}