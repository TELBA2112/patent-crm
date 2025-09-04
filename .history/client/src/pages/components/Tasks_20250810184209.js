import React, { useEffect, useState, useCallback } from 'react';
import './Tasks.css';

function Tasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
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

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users?role=operator', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Operatorlarni olishda xatolik');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    }
  }, [token]);

  const fetchTasks = useCallback(async () => {
    try {
      const query = new URLSearchParams(filter).toString();
      const res = await fetch(`http://localhost:5000/api/jobs?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
      setTasks([]);
    }
  }, [token, filter]);

  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, [fetchUsers, fetchTasks]);

  const handleInputChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilterChange = e => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const url = editingTask ? `http://localhost:5000/api/jobs/${editingTask._id}` : 'http://localhost:5000/api/jobs';
      const method = editingTask ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ish bilan ishlashda xatolik');

      setForm({
        clientName: '', clientSurname: '', phone: '', brandName: '',
        status: 'yangi', assignedTo: '', personType: ''
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
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Ishni o‘chirishda xatolik');
      fetchTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="tasks-container">
      <h2>Ishlar boshqaruvi</h2>
      <form onSubmit={handleSubmit} className="task-form">
        <h3>{editingTask ? 'Ishni tahrirlash' : 'Yangi ish qo‘shish'}</h3>
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
        <button type="submit">{editingTask ? 'Saqlash' : 'Qo‘shish'}</button>
        {editingTask && <button type="button" onClick={() => setEditingTask(null)}>Bekor qilish</button>}
      </form>

      {error && <div className="error-message">{error}</div>}

      <h3>Ishlar ro‘yxati</h3>
      <div className="filters">
        <select name="assignedTo" value={filter.assignedTo} onChange={handleFilterChange}>
          <option value="">Barcha operatorlar</option>
          {users.map(user => (
            <option key={user._id} value={user._id}>
              {user.username}
            </option>
          ))}
        </select>
        <input name="search" placeholder="Qidiruv..." value={filter.search} onChange={handleFilterChange} />
      </div>

      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mijoz</th>
              <th>Telefon</th>
              <th>Brend</th>
              <th>Status</th>
              <th>Operator</th>
              <th>Harakatlar</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id}>
                <td>{task._id.slice(-5)}</td>
                <td>{task.clientName} {task.clientSurname}</td>
                <td>{task.phone}</td>
                <td>{task.brandName || '-'}</td>
                <td><span className={`status-${task.status}`}>{task.status}</span></td>
                <td>{task.assignedTo?.username || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(task)}>Tahrirlash</button>
                  <button onClick={() => handleDelete(task._id)}>O‘chirish</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Tasks;