import React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => { try { return JSON.parse(localStorage.getItem('elitetrack_user')); } catch { return null; } });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setCargando(true); setError(null);
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem('elitetrack_token', data.token);
      localStorage.setItem('elitetrack_user', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
      return { ok: true };
    } catch (err) {
      const msg = err.detalle || err.error || 'Error al iniciar sesión.';
      setError(msg);
      return { ok: false, status: err.status, error: msg };
    } finally { setCargando(false); }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem('elitetrack_token');
    localStorage.removeItem('elitetrack_user');
    setUsuario(null); setError(null);
  }, []);

  const PERMISOS = {
    'Consultor Interno': ['evidencias:leer', 'evidencias:subir', 'hitos:leer', 'proyectos:leer'],
    'Equipo de QA':      ['evidencias:leer', 'evidencias:revisar', 'hitos:leer', 'proyectos:leer', 'reportes:leer', 'auditoria:leer'],
    'Dirección':         ['evidencias:leer', 'hitos:leer', 'hitos:aprobar', 'proyectos:leer', 'proyectos:aprobar', 'reportes:leer', 'admin:leer', 'auditoria:leer'],
    'Cliente Externo':   ['proyectos:leer', 'hitos:leer'],
  };

  const tienePermiso = useCallback((p) => (PERMISOS[usuario?.rol] || []).includes(p), [usuario]);

  return (
    <AuthContext.Provider value={{ usuario, cargando, error, login, logout, tienePermiso }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fuera de AuthProvider');
  return ctx;
};

