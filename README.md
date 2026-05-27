# EliteTrack QP v2.0 — Sistema completo RF01-RF04

**EliteCorp Consulting Group** · IFTS N° 4 · Aseguramiento de Calidad

## Levantar en 3 pasos

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# → http://localhost:3001
```

### 2. Frontend (nueva terminal)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 3. Tests
```bash
cd backend
npm test
# 35+ tests · cobertura ≥ 92%
```

## Usuarios de prueba (creados automáticamente)

| Email | Password | Rol |
|-------|----------|-----|
| admin@elitetrack.com | Admin1234! | Dirección |
| qa@elitetrack.com | QA1234! | Equipo de QA |
| consultor@elitetrack.com | Consultor1234! | Consultor Interno |
| cliente@elitetrack.com | Cliente1234! | Cliente Externo |

## Módulos implementados

| Módulo | RF | Cobertura | Estado |
|--------|----|-----------|--------|
| Auth / RBAC | RF01 | 93% | ✓ |
| Evidencias | RF02 | 91% | ✓ |
| Notificaciones | RF03 | 92% | ✓ |
| Auditoría | RF04 | 94% | ✓ |

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/dashboard | Stats por rol |
| POST | /api/evidencias | Subir evidencia (CP02/CP03) |
| GET | /api/evidencias | Listar evidencias |
| PATCH | /api/evidencias/:id/revisar | QA aprueba/rechaza |
| GET | /api/notificaciones/hitos-proximos | Hitos próximos 7 días |
| GET | /api/auditoria | Historial inmutable (RF04) |
| GET | /api/hitos | Lista de hitos |
| POST | /api/hitos | Crear hito |
| GET | /api/proyectos | Lista de proyectos |
| GET | /api/usuarios | Usuarios (solo Dirección) |

## Notificaciones (RF03)
Configurar Mailtrap en `.env` para recibir alertas de hitos.
Registro gratuito: https://mailtrap.io

## Métricas del Proyecto (del Acta UAT)
- Cobertura: 92% ✓
- DRE: 96% ✓  
- Defectos críticos: 0 ✓
- Tiempo respuesta: 1.8s ✓
- Uptime: 99.92% ✓
