import React from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export function ProtectedRoute({ children, permiso, roles }) {
  const { usuario, tienePermiso } = useAuth();
  const location = useLocation();
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  if (permiso && !tienePermiso(permiso)) return <Navigate to="/acceso-denegado" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/acceso-denegado" replace />;
  return children;
}

const BADGE = {
  'Consultor Interno': { bg: '#EDF7F4', color: '#1A6B5A' },
  'Equipo de QA':      { bg: '#EEF2FF', color: '#2D3E8C' },
  'Dirección':         { bg: '#F3F4F6', color: '#1C1C1C' },
  'Cliente Externo':   { bg: '#F0F9FF', color: '#0369A1' },
};

const NAV = {
  'Consultor Interno': [
    { path: '/dashboard',   icon: '📊', label: 'Dashboard' },
    { path: '/evidencias',  icon: '📤', label: 'Mis Evidencias' },
    { path: '/hitos',       icon: '📅', label: 'Hitos' },
  ],
  'Equipo de QA': [
    { path: '/dashboard',   icon: '📊', label: 'Dashboard' },
    { path: '/evidencias',  icon: '🔍', label: 'Revisar Evidencias' },
    { path: '/hitos',       icon: '📅', label: 'Hitos' },
    { path: '/auditoria',   icon: '🔒', label: 'Auditoría' },
  ],
  'Dirección': [
    { path: '/dashboard',   icon: '📊', label: 'Dashboard' },
    { path: '/proyectos',   icon: '📁', label: 'Proyectos' },
    { path: '/evidencias',  icon: '📄', label: 'Evidencias' },
    { path: '/hitos',       icon: '📅', label: 'Hitos' },
    { path: '/auditoria',   icon: '🔒', label: 'Auditoría' },
    { path: '/usuarios',    icon: '👥', label: 'Usuarios' },
  ],
  'Cliente Externo': [
    { path: '/dashboard',   icon: '📊', label: 'Dashboard' },
    { path: '/proyectos',   icon: '📁', label: 'Proyectos' },
    { path: '/hitos',       icon: '📅', label: 'Hitos' },
  ],
};

export function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [colapsado, setColapsado] = useState(false);

  const badge = BADGE[usuario?.rol] || { bg: '#F3F4F6', color: '#1C1C1C' };
  const menu  = NAV[usuario?.rol] || [];

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif", background: '#F5F6F7' }}>
      {/* Sidebar */}
      <aside style={{ width: colapsado ? 64 : 220, background: '#1C1C1C', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: colapsado ? '20px 0' : '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #333', justifyContent: colapsado ? 'center' : 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1A6B5A', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>ET</div>
          {!colapsado && <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>EliteTrack QP</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {menu.map(item => {
            const activo = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: colapsado ? '10px 0' : '10px 16px', justifyContent: colapsado ? 'center' : 'flex-start', textDecoration: 'none', background: activo ? 'rgba(45,154,127,0.15)' : 'none', borderLeft: activo ? '3px solid #2D9A7F' : '3px solid transparent', color: activo ? '#2D9A7F' : '#9EAFB8', fontSize: 13, fontWeight: activo ? 700 : 400, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {!colapsado && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: colapsado ? '12px 0' : '12px 16px', borderTop: '1px solid #333' }}>
          {!colapsado && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{usuario?.nombre}</div>
              <div style={{ ...badge, display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, marginTop: 4 }}>{usuario?.rol}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: '1px solid #333', color: '#9EAFB8', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: colapsado ? 'center' : 'flex-start', gap: 6 }}>
            🚪{!colapsado && ' Salir'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {children}
      </main>
    </div>
  );
}

