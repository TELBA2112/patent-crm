// Frontend API konfiguratsiyasi
// REACT_APP_API_URL -> masalan: http://localhost:5001
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const apiUrl = (path) => {
  // Ensure path starts with a slash if it's not a full URL
  if (path.startsWith('http')) return path;
  
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const pathWithSlash = path.startsWith('/') ? path : `/${path}`;
  
  return `${base}${pathWithSlash}`;
};

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  return res;
}
