import React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, cargando, error } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const destino   = location.state?.from?.pathname || '/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState(null);

  const onChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    const r = await login(form.email, form.password);
    if (r.ok) navigate(destino, { replace: true });
    else setStatus(r.status);
  };

  const bloqueado = status === 423;

  const usuarios = [
    { email: 'admin@elitetrack.com',     pass: 'Admin1234!',     rol: 'Dirección' },
    { email: 'qa@elitetrack.com',         pass: 'QA1234!',        rol: 'QA' },
    { email: 'consultor@elitetrack.com',  pass: 'Consultor1234!', rol: 'Consultor' },
    { email: 'cliente@elitetrack.com',    pass: 'Cliente1234!',   rol: 'Cliente' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F5F6F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', sans-serif", gap: 24, flexWrap: 'wrap', padding: 24 }}>

      {/* Card login */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '40px 36px', width: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#1A6B5A', color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>ET</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1C1C1C' }}>EliteTrack QP</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A6A74' }}>Sistema de Gestión de Calidad — EliteCorp</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#36454F', display: 'block', marginBottom: 5 }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required disabled={cargando}
              placeholder="tu@elitetrack.com"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#36454F', display: 'block', marginBottom: 5 }}>Contraseña</label>
            <input name="password" type="password" value={form.password} onChange={onChange} required disabled={cargando}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>

          {error && (
            <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid', background: bloqueado ? '#FEF3C7' : '#FEE2E2', borderColor: bloqueado ? '#B8860B' : '#C0392B', color: bloqueado ? '#92400E' : '#7F1D1D', fontSize: 13 }}>
              <strong>{bloqueado ? '🔒 Cuenta bloqueada' : '⚠ Error'}</strong><br />{error}
            </div>
          )}

          <button type="submit" disabled={cargando}
            style={{ padding: '12px', background: '#1A6B5A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: cargando ? 0.7 : 1 }}>
            {cargando ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#9CA3AF' }}>IFTS N° 4 · Aseguramiento de Calidad · 2026</p>
      </div>

      {/* Usuarios de prueba */}
      <div style={{ background: '#1C1C1C', borderRadius: 14, padding: '28px 24px', width: 300, boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#9EAFB8', letterSpacing: '0.08em' }}>USUARIOS DE PRUEBA</p>
        {usuarios.map(u => (
          <div key={u.email}
            onClick={() => setForm({ email: u.email, password: u.pass })}
            style={{ background: '#252525', border: '1px solid #333', borderRadius: 8, padding: '10px 14px', marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2D9A7F'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{u.rol}</div>
            <div style={{ color: '#9EAFB8', fontSize: 11, marginTop: 2 }}>{u.email}</div>
          </div>
        ))}
        <p style={{ marginTop: 12, fontSize: 11, color: '#4B5568' }}>Hacé click en un rol para autocompletar.</p>
      </div>
    </div>
  );
}

