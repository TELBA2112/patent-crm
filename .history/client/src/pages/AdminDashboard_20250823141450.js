import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import Tasks from './components/Tasks';
import './AdminDashboard.css';

// Yangi CreateJob komponenti
function CreateJob({ token, onJobCreated }) {
  const [brandName, setBrandName] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Avval tizimga kiring!');
      return;
    }
    if (!brandName.trim()) {
      alert('Brend nomi bo‘sh bo‘lishi mumkin emas');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandName: brandName.trim(), assignedTo: assignedTo.trim() || undefined }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Serverdan xatolik');
      }

      const data = await res.json();
      alert('Yangi ish yaratildi!');
      setBrandName('');
      setAssignedTo('');
      if (onJobCreated) onJobCreated(data);
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>➕ Yangi ish yaratish</h3>
      <input
        type="text"
        placeholder="Brend nomi"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Operator ID (assignedTo)"
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
      />
      <button type="submit">Yaratish</button>
    </form>
  );
}

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'operator',
    firstName: '',
    lastName: ''
  });
  const [editingUser, setEditingUser] = useState(null);
  const token = localStorage.getItem('token');

  // Helper function to check response and parse JSON safely
  const safeJsonFetch = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Noto'g'ri JSON javob: ${text}`);
    }
  };

  const fetchUsers = useCallback(async (role) => {
    if (!token) {
      setUsers([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/users?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Foydalanuvchilarni olishda xatolik');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      alert('Foydalanuvchilarni olishda xatolik: ' + err.message);
      setUsers([]);
    }
  }, [token]);

  useEffect(() => {
    if (['operator', 'tekshiruvchi', 'yurist'].includes(current)) {
      fetchUsers(current);
    } else {
      setUsers([]);
    }
  }, [current, fetchUsers]);

  const handleUserChange = e => {
    const { name, value } = e.target;
    setUserForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitUser = async e => {
    e.preventDefault();
    if (!token) {
      alert('Avval tizimga kiring!');
      return;
    }

    if (!userForm.username.trim()) {
      alert('Login maydoni bo‘sh bo‘lishi mumkin emas');
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      alert('Parol maydoni bo‘sh bo‘lishi mumkin emas');
      return;
    }

    try {
      const userPayload = {
        username: userForm.username.trim(),
        role: userForm.role,
        firstName: userForm.firstName.trim() || undefined,
        lastName: userForm.lastName.trim() || undefined,
      };
      if (userForm.password.trim()) {
        userPayload.password = userForm.password.trim();
      }

      const url = editingUser
        ? `http://localhost:5000/api/users/${editingUser._id}`
        : 'http://localhost:5000/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userPayload),
      });

      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Foydalanuvchi bilan ishlashda xatolik');
      }

      setEditingUser(null);
      setUserForm({ username: '', password: '', role: current, firstName: '', lastName: '' });
      fetchUsers(current);
    } catch (err) {
      alert('Foydalanuvchi bilan ishlashda xatolik: ' + err.message);
    }
  };

  const handleDeleteUser = async id => {
    if (!token) {
      alert('Avval tizimga kiring!');
      return;
    }
    if (!window.confirm('Foydalanuvchini o‘chirishga ishonchingiz komilmi?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Foydalanuvchini o‘chirishda xatolik');
      }
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      alert('Foydalanuvchini o‘chirishda xatolik: ' + err.message);
    }
  };

  const handleBalance = async (user, amount) => {
    if (!token) {
      alert('Avval tizimga kiring!');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user._id}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Balansni yangilashda xatolik');
      }
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
      <input
        name="username"
        placeholder="Login"
        value={userForm.username}
        onChange={handleUserChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder={editingUser ? "Yangi parol (ixtiyoriy)" : "Parol"}
        value={userForm.password}
        onChange={handleUserChange}
        required={!editingUser}
      />
      <input
        name="firstName"
        placeholder="Ism"
        value={userForm.firstName}
        onChange={handleUserChange}
      />
      <input
        name="lastName"
        placeholder="Familiya"
        value={userForm.lastName}
        onChange={handleUserChange}
      />
      <select name="role" value={userForm.role} onChange={handleUserChange}>
        <option value="operator">Operator</option>
        <option value="tekshiruvchi">Tekshiruvchi</option>
        <option value="yurist">Yurist</option>
        <option value="admin">Admin</option>
      </select>
      <div className="form-actions">
        <button type="submit">{editingUser ? 'Saqlash' : 'Qo‘shish'}</button>
        {editingUser && (
          <button type="button" onClick={clearUserForm}>
            Bekor qilish
          </button>
        )}
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
            <UserTable
              users={users}
              role={current}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onBalance={handleBalance}
            />
          </>
        )}

        {current === 'profil' && <h2>👤 Admin profilingiz bu yerda...</h2>}

        {current === 'ishlar' && (
          <>
            <CreateJob token={token} onJobCreated={() => {
              // Agar kerak bo'lsa, ishlar ro'yxatini yangilash uchun kod qo'yiladi
            }} />
            <Tasks token={token} />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
