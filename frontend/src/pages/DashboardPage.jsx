import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, notificacionesAPI } from '../services/api';

const StatCard = ({ valor, label, icon, color = '#1A6B5A', sub }) => (
  <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{valor ?? '—'}</div>
        <div style={{ fontSize: 13, color: '#5A6A74', marginTop: 6, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{sub}</div>}
      </div>
      <span style={{ fontSize: 28 }}>{icon}</span>
    </div>
  </div>
);

const HitoCard = ({ hito }) => {
  const fecha = new Date(hito.fecha_limite).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: hito.urgente ? '#FEF3C7' : '#fff', border: `1px solid ${hito.urgente ? '#F59E0B' : '#E8ECEE'}`, borderRadius: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{hito.urgente ? '🔴' : '🟡'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1C1C1C' }}>{hito.nombre}</div>
        <div style={{ fontSize: 11, color: '#5A6A74', marginTop: 2 }}>Vence: {fecha} · {hito.estado}</div>
      </div>
      {hito.urgente && <span style={{ background: '#C0392B', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>URGENTE</span>}
    </div>
  );
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [hitos, setHitos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [s, h] = await Promise.all([dashboardAPI.stats(), notificacionesAPI.hitosProximos()]);
        setStats(s);
        setHitos(h.hitos || []);
      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  if (cargando) return <div style={{ color: '#5A6A74', padding: 40 }}>Cargando...</div>;

  const BADGE = { 'Consultor Interno': { bg: '#EDF7F4', color: '#1A6B5A' }, 'Equipo de QA': { bg: '#EEF2FF', color: '#2D3E8C' }, 'Dirección': { bg: '#F3F4F6', color: '#1C1C1C' }, 'Cliente Externo': { bg: '#F0F9FF', color: '#0369A1' } };
  const badge = BADGE[usuario?.rol] || { bg: '#F3F4F6', color: '#1C1C1C' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1C1C1C' }}>Bienvenido, {usuario?.nombre} 👋</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5A6A74' }}>EliteTrack QP — Panel de Control</p>
        </div>
        <div style={{ ...badge, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{usuario?.rol}</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard valor={stats?.proyectos_activos} label="Proyectos Activos" icon="📁" />
        <StatCard valor={stats?.evidencias_pendientes} label="Evidencias Pendientes" icon="📄" color="#B8860B" />
        <StatCard valor={stats?.hitos_proximos} label="Hitos en 48hs" icon="⏰" color={stats?.hitos_proximos > 0 ? '#C0392B' : '#1A6B5A'} />

        {usuario?.rol === 'Consultor Interno' && <>
          <StatCard valor={stats?.mis_evidencias} label="Mis Evidencias" icon="📤" />
          <StatCard valor={stats?.mis_aprobadas}  label="Aprobadas" icon="✅" />
        </>}

        {usuario?.rol === 'Equipo de QA' && <>
          <StatCard valor={stats?.evidencias_hoy}  label="Evidencias Hoy" icon="📥" />
          <StatCard valor={stats?.auditoria_hoy}   label="Eventos de Auditoría Hoy" icon="🔒" />
        </>}

        {usuario?.rol === 'Dirección' && <>
          <StatCard valor={stats?.total_usuarios}   label="Usuarios Activos" icon="👥" />
          <StatCard valor={stats?.total_evidencias} label="Total Evidencias" icon="📂" />
          <StatCard valor={stats?.total_auditoria}  label="Registros de Auditoría" icon="🔒" />
          <StatCard valor={stats?.fallos_hoy}       label="Intentos Fallidos Hoy" icon="⚠️" color={stats?.fallos_hoy > 0 ? '#C0392B' : '#1A6B5A'} />
        </>}
      </div>

      {/* Métricas del proyecto (del PDF) */}
      <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1C1C1C' }}>📊 Métricas del Proyecto EliteTrack QP</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Cobertura Pruebas', valor: '92%',    objetivo: '≥90%',  ok: true },
            { label: 'DRE (Eficiencia)',  valor: '96%',    objetivo: '≥95%',  ok: true },
            { label: 'Defectos Críticos', valor: '0',      objetivo: '= 0',   ok: true },
            { label: 'Tiempo Respuesta',  valor: '1.8 seg',objetivo: '≤2 seg',ok: true },
            { label: 'Uptime',            valor: '99.92%', objetivo: '99.9%', ok: true },
          ].map(m => (
            <div key={m.label} style={{ background: '#F5F6F7', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: m.ok ? '#1A6B5A' : '#C0392B' }}>{m.valor}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#36454F', marginTop: 3 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Objetivo: {m.objetivo} {m.ok ? '✓' : '✗'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hitos próximos */}
      {hitos.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1C1C1C' }}>⏰ Hitos Próximos (7 días)</h3>
          {hitos.map(h => <HitoCard key={h.id} hito={h} />)}
        </div>
      )}

      {/* Info sesión */}
      <div style={{ marginTop: 20, padding: '10px 16px', background: '#fff', borderRadius: 8, border: '1px solid #E8ECEE', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF' }}>
        <span>⏱ Sesión JWT · expira en 15 min de inactividad (RNF02)</span>
        <span>{usuario?.email}</span>
      </div>
    </div>
  );
}

