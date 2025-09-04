import React, { useState } from 'react';
import './Login.css';
import { apiFetch } from '../utils/api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Tizimga kirildi!');
        localStorage.setItem('token', data.token);
        onLogin(data.role);
      } else {
        alert(data.message || 'Login muvaffaqiyatsiz');
      }
    } catch (error) {
      alert('Server bilan bog‘lanishda xatolik yuz berdi');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Tizimga kirish</h2>
        <input
          type="text"
          placeholder="Login"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Parol"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Kutilmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}

export default Login;
