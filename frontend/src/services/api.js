const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('elitetrack_token');

const apiFetch = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('elitetrack_token');
    localStorage.removeItem('elitetrack_user');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
};

export const authAPI = {
  login:  (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me:     ()               => apiFetch('/auth/me'),
  logout: ()               => apiFetch('/auth/logout', { method: 'POST' }),
};

export const dashboardAPI = {
  stats: () => apiFetch('/dashboard'),
};

export const evidenciasAPI = {
  listar:  (params = {}) => apiFetch(`/evidencias?${new URLSearchParams(params)}`),
  subir:   (formData)    => apiFetch('/evidencias', { method: 'POST', body: formData }),
  revisar: (id, data)    => apiFetch(`/evidencias/${id}/revisar`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const notificacionesAPI = {
  hitosProximos: () => apiFetch('/notificaciones/hitos-proximos'),
};

export const auditoriaAPI = {
  listar:  (params = {}) => apiFetch(`/auditoria?${new URLSearchParams(params)}`),
  resumen: ()            => apiFetch('/auditoria/resumen'),
};

export const proyectosAPI = {
  listar: () => apiFetch('/proyectos'),
  crear:  (data) => apiFetch('/proyectos', { method: 'POST', body: JSON.stringify(data) }),
};

export const hitosAPI = {
  listar:     (params = {}) => apiFetch(`/hitos?${new URLSearchParams(params)}`),
  crear:      (data)        => apiFetch('/hitos', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id, data)    => apiFetch(`/hitos/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const usuariosAPI = {
  listar: () => apiFetch('/usuarios'),
};
