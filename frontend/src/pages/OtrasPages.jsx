import React from 'react';
import { useState, useEffect } from 'react';
import { hitosAPI, proyectosAPI, auditoriaAPI, usuariosAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── HITOS ──
export function HitosPage() {
  const { usuario } = useAuth();
  const [hitos, setHitos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ nombre: '', descripcion: '', fecha_limite: '', proyecto_id: 1 });
  const [creando, setCreando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = async () => { try { const r = await hitosAPI.listar(); setHitos(r.hitos || []); } finally { setCargando(false); } };
  useEffect(() => { cargar(); }, []);

  const ESTADO_COLOR = { pendiente: '#B8860B', en_progreso: '#2D3E8C', completado: '#1A6B5A', vencido: '#C0392B' };
  const ESTADO_BG    = { pendiente: '#FEF3C7', en_progreso: '#EEF2FF',  completado: '#EDF7F4',  vencido: '#FEE2E2' };

  const puedeCrear = ['Dirección', 'Equipo de QA'].includes(usuario?.rol);

  const handleCrear = async e => {
    e.preventDefault(); setCreando(true);
    try { await hitosAPI.crear(form); setMostrarForm(false); setForm({ nombre: '', descripcion: '', fecha_limite: '', proyecto_id: 1 }); await cargar(); }
    catch (err) { alert(err.error || 'Error al crear hito'); }
    finally { setCreando(false); }
  };

  const handleEstado = async (id, estado) => {
    try { await hitosAPI.actualizar(id, { estado }); await cargar(); }
    catch (err) { alert(err.error || 'Error'); }
  };

  if (cargando) return <div style={{ color: '#5A6A74', padding: 20 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1C1C1C' }}>📅 Hitos</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A6A74' }}>RF03 — Control de vencimientos y alertas automáticas</p>
        </div>
        {puedeCrear && <button onClick={() => setMostrarForm(!mostrarForm)} style={{ padding: '10px 20px', background: '#1A6B5A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Nuevo Hito</button>}
      </div>

      {mostrarForm && (
        <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleCrear} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nombre *</label>
              <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Fecha Límite *</label>
              <input type="datetime-local" value={form.fecha_limite} onChange={e => setForm(p => ({ ...p, fecha_limite: e.target.value }))} required style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Descripción</label>
              <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', gap: 8 }}>
              <button type="submit" disabled={creando} style={{ padding: '10px 24px', background: '#1A6B5A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {creando ? 'Creando...' : 'Crear Hito'}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} style={{ padding: '10px 20px', background: '#F5F6F7', color: '#5A6A74', border: '1px solid #D8DDE0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hitos.length === 0 ? <div style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>No hay hitos cargados.</div> :
          hitos.map(h => {
            const fecha = new Date(h.fecha_limite);
            const urgente = fecha - new Date() < 48 * 60 * 60 * 1000 && fecha > new Date();
            return (
              <div key={h.id} style={{ background: '#fff', border: `1px solid ${urgente ? '#F59E0B' : '#E8ECEE'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: 24 }}>{urgente ? '🔴' : '📅'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>{h.nombre}</div>
                  {h.descripcion && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{h.descripcion}</div>}
                  <div style={{ fontSize: 12, color: '#5A6A74', marginTop: 4 }}>
                    Vence: {fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {urgente && <span style={{ marginLeft: 8, background: '#C0392B', color: '#fff', padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>URGENTE · Alerta RF03 activa</span>}
                  </div>
                </div>
                <span style={{ background: ESTADO_BG[h.estado], color: ESTADO_COLOR[h.estado], padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                  {h.estado.replace('_', ' ')}
                </span>
                {puedeCrear && h.estado !== 'completado' && (
                  <button onClick={() => handleEstado(h.id, 'completado')}
                    style={{ padding: '6px 14px', background: '#EDF7F4', color: '#1A6B5A', border: '1px solid #1A6B5A', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Completar
                  </button>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ── PROYECTOS ──
export function ProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => { proyectosAPI.listar().then(r => setProyectos(r.proyectos || [])).finally(() => setCargando(false)); }, []);
  const COLOR = { activo: '#1A6B5A', pausado: '#B8860B', cerrado: '#5A6A74' };
  if (cargando) return <div style={{ color: '#5A6A74', padding: 20 }}>Cargando...</div>;
  return (
    <div>
      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1C1C1C' }}>📁 Proyectos</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#5A6A74' }}>Proyectos activos en EliteCorp Consulting Group</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {proyectos.map(p => (
          <div key={p.id} style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1C1C1C' }}>{p.nombre}</h3>
              <span style={{ background: COLOR[p.estado] + '20', color: COLOR[p.estado], padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{p.estado}</span>
            </div>
            {p.descripcion && <p style={{ margin: '0 0 10px', fontSize: 12, color: '#5A6A74', lineHeight: 1.5 }}>{p.descripcion}</p>}
            {p.cliente && <div style={{ fontSize: 11, color: '#9CA3AF' }}>👤 {p.cliente}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AUDITORÍA ──
export function AuditoriaPage() {
  const [data, setData] = useState({ registros: [], total: 0, total_paginas: 1 });
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    Promise.all([auditoriaAPI.listar({ page: pagina, limit: 20 }), auditoriaAPI.resumen()])
      .then(([d, r]) => { setData(d); setResumen(r); })
      .finally(() => setCargando(false));
  }, [pagina]);

  const COL = { exitoso: '#1A6B5A', fallido: '#C0392B' };
  const MOD_ICON = { AUTH: '🔐', EVIDENCIAS: '📄', HITOS: '📅', AUDITORIA: '🔒', PROYECTOS: '📁', NOTIFICACIONES: '📧', SISTEMA: '⚙️' };

  if (cargando) return <div style={{ color: '#5A6A74', padding: 20 }}>Cargando...</div>;

  return (
    <div>
      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1C1C1C' }}>🔒 Auditoría</h1>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#5A6A74' }}>RF04 — Historial inmutable de todas las acciones del sistema</p>

      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { v: resumen.total,    l: 'Total Registros',  c: '#1A6B5A' },
            { v: resumen.exitosos, l: 'Exitosos',          c: '#1A6B5A' },
            { v: resumen.fallidos, l: 'Fallidos',          c: '#C0392B' },
            { v: resumen.hoy,      l: 'Hoy',              c: '#2D3E8C' },
          ].map(s => (
            <div key={s.l} style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 10, padding: '16px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 12, color: '#5A6A74', marginTop: 4, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8ECEE', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1C1C1C' }}>Registros</span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>Total: {data.total} · Pág. {pagina}/{data.total_paginas}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#F5F6F7' }}>
              {['Módulo', 'Acción', 'Usuario', 'Rol', 'Resultado', 'Fecha/Hora'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#5A6A74', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.registros.map((r, i) => (
              <tr key={r.id} style={{ borderTop: '1px solid #E8ECEE', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '10px 14px' }}>{MOD_ICON[r.modulo] || '📋'} {r.modulo}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#36454F', fontSize: 11 }}>{r.accion}</td>
                <td style={{ padding: '10px 14px', color: '#5A6A74' }}>{r.usuario_email || '—'}</td>
                <td style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: 11 }}>{r.usuario_rol || '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ background: COL[r.resultado] + '15', color: COL[r.resultado], padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{r.resultado}</span>
                </td>
                <td style={{ padding: '10px 14px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                  {new Date(r.createdAt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.total_paginas > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #E8ECEE', display: 'flex', gap: 8 }}>
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} style={{ padding: '6px 14px', background: '#F5F6F7', border: '1px solid #D8DDE0', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>← Anterior</button>
            <button onClick={() => setPagina(p => Math.min(data.total_paginas, p + 1))} disabled={pagina === data.total_paginas} style={{ padding: '6px 14px', background: '#F5F6F7', border: '1px solid #D8DDE0', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Siguiente →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── USUARIOS ──
export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => { usuariosAPI.listar().then(r => setUsuarios(r.usuarios || [])).finally(() => setCargando(false)); }, []);
  const BADGE_C = { 'Consultor Interno': '#1A6B5A', 'Equipo de QA': '#2D3E8C', 'Dirección': '#1C1C1C', 'Cliente Externo': '#0369A1' };
  if (cargando) return <div style={{ color: '#5A6A74', padding: 20 }}>Cargando...</div>;
  return (
    <div>
      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1C1C1C' }}>👥 Usuarios</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#5A6A74' }}>Gestión de accesos y roles RBAC (RF01)</p>
      <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F5F6F7' }}>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Alta'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#5A6A74', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id} style={{ borderTop: '1px solid #E8ECEE', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1C1C1C' }}>{u.nombre}</td>
                <td style={{ padding: '12px 16px', color: '#5A6A74' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: (BADGE_C[u.rol] || '#555') + '15', color: BADGE_C[u.rol] || '#555', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{u.rol}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: u.activo ? '#EDF7F4' : '#FEE2E2', color: u.activo ? '#1A6B5A' : '#C0392B', padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

