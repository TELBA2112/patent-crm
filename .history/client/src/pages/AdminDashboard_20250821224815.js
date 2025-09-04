import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import './AdminDashboard.css';

function AdminDashboard({ onLogout }) {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tekshiruvchilar, setTekshiruvchilar] = useState([]); // Yangi
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const token = localStorage.getItem('token');

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

  // Yangi: Tekshiruvchilar ro'yxatini olish
  const fetchTekshiruvchilar = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users?role=tekshiruvchi', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Tekshiruvchilarni olishda xatolik');
      const data = await res.json();
      setTekshiruvchilar(data);
    } catch (err) {
      console.error('Tekshiruvchilarni olishda xatolik: ' + err.message);
    }
  }, [token]);
  
  // Yangi: Yangi ishlarni olish
  const fetchNewJobs = useCallback(async () => {
    try {
        const res = await fetch('http://localhost:5000/api/jobs?status=brand_in_review', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ishlarni olishda xatolik');
        const data = await res.json();
        setTasks(data);
    } catch (err) {
        console.error('Ishlarni olishda xatolik: ' + err.message);
    }
  }, [token]);

  // Yangi: Ishga tekshiruvchi biriktirish
  const handleAssignTekshiruvchi = async (jobId, tekshiruvchiId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'brand_in_review',
          tekshiruvchiId: tekshiruvchiId
        })
      });
      if (!res.ok) throw new Error('Tekshiruvchini biriktirishda xatolik');
      
      alert('Tekshiruvchi muvaffaqiyatli biriktirildi!');
      fetchNewJobs(); // Ro'yxatni yangilash
    } catch (err) {
      alert('Tekshiruvchini biriktirishda xatolik: ' + err.message);
    }
  };

  useEffect(() => {
    if (['operator', 'tekshiruvchi', 'yurist'].includes(current)) {
      fetchUsers(current);
    } else if (current === 'tasks') {
        fetchNewJobs();
        fetchTekshiruvchilar();
    }
  }, [current, fetchUsers, fetchNewJobs, fetchTekshiruvchilar]);

  const handleUserChange = e => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    // ... (foydalanuvchi yaratish/yangilash logikasi)
  };
  const handleEditUser = user => { /* ... */ };
  const handleDeleteUser = async (userId) => { /* ... */ };
  const handleBalance = async (userId) => { /* ... */ };
  const clearUserForm = () => { /* ... */ };

  const renderUserForm = () => {
    return (
      <form onSubmit={handleSubmitUser} className="user-form">
        <h3>{editingUser ? 'Foydalanuvchini yangilash' : 'Yangi foydalanuvchi yaratish'}</h3>
        <input name="username" placeholder="Login" value={userForm.username} onChange={handleUserChange} required />
        <input type="password" name="password" placeholder="Parol" value={userForm.password} onChange={handleUserChange} required={!editingUser} />
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
  };
  
  const renderTasks = () => (
    <div className="tasks-list">
      <h2>🆕 Tekshiruvchiga biriktirishni kutayotgan ishlar</h2>
      {tasks.length === 0 ? <p>Yangi ishlar mavjud emas.</p> : tasks.map(task => (
        <div key={task._id} className="task-card">
          <h3>Buyurtma #{task.jobNo}</h3>
          <p><strong>Mijoz:</strong> {task.clientName}</p>
          <p><strong>Brend:</strong> {task.brandName}</p>
          <p><strong>Holat:</strong> {task.status}</p>
          {tekshiruvchilar.length > 0 ? (
            <div>
              <label>Tekshiruvchi tanlash:</label>
              <select onChange={(e) => handleAssignTekshiruvchi(task._id, e.target.value)}>
                <option value="">Tanlang</option>
                {tekshiruvchilar.map(t => (
                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>
          ) : (
            <p>Tekshiruvchilar topilmadi.</p>
          )}
        </div>
      ))}
    </div>
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
        {current === 'tasks' && renderTasks()}
        {current === 'profil' && <h2>👤 Admin profilingiz bu yerda...</h2>}
      </div>
    </div>
  );
}

export default AdminDashboard;