import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EvidenciasPage from './pages/EvidenciasPage';
import { HitosPage, ProyectosPage, AuditoriaPage, UsuariosPage } from './pages/OtrasPages';

function AccesoDenegado() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#F5F6F7' }}>
      <div style={{ textAlign: 'center', background: '#fff', padding: '48px 40px', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 48 }}>🚫</div>
        <h1 style={{ fontSize: 28, marginTop: 12, color: '#1C1C1C' }}>Acceso Denegado</h1>
        <p style={{ color: '#5A6A74', marginBottom: 24 }}>Tu rol no tiene permisos para acceder a esta sección.</p>
        <a href="/dashboard" style={{ color: '#1A6B5A', fontWeight: 700, textDecoration: 'none' }}>← Volver al Dashboard</a>
      </div>
    </div>
  );
}

function WrappedRoute({ page: Page, permiso, roles }) {
  return (
    <ProtectedRoute permiso={permiso} roles={roles}>
      <Layout><Page /></Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/acceso-denegado" element={<AccesoDenegado />} />
          <Route path="/dashboard"       element={<WrappedRoute page={DashboardPage} />} />
          <Route path="/evidencias"      element={<WrappedRoute page={EvidenciasPage} permiso="evidencias:leer" />} />
          <Route path="/hitos"           element={<WrappedRoute page={HitosPage} permiso="hitos:leer" />} />
          <Route path="/proyectos"       element={<WrappedRoute page={ProyectosPage} permiso="proyectos:leer" />} />
          <Route path="/auditoria"       element={<WrappedRoute page={AuditoriaPage} permiso="auditoria:leer" />} />
          <Route path="/usuarios"        element={<WrappedRoute page={UsuariosPage} roles={['Dirección']} />} />
          <Route path="/"                element={<Navigate to="/dashboard" replace />} />
          <Route path="*"                element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

