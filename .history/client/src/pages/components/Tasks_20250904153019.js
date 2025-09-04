import React, { useEffect, useState, useCallback } from 'react';
import HistoryBlock from './HistoryBlock';
import './Tasks.css';
import { apiFetch } from '../../utils/api';

function Tasks({ token, refreshTrigger }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({
    clientName: '',
    clientSurname: '',
    phone: '',
    brandName: '',
    status: 'yangi',
    assignedTo: '',
    personType: '',
  });
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ assignedTo: '', status: '', search: '' });
  const [profile, setProfile] = useState(null);
  
  // Job details modal states
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [jobDocuments, setJobDocuments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payoutForm, setPayoutForm] = useState({
    role: 'operator',
    amount: '',
    comment: ''
  });

  const safeJsonFetch = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Noto'g'ri JSON javob: ${text}`);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
  const res = await apiFetch('/api/users?role=operator');
      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Operatorlarni olishda xatolik');
      }
      const data = await safeJsonFetch(res);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchTasks = useCallback(async () => {
    try {
      const query = new URLSearchParams(filter).toString();
  const res = await apiFetch(`/api/jobs?${query}`);
      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Ishlarni olishda xatolik');
      }
      const data = await safeJsonFetch(res);
      setTasks(data);
    } catch (err) {
      setError(err.message);
      setTasks([]);
    }
  }, [token, filter]);

  const fetchProfile = useCallback(async () => {
    try {
  const res = await apiFetch('/api/users/me');
      if (!res.ok) {
        throw new Error('Profil ma\'lumotlarini olishda xatolik');
      }
      const data = await safeJsonFetch(res);
      setProfile(data);
    } catch (err) {
      console.error('Profil xatoligi:', err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchUsers();
    fetchTasks();
  }, [fetchProfile, fetchUsers, fetchTasks, refreshTrigger]); // refreshTrigger'ni dependency'ga qo'shish

  const handleInputChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilterChange = e => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const url = editingTask
        ? `/api/jobs/${editingTask._id}`
        : '/api/jobs';

      const method = editingTask ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          // Xatoni JSON sifatida o'qishga harakat qilish
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Ish bilan ishlashda noma\'lum xatolik');
        } catch (jsonError) {
          // Agar JSON bo'lmasa, xato matnini o'zini ko'rsatish
          throw new Error(errorText || 'Serverdan javob olishda xatolik');
        }
      }

      // POST so'rovi muvaffaqiyatli bo'lsa, javob bo'sh bo'lishi mumkin.
      // Shuning uchun javobni o'qishga harakat qilmaymiz.
      // fetchTasks() ro'yxatni yangilaydi.

      setForm({
        clientName: '',
        clientSurname: '',
        phone: '',
        brandName: '',
        status: 'yangi',
        assignedTo: '',
        personType: ''
      });

      setEditingTask(null);
      setError('');
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setForm({
      clientName: task.clientName,
      clientSurname: task.clientSurname,
      phone: task.phone,
      brandName: task.brandName,
      status: task.status,
      assignedTo: task.assignedTo?._id || '',
      personType: task.personType,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu ishni o'chirishga ishonchingiz komilmi?")) return;
    try {
  const res = await apiFetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Ishni ochirishda xatolik');
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  const exportToExcel = async () => {
    try {
      const query = new URLSearchParams(filter).toString();
  const res = await apiFetch(`/api/jobs/export?${query}`);
      
      if (!res.ok) {
        const errorData = await safeJsonFetch(res);
        throw new Error(errorData.message || 'Export qilishda xatolik');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'jobs_export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="tasks-container">
      <h2>Ishlar boshqaruvi</h2>
      <form onSubmit={handleSubmit} className="task-form">
        <h3>{editingTask ? 'Ishni tahrirlash' : 'Yangi ish qoshish'}</h3>
        <input name="clientName" placeholder="Mijoz ismi" value={form.clientName} onChange={handleInputChange} required />
        <input name="clientSurname" placeholder="Mijoz familiyasi" value={form.clientSurname} onChange={handleInputChange} required />
        <input name="phone" placeholder="Telefon raqami" value={form.phone} onChange={handleInputChange} required />
        <input name="brandName" placeholder="Brend nomi" value={form.brandName} onChange={handleInputChange} />
        <select name="personType" value={form.personType} onChange={handleInputChange} required>
          <option value="">Shaxs turini tanlang</option>
          <option value="yuridik">Yuridik shaxs</option>
          <option value="jismoniy">Jismoniy shaxs</option>
        </select>
        <select name="assignedTo" value={form.assignedTo} onChange={handleInputChange} required>
          <option value="">Operatorni tanlang</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName} ({user.username})
            </option>
          ))}
        </select>
        <button type="submit">{editingTask ? 'Saqlash' : 'Qoshish'}</button>
        {editingTask && <button type="button" onClick={() => setEditingTask(null)}>Bekor qilish</button>}
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="tasks-header">
        <h3>Ishlar ro'yxati</h3>
        {profile && profile.role === 'admin' && (
          <button className="export-button" onClick={exportToExcel}>
            Excel ga chiqarish
          </button>
        )}
      </div>

      <div className="filters">
        <select name="assignedTo" value={filter.assignedTo} onChange={handleFilterChange}>
          <option value="">Barcha operatorlar</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName} ({user.username})
            </option>
          ))}
        </select>
        <select name="status" value={filter.status} onChange={handleFilterChange}>
          <option value="">Barcha statuslar</option>
          <option value="yangi">Yangi</option>
          <option value="bajarilmoqda">Bajarilmoqda</option>
          <option value="bajarildi">Bajarildi</option>
        </select>
        <input
          type="text"
          name="search"
          placeholder="Qidiruv..."
          value={filter.search}
          onChange={handleFilterChange}
        />
      </div>

      <table className="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Mijoz ismi</th>
            <th>Familiya</th>
            <th>Telefon</th>
            <th>Brend</th>
            <th>Status</th>
            <th>Operator</th>
            <th>Shaxs turi</th>
            <th>Amallar</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr><td colSpan="9">Ishlar topilmadi</td></tr>
          ) : (
            tasks.map(task => (
              <React.Fragment key={task._id}>
                <tr>
                  <td>{task.jobId || '-'}</td>
                  <td>{task.clientName}</td>
                  <td>{task.clientSurname}</td>
                  <td>{task.phone}</td>
                  <td>{task.brandName}</td>
                  <td>{task.status}</td>
                  <td>{task.assignedTo?.firstName} {task.assignedTo?.lastName}</td>
                  <td>{task.personType}</td>
                  <td>
                    <button onClick={() => handleEdit(task)}>Tahrirlash</button>
                    <button onClick={() => handleDelete(task._id)}>O‘chirish</button>
                    {Array.isArray(task.history) && task.history.length > 0 && (
                      <button onClick={() => setOpenId(prev => prev === task._id ? null : task._id)} style={{marginLeft:8}}>
                        {openId === task._id ? 'Tarixni yopish' : 'Tarixni ko‘rish'}
                      </button>
                    )}
                  </td>
                </tr>
                {openId === task._id && Array.isArray(task.history) && task.history.length > 0 && (
                  <tr>
                    <td colSpan="9">
                      <div style={{background:'#fafafa', padding: '8px 10px', borderRadius: 6}}>
                        <strong>Tarix:</strong>
                        <HistoryBlock history={task.history} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Tasks;
