import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { evidenciasAPI, hitosAPI } from '../services/api';

const ESTADO_COLOR = { pendiente: '#B8860B', aprobada: '#1A6B5A', rechazada: '#C0392B' };
const ESTADO_BG    = { pendiente: '#FEF3C7', aprobada: '#EDF7F4',  rechazada: '#FEE2E2' };

export default function EvidenciasPage() {
  const { usuario, tienePermiso } = useAuth();
  const [evidencias, setEvidencias] = useState([]);
  const [hitos, setHitos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [form, setForm] = useState({ hito_id: '', archivo: null });
  const [revisando, setRevisando] = useState(null);
  const fileRef = useRef();

  const cargar = async () => {
    try {
      const [ev, hi] = await Promise.all([evidenciasAPI.listar(), hitosAPI.listar()]);
      setEvidencias(ev.evidencias || []);
      setHitos(hi.hitos || []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleSubir = async e => {
    e.preventDefault();
    if (!form.archivo || !form.hito_id) return setError('Seleccioná un hito y un archivo.');
    setSubiendo(true); setError(null); setExito(null);
    try {
      const fd = new FormData();
      fd.append('hito_id', form.hito_id);
      fd.append('archivo', form.archivo);
      await evidenciasAPI.subir(fd);
      setExito('Evidencia cargada correctamente ✓');
      setForm({ hito_id: '', archivo: null });
      if (fileRef.current) fileRef.current.value = '';
      await cargar();
    } catch (err) {
      setError(err.detalle || err.error || 'Error al subir el archivo.');
    } finally { setSubiendo(false); }
  };

  const handleRevisar = async (id, estado) => {
    const comentario = estado === 'rechazada' ? prompt('Motivo del rechazo:') : '';
    if (estado === 'rechazada' && !comentario) return;
    try {
      await evidenciasAPI.revisar(id, { estado, comentario });
      setExito(`Evidencia ${estado} correctamente.`);
      await cargar();
    } catch (err) { setError(err.error || 'Error al revisar.'); }
    setRevisando(null);
  };

  const formatBytes = b => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  if (cargando) return <div style={{ color: '#5A6A74', padding: 20 }}>Cargando...</div>;

  const puedeSubir   = tienePermiso('evidencias:subir');
  const puedeRevisar = tienePermiso('evidencias:revisar');

  return (
    <div>
      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#1C1C1C' }}>📄 Evidencias</h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#5A6A74' }}>RF02 — Carga y validación de archivos (máx. 20 MB)</p>

      {/* Formulario de carga — solo Consultor */}
      {puedeSubir && (
        <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, padding: '24px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1C1C1C' }}>📤 Subir nueva evidencia</h3>
          <form onSubmit={handleSubir} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#36454F', display: 'block', marginBottom: 5 }}>Hito *</label>
                <select value={form.hito_id} onChange={e => setForm(p => ({ ...p, hito_id: e.target.value }))} required
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 13 }}>
                  <option value="">Seleccioná un hito...</option>
                  {hitos.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#36454F', display: 'block', marginBottom: 5 }}>Archivo * (máx. 20 MB)</label>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.txt"
                  onChange={e => setForm(p => ({ ...p, archivo: e.target.files[0] }))}
                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #D8DDE0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>

            {error  && <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #C0392B', borderRadius: 8, color: '#7F1D1D', fontSize: 13 }}>⚠ {error}</div>}
            {exito  && <div style={{ padding: '10px 14px', background: '#EDF7F4', border: '1px solid #1A6B5A', borderRadius: 8, color: '#1A6B5A', fontSize: 13 }}>✓ {exito}</div>}

            <button type="submit" disabled={subiendo}
              style={{ alignSelf: 'flex-start', padding: '10px 24px', background: '#1A6B5A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: subiendo ? 0.7 : 1 }}>
              {subiendo ? 'Subiendo...' : 'Cargar Evidencia'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de evidencias */}
      <div style={{ background: '#fff', border: '1px solid #E8ECEE', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8ECEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1C1C1C' }}>Historial de Evidencias</h3>
          <span style={{ fontSize: 12, color: '#5A6A74' }}>{evidencias.length} registros</span>
        </div>

        {evidencias.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No hay evidencias cargadas aún.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F5F6F7' }}>
                {['Archivo', 'Hito', 'Tamaño', 'Estado', 'Fecha', puedeRevisar && 'Acciones'].filter(Boolean).map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#5A6A74', fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evidencias.map((ev, i) => (
                <tr key={ev.id} style={{ borderTop: '1px solid #E8ECEE', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1C1C1C' }}>{ev.nombre_archivo}</td>
                  <td style={{ padding: '12px 16px', color: '#5A6A74' }}>Hito #{ev.hito_id}</td>
                  <td style={{ padding: '12px 16px', color: '#5A6A74' }}>{formatBytes(ev.tamanio_bytes)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: ESTADO_BG[ev.estado], color: ESTADO_COLOR[ev.estado], padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                      {ev.estado.charAt(0).toUpperCase() + ev.estado.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 12 }}>{new Date(ev.createdAt).toLocaleDateString('es-AR')}</td>
                  {puedeRevisar && (
                    <td style={{ padding: '12px 16px' }}>
                      {ev.estado === 'pendiente' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleRevisar(ev.id, 'aprobada')}
                            style={{ padding: '4px 12px', background: '#EDF7F4', color: '#1A6B5A', border: '1px solid #1A6B5A', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Aprobar
                          </button>
                          <button onClick={() => handleRevisar(ev.id, 'rechazada')}
                            style={{ padding: '4px 12px', background: '#FEE2E2', color: '#C0392B', border: '1px solid #C0392B', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

