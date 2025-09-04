import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import Tasks from './components/Tasks';
import ExcelImport from './components/ExcelImport';
import WithdrawalManagement from './components/WithdrawalManagement';
import SalaryManagement from './components/SalaryManagement';
import './AdminDashboard.css';

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
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [refreshTasks, setRefreshTasks] = useState(false); // Yangilash uchun state
  const token = localStorage.getItem('token');

  // JSON javobni xavfsiz o'qish
  const safeJsonFetch = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Noto'g'ri JSON javob: ${text}`);
    }
  };

  // Foydalanuvchilarni olish
  const fetchUsers = useCallback(async (role) => {
    if (!token) {
      setUsers([]);
      return;
    }
    try {
      console.log('Foydalanuvchilarni olishga urinish:', role);
  const res = await apiFetch(`/api/users?role=${role}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server javobi:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Foydalanuvchilarni olishda xatolik');
        } catch (e) {
          throw new Error(`Foydalanuvchilarni olishda xatolik: ${errorText}`);
        }
      }
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('JSON parse xatosi:', text);
        throw new Error('Serverdan noto\'g\'ri ma\'lumot formati');
      }
      
      console.log('Olingan foydalanuvchilar:', data);
      setUsers(data);
    } catch (err) {
      console.error('Foydalanuvchilarni olishda xatolik:', err);
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
        ? `/api/users/${editingUser._id}`
        : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {},
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
      const res = await apiFetch(`/api/users/${user._id}/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  const handleImportComplete = (results) => {
    if (results.success > 0) {
      alert(`${results.success} ta ish muvaffaqiyatli import qilindi!`);
      if (current === 'ishlar') {
        // Ishlar ro'yxatini yangilash uchun trigger
        setRefreshTasks(prev => !prev);
      }
    }
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
            <div className="admin-toolbar">
              <button 
                className={`toolbar-btn ${showExcelImport ? 'active' : ''}`} 
                onClick={() => setShowExcelImport(!showExcelImport)}
              >
                {showExcelImport ? '❌ Excel importini yopish' : '📥 Excel orqali yuklash'}
              </button>
            </div>
            
            {showExcelImport && (
              <ExcelImport token={token} onImportComplete={handleImportComplete} />
            )}
            
            <Tasks token={token} refreshTrigger={refreshTasks} />
          </>
        )}

        {current === 'tolovlar' && (
          <>
            <h2>💰 To'lovlar boshqaruvi</h2>
            <WithdrawalManagement />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
