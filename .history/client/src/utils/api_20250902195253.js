// API bazaviy manzili (ENV orqali moslashadi)
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Ixtiyoriy: umumiy fetch helper (hozircha ishlatilmaydi)
export const apiFetch = (path, options = {}) => fetch(`${API_BASE}${path}`, options);
