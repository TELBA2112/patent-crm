// API bazaviy URL
// .env ichida REACT_APP_API_BASE bo'lsa, o'sha ishlatiladi, aks holda localhost:5000
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Yordamchi fetch (ixtiyoriy foydalanish)
export const apiFetch = (path, options = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, options);
};
