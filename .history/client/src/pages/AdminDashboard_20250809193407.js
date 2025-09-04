import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import './AdminDashboard.css';
import Tasks from './components/Tasks';

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'operator' });
  const [editingUser, setEditingUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (['operator', 'tekshiruvchi', 'yurist'].includes(current)) {
      fetchUsers(current);
    }
  }, [current]);

  const fetchUsers = async (role) => {
    if (!token) return;
    const res = await fetch(`http://localhost:5000/api/users?role=${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!token) return;
    if (editingUser) {
      // Update user API call
      await fetch(`http://localhost:5000/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      setEditingUser(null);
    } else {
      // Create new user API call
      await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
    }
    setForm({ username: '', password: '', role: current });
    fetchUsers(current);
  };

  const handleDelete = async id => {
    if (!token) return;
    await fetch(`http://localhost:5000/api/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(users.filter(u => u._id !== id));
  };

  const handleBalance = async (user, amount) => {
    if (!token) return;
    await fetch(`http://localhost:5000/api/users/${user._id}/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
    });
    fetchUsers(current);
  };

  // Edit tugmasi bosilganda formga user ma'lumotlarini yuklash
  const onEdit = user => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: '', // passwordni bo‘sh qoldiramiz, agar o'zgartirish kerak bo'lsa kiritilsin
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="admin-wrapper">
      <Sidebar current={current} setCurrent={setCurrent} onLogout={onLogout} />
      <div className="admin-main">
        {['operator', 'tekshiruvchi', 'yurist'].includes(current) && (
          <>
            <form onSubmit={handleSubmit} className="user-form">
              <h3>{editingUser ? '🔄 Foydalanuvchini tahrirlash' : '➕ Yangi foydalanuvchi qo‘shish'}</h3>
              <input name="username" placeholder="Login" value={form.username} onChange={handleChange} required />
              <input name="password" type="password" placeholder="Parol" value={form.password} onChange={handleChange} />
              <input name="firstName" placeholder="Ism" value={form.firstName || ''} onChange={handleChange} />
              <input name="lastName" placeholder="Familiya" value={form.lastName || ''} onChange={handleChange} />
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="operator">Operator</option>
                <option value="tekshiruvchi">Tekshiruvchi</option>
                <option value="yurist">Yurist</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">{editingUser ? 'Saqlash' : 'Qo‘shish'}</button>
              {editingUser && <button type="button" onClick={() => { setEditingUser(null); setForm({ username: '', password: '', role: current }); }}>Bekor qilish</button>}
            </form>
            <UserTable users={users} role={current} onEdit={onEdit} onDelete={handleDelete} onBalance={handleBalance} />
          </>
        )}

        {current === 'profil' && <h2>👤 Admin profilingiz bu yerda...</h2>}
        {current === 'ishlar' && token && <Tasks token={token} />}
      </div>
    </div>
  );
}

export default AdminDashboard;
