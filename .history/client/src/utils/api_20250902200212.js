// Frontend API konfiguratsiyasi
// REACT_APP_API_URL -> masalan: http://localhost:5001
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiUrl = (path) => `${API_BASE}${path}`;

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  return res;
}
