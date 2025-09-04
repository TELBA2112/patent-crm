import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import TekshiruvchiDashboard from './pages/TekshiruvchiDashboard';
import YuristDashboard from './pages/YuristDashboard';

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async () => {
    const token = localStorage.getItem('token');
    if (!token) return setLoading(false);

    try {
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Token yaroqsiz yoki serverdan xatolik');

      const data = await res.json();
      setRole(data.role);
    } catch (err) {
      localStorage.removeItem('token');
      console.error('Token xato:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  const handleLogin = (userRole) => {
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setRole(null);
  };

  const renderDashboard = () => {
    const commonProps = { onLogout: handleLogout };
    switch (role) {
      case 'admin':
        return <AdminDashboard {...commonProps} />;
      case 'operator':
        return <OperatorDashboard {...commonProps} />;
      case 'tekshiruvchi':
        return <TekshiruvchiDashboard {...commonProps} />;
      case 'yurist':
        return <YuristDashboard {...commonProps} />;
      default:
        return <h1>Notanish rol</h1>;
    }
  };

  if (loading) return <div>Yuklanmoqda...</div>;

  return (
    <div>
      {!role ? <Login onLogin={handleLogin} /> : renderDashboard()}
    </div>
  );
}

export default App;
