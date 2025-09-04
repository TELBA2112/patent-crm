import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import Tasks from './components/Tasks'; // Yangi: Tasks komponenti
import './AdminDashboard.css';

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const token = localStorage.getItem('token');

  // Foydalanuvchilarni olish funksiyasi
  const fetchUsers = useCallback(async (role) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Foydalanuvchilarni olishda xatolik');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      alert(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (['operator', 'tekshiruvchi', 'yurist'].includes(current)) {
      fetchUsers(current);
    }
  }, [current, fetchUsers]);

  const handleUserChange = e => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleSubmitUser = async e => {
    e.preventDefault();
    if (!token) return;
    try {
      const userPayload = {
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        firstName: userForm.firstName || undefined,
        lastName: userForm.lastName || undefined,
      };
      
      const url = editingUser ? `http://localhost:5000/api/users/${editingUser._id}` : 'http://localhost:5000/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(userPayload),
      });
      if (!res.ok) throw new Error('Foydalanuvchi bilan ishlashda xatolik');

      setEditingUser(null);
      setUserForm({ username: '', password: '', role: current, firstName: '', lastName: '' });
      fetchUsers(current);
    } catch (err) {
      alert('Foydalanuvchi bilan ishlashda xatolik: ' + err.message);
    }
  };

  const handleDeleteUser = async id => {
    if (!token || !window.confirm('Foydalanuvchini o‘chirishga ishonchingiz komilmi?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Foydalanuvchini o‘chirishda xatolik');
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert('Foydalanuvchini o‘chirishda xatolik: ' + err.message);
    }
  };

  const handleBalance = async (user, amount) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user._id}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) throw new Error('Balansni yangilashda xatolik');
      fetchUsers(current);
    } catch (err) {
      alert('Balansni yangilashda xatolik: ' + err.message);
    }
  };

  const handleEditUser = user => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      role: user.role,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
    });
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const clearUserForm = () => {
    setEditingUser(null);
    setUserForm({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  };

  const renderUserForm = () => (
    <form onSubmit={handleSubmitUser} className="admin-form">
      <h3>{editingUser ? '🔄 Foydalanuvchini tahrirlash' : '➕ Yangi foydalanuvchi qo‘shish'}</h3>
      <input name="username" placeholder="Login" value={userForm.username} onChange={handleUserChange} required />
      <input name="password" type="password" placeholder="Parol" value={userForm.password} onChange={handleUserChange} required={!editingUser} />
      <input name="firstName" placeholder="Ism" value={userForm.firstName || ''} onChange={handleUserChange} />
      <input name="lastName" placeholder="Familiya" value={userForm.lastName || ''} onChange={handleUserChange} />
      <select name="role" value={userForm.role} onChange={handleUserChange}>
        <option value="operator">Operator</option>
        <option value="tekshiruvchi">Tekshiruvchi</option>
        <option value="yurist">Yurist</option>
        <option value="admin">Admin</option>
      </select>
      <div className="form-actions">
        <button type="submit">{editingUser ? 'Saqlash' : 'Qo‘shish'}</button>
        {editingUser && <button type="button" onClick={clearUserForm}>Bekor qilish</button>}
      </div>
    </form>
  );

  return (
    <div className="admin-wrapper">
      <Sidebar current={current} setCurrent={setCurrent} onLogout={onLogout} />
      <div className="admin-main">
        {['operator', 'tekshiruvchi', 'yurist'].includes(current) && (
          <>
            {renderUserForm()}
            <UserTable users={users} role={current} onEdit={handleEditUser} onDelete={handleDeleteUser} onBalance={handleBalance} />
          </>
        )}

        {current === 'profil' && <h2>👤 Admin profilingiz bu yerda...</h2>}
        
        {current === 'ishlar' && <Tasks token={token} />}
      </div>
    </div>
  );
}

export default AdminDashboard;