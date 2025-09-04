import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import './AdminDashboard.css';

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [jobForm, setJobForm] = useState({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '', yuridikDocs: {}, jismoniyDocs: {} });
  const [editingJob, setEditingJob] = useState(null);
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
      setJobs([]);
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
      const url = editingJob ? `http://localhost:5000/api/jobs/${editingJob._id}` : 'http://localhost:5000/api/jobs';
      const method = editingJob ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(jobForm)
      });
      if (!res.ok) throw new Error('Ish bilan ishlashda xatolik');
      
      alert(editingJob ? 'Ish muvaffaqiyatli tahrirlandi!' : 'Yangi ish yaratildi!');
      setJobForm({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '', yuridikDocs: {}, jismoniyDocs: {} });
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      alert('Ish bilan ishlashda xatolik: ' + err.message);
    }
  };

  const handleDeleteJob = async id => {
    if (!window.confirm('Ishni o‘chirishga ishonchingiz komilmi?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ishni o‘chirishda xatolik');
      alert('Ish muvaffaqiyatli o‘chirildi!');
      fetchJobs();
    } catch (err) {
      alert('Ishni o‘chirishda xatolik: ' + err.message);
    }
  };

  const handleEditJob = job => {
    setEditingJob(job);
    setJobForm({
      clientName: job.clientName,
      clientSurname: job.clientSurname,
      phone: job.phone,
      brandName: job.brandName,
      personType: job.personType,
      yuridikDocs: job.yuridikDocs || {},
      jismoniyDocs: job.jismoniyDocs || {},
    });
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
                    <h4>Brend: {job.brandName || 'Kiritilmagan'}</h4>
                    <p>Mijoz: {job.clientName} {job.clientSurname}</p>
                    <p>Telefon: {job.phone}</p>
                    <p>Holati: {job.status}</p>
                    <div className="task-actions">
                      <button onClick={() => handleEditJob(job)}>Tahrirlash</button>
                      <button onClick={() => handleDeleteJob(job._id)}>O‘chirish</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>Hozircha ishlar mavjud emas.</p>
            )}

            <form onSubmit={handleSubmitJob} className="user-form">
              <h3>{editingJob ? '🔄 Ishni tahrirlash' : '➕ Yangi ish yaratish'}</h3>
              <input name="clientName" placeholder="Ism" value={jobForm.clientName} onChange={handleJobChange} required />
              <input name="clientSurname" placeholder="Familiya" value={jobForm.clientSurname} onChange={handleJobChange} required />
              <input name="phone" placeholder="Telefon" value={jobForm.phone} onChange={handleJobChange} required />
              <input name="brandName" placeholder="Brend nomi" value={jobForm.brandName} onChange={handleJobChange} />
              <select name="personType" value={jobForm.personType} onChange={handleJobChange}>
                <option value="">Shaxs turi</option>
                <option value="yuridik">Yuridik</option>
                <option value="jismoniy">Jismoniy</option>
              </select>
              <button type="submit">{editingJob ? 'Saqlash' : 'Yaratish'}</button>
              {editingJob && <button type="button" onClick={() => { setEditingJob(null); setJobForm({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '', yuridikDocs: {}, jismoniyDocs: {} }); }}>Bekor qilish</button>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;