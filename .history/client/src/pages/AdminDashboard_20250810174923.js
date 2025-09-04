// AdminDashboard.js fayli sizning avvalgi kodingizdek qoladi.
// U to'liq va funksional.
import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import UserTable from './components/UserTable';
import './AdminDashboard.css';

function AdminDashboard() {
  const [current, setCurrent] = useState('profil');
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [jobForm, setJobForm] = useState({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '' });
  const [editingJob, setEditingJob] = useState(null);
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

  // Ishlarni olish funksiyasi
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

  const handleUserChange = e => {
    setUserForm({ ...userForm, [e.target.name]: e.target.value });
  };

  const handleJobChange = e => {
    setJobForm({ ...jobForm, [e.target.name]: e.target.value });
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
      setJobForm({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '' });
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      alert('Ish bilan ishlashda xatolik: ' + err.message);
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

  const handleEditJob = job => {
    setEditingJob(job);
    setJobForm({
      clientName: job.clientName,
      clientSurname: job.clientSurname,
      phone: job.phone,
      brandName: job.brandName,
      personType: job.personType,
    });
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const clearJobForm = () => {
    setEditingJob(null);
    setJobForm({ clientName: '', clientSurname: '', phone: '', brandName: '', personType: '' });
  };

  const clearUserForm = () => {
    setEditingUser(null);
    setUserForm({ username: '', password: '', role: 'operator', firstName: '', lastName: '' });
  };

  const renderJobForm = () => (
    <form onSubmit={handleSubmitJob} className="admin-form">
      <h3>{editingJob ? '🔄 Ishni tahrirlash' : '➕ Yangi ish yaratish'}</h3>
      <input name="clientName" placeholder="Mijoz ismi" value={jobForm.clientName} onChange={handleJobChange} required />
      <input name="clientSurname" placeholder="Mijoz familiyasi" value={jobForm.clientSurname} onChange={handleJobChange} required />
      <input name="phone" placeholder="Telefon raqami" value={jobForm.phone} onChange={handleJobChange} required />
      <input name="brandName" placeholder="Brend nomi" value={jobForm.brandName} onChange={handleJobChange} />
      <select name="personType" value={jobForm.personType} onChange={handleJobChange}>
        <option value="">Shaxs turi</option>
        <option value="yuridik">Yuridik</option>
        <option value="jismoniy">Jismoniy</option>
      </select>
      <div className="form-actions">
        <button type="submit">{editingJob ? 'Saqlash' : 'Yaratish'}</button>
        {editingJob && <button type="button" onClick={clearJobForm}>Bekor qilish</button>}
      </div>
    </form>
  );

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
        
        {current === 'ishlar' && (
          <>
            {renderJobForm()}
            <h2>📋 Ishlar ro‘yxati</h2>
            {jobsLoading ? (
              <p>Ishlar yuklanmoqda...</p>
            ) : jobs.length > 0 ? (
              <div className="tasks-list">
                {jobs.map(job => (
                  <div key={job._id} className={`task-card ${editingJob?._id === job._id ? 'editing' : ''}`}>
                    <h4>Brend: {job.brandName || 'Kiritilmagan'}</h4>
                    <p>Mijoz: {job.clientName} {job.clientSurname}</p>
                    <p>Telefon: {job.phone}</p>
                    <p>Holati: <span className={`status-${job.status}`}>{job.status}</span></p>
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
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;