import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import AdminJobDetails from './AdminJobDetails';
import './AdminDashboard.css';

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]); // Yangi: Ishlar uchun state
  const [jobsLoading, setJobsLoading] = useState(false); // Yangi: Ishlarni yuklash holati
  const [form, setForm] = useState({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [jobForm, setJobForm] = useState({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '', yuridikDocs: {}, jismoniyDocs: {} });
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

  // Yangi: Ishlarni olish funksiyasi
  const fetchJobs = useCallback(async () => {
    if (!token) return;
    setJobsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      alert('Ishlarni olishda xatolik: ' + err.message);
      setJobs([]); // Xato bo'lganda bo'sh array o'rnatamiz
    } finally {
      setJobsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (['operator', 'tekshiruvchi', 'yurist'].includes(current)) {
      fetchUsers(current);
    } else if (current === 'ishlar') {
      fetchJobs();
    }
  }, [current, fetchUsers, fetchJobs]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleJobChange = e => {
    setJobForm({ ...jobForm, [e.target.name]: e.target.value });
  };

  const handleSubmitJob = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(jobForm)
      });
      if (!res.ok) throw new Error('Yangi ish yaratishda xatolik');
      alert('Yangi ish yaratildi');
      setJobForm({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '', yuridikDocs: {}, jismoniyDocs: {} });
      fetchJobs(); // Yangi ish qo'shilgandan so'ng ro'yxatni yangilash
    } catch (err) {
      alert('Ish yaratishda xatolik: ' + err.message);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!token) return;
    try {
      const userPayload = {
        username: form.username,
        password: form.password,
        role: form.role,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
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
      setForm({ username: '', password: '', role: current, firstName: '', lastName: '' });
      fetchUsers(current);
    } catch (err) {
      alert('Foydalanuvchi bilan ishlashda xatolik: ' + err.message);
    }
  };

  const handleDelete = async id => {
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

  const onEdit = user => {
    setEditingUser(user);
    setForm({
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

  return (
    <div className="admin-wrapper">
      <Sidebar current={current} setCurrent={setCurrent} onLogout={onLogout} />
      <div className="admin-main">
        {['operator', 'tekshiruvchi', 'yurist'].includes(current) && (
          <>
            <form onSubmit={handleSubmit} className="user-form">
              <h3>{editingUser ? '🔄 Foydalanuvchini tahrirlash' : '➕ Yangi foydalanuvchi qo‘shish'}</h3>
              <input name="username" placeholder="Login" value={form.username} onChange={handleChange} required />
              <input name="password" type="password" placeholder="Parol" value={form.password} onChange={handleChange} required={!editingUser} />
              <input name="firstName" placeholder="Ism" value={form.firstName || ''} onChange={handleChange} />
              <input name="lastName" placeholder="Familiya" value={form.lastName || ''} onChange={handleChange} />
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="operator">Operator</option>
                <option value="tekshiruvchi">Tekshiruvchi</option>
                <option value="yurist">Yurist</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit">{editingUser ? 'Saqlash' : 'Qo‘shish'}</button>
              {editingUser && <button type="button" onClick={() => { setEditingUser(null); setForm({ username: '', password: '', role: current, firstName: '', lastName: '' }); }}>Bekor qilish</button>}
            </form>
            <UserTable users={users} role={current} onEdit={onEdit} onDelete={handleDelete} onBalance={handleBalance} />
          </>
        )}

        {current === 'profil' && <h2>👤 Admin profilingiz bu yerda...</h2>}
        {current === 'ishlar' && token && (
          <>
            <h2>📋 Ishlar ro‘yxati</h2>
            {jobsLoading ? (
              <p>Ishlar yuklanmoqda...</p>
            ) : jobs.length > 0 ? (
              <div className="tasks-list">
                {jobs.map(job => (
                  <div key={job._id} className="task-card">
                    <h4>{job.brandName}</h4>
                    <p>Mijoz: {job.clientName} {job.clientSurname}</p>
                    <p>Telefon: {job.phone}</p>
                    <p>Holati: {job.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Hozircha ishlar mavjud emas.</p>
            )}

            <form onSubmit={handleSubmitJob} className="user-form">
              <h3>➕ Yangi ish yaratish</h3>
              <input name="clientName" placeholder="Ism" value={jobForm.clientName} onChange={handleJobChange} required />
              <input name="clientSurname" placeholder="Familiya" value={jobForm.clientSurname} onChange={handleJobChange} required />
              <input name="phone" placeholder="Telefon" value={jobForm.phone} onChange={handleJobChange} required />
              <input name="brandName" placeholder="Brend nomi" value={jobForm.brandName} onChange={handleJobChange} required />
              <select name="personType" value={jobForm.personType} onChange={handleJobChange} required>
                <option value="">Shaxs turi</option>
                <option value="yuridik">Yuridik</option>
                <option value="jismoniy">Jismoniy</option>
              </select>
              <button type="submit">Yaratish</button>
            </form>
            {/* AdminJobDetails komponenti qoldirildi, agar siz uning ichida boshqa logikani ko'rsatishni istasangiz */}
            {/* <AdminJobDetails /> */}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;