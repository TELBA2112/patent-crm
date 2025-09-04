import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import Tasks from './components/Tasks';
import AdminJobDetails from './AdminJobDetails';
import './AdminDashboard.css';

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [jobForm, setJobForm] = useState({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '' });
  const token = localStorage.getItem('token');

  const fetchUsers = useCallback(async (role) => {
    if (!token) return;
    const res = await fetch(`http://localhost:5000/api/users?role=${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
  }, [token]);

  useEffect(() => {
    if (['operator', 'tekshiruvchi', 'yurist'].includes(current)) {
      fetchUsers(current);
    }
  }, [current, fetchUsers]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleJobChange = e => {
    setJobForm({ ...jobForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingUser ? `http://localhost:5000/api/users/${editingUser._id}` : 'http://localhost:5000/api/users';
    const method = editingUser ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Foydalanuvchi bilan ishlashda xatolik');
      await fetchUsers(current); // Ro'yxatni yangilash
      setForm({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
      setEditingUser(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const onEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      password: '', // Parolni o'zgartirish uchun bo'sh qoldiramiz
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Foydalanuvchini o‘chirishga ishonchingiz komilmi?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Foydalanuvchini o‘chirishda xatolik');
      await fetchUsers(current);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBalance = async (id, amount) => {
    const newAmount = prompt("Yangi balans miqdorini kiriting:", amount);
    if (newAmount === null || isNaN(newAmount)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(newAmount) }),
      });
      if (!res.ok) throw new Error('Balansni yangilashda xatolik');
      await fetchUsers(current);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...jobForm, status: 'yangi' }),
      });
      if (!res.ok) throw new Error('Yangi ish yaratishda xatolik');
      alert('Yangi ish muvaffaqiyatli yaratildi!');
      setJobForm({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '' });
      // Ishlar ro'yxatini yangilash (agar u ko'rsatilayotgan bo'lsa)
      if (current === 'ishlar') {
        // Bu yerda Tasks komponentini yangilash mantiqi bo'lishi kerak.
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="operator-admin-wrapper">
      <Sidebar current={current} setCurrent={setCurrent} />
      <div className="operator-admin-main">
        {['operator', 'tekshiruvchi', 'yurist'].includes(current) && (
          <>
            <h2>{current.charAt(0).toUpperCase() + current.slice(1)}lar</h2>
            <form onSubmit={handleSubmit} className="user-form">
              <h3>{editingUser ? 'Foydalanuvchini tahrirlash' : '➕ Yangi foydalanuvchi yaratish'}</h3>
              <input name="username" placeholder="Login" value={form.username} onChange={handleChange} required />
              <input name="password" placeholder="Parol" type="password" value={form.password} onChange={handleChange} required={!editingUser} />
              <input name="firstName" placeholder="Ism" value={form.firstName} onChange={handleChange} />
              <input name="lastName" placeholder="Familiya" value={form.lastName} onChange={handleChange} />
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="operator">Operator</option>
                <option value="tekshiruvchi">Tekshiruvchi</option>
                <option value="yurist">Yurist</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">{editingUser ? 'Saqlash' : 'Yaratish'}</button>
              {editingUser && <button type="button" onClick={() => setEditingUser(null)}>Bekor qilish</button>}
            </form>
            <UserTable users={users} role={current} onEdit={onEdit} onDelete={handleDelete} onBalance={handleBalance} />
          </>
        )}

        {current === 'profil' && <h2>👤 Admin profilingiz bu yerda...</h2>}
        
        {current === 'ishlar' && token && (
          <>
            <Tasks token={token} />
            {/* AdminJobDetails komponenti faqat bitta ishni ko'rish sahifasida bo'lishi kerak.
            Hozircha uni bu yerdan olib tashladim. */}
            
            {/* Yangi: Yangi ish yaratish form */}
            <form onSubmit={handleSubmitJob} className="user-form">
              <h3>➕ Yangi ish yaratish</h3>
              <input name="clientName" placeholder="Ism" value={jobForm.clientName} onChange={handleJobChange} required />
              <input name="clientSurname" placeholder="Familiya" value={jobForm.clientSurname} onChange={handleJobChange} required />
              <input name="phone" placeholder="Telefon" value={jobForm.phone} onChange={handleJobChange} required />
              <input name="brandName" placeholder="Brend nomi" value={jobForm.brandName} onChange={handleJobChange} required />
              <select name="personType" value={jobForm.personType} onChange={handleJobChange}>
                <option value="">Shaxs turi</option>
                <option value="yuridik">Yuridik</option>
                <option value="jismoniy">Jismoniy</option>
              </select>
              <button type="submit">Yaratish</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;