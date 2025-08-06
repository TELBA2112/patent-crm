import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'operator' });

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:5000/api/users/list', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(res.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/create', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User created');
      setForm({ username: '', password: '', role: 'operator' });
      fetchUsers();
    } catch (err) {
      alert('Error creating user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <form onSubmit={handleCreate}>
        <input type="text" placeholder="Username" value={form.username}
               onChange={(e) => setForm({ ...form, username: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="operator">Operator</option>
          <option value="checker">Tekshiruvchi</option>
          <option value="lawyer">Yurist</option>
        </select>
        <button type="submit">Create User</button>
      </form>

      <h3>Foydalanuvchilar ro‘yxati</h3>
      <ul>
        {users.map(user => (
          <li key={user._id}>{user.username} - {user.role}</li>
        ))}
      </ul>
    </div>
  );
}
    import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const token = localStorage.getItem('token');

  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/admin/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data);
    } catch (error) {
      alert('Hisobotni olishda xatolik yuz berdi');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      alert('Foydalanuvchilarni olishda xatolik yuz berdi');
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchUsers();
  }, []);

  const assignGroup = async () => {
    if (!selectedUser || !groupName) return alert('Foydalanuvchi va guruh nomini tanlang');
    try {
      await axios.post('/api/admin/users/group', {
        userId: selectedUser._id,
        group: groupName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Guruhga qo‘shildi');
      fetchUsers();
    } catch (error) {
      alert('Guruh qo‘shishda xatolik yuz berdi');
    }
  };

  return (
    <div>
      <h2>🛠️ Admin Panel</h2>

      {summary && (
        <div>
          <h3>Kompaniya Hisoboti</h3>
          <p>Umumiy arizalar: {summary.totalRequests}</p>
          <p>Umumiy foyda: {summary.totalProfit} so'm</p>
          <p>Umumiy xarajatlar: {summary.totalCost} so'm</p>
        </div>
      )}

      <hr />

      <h3>Ishchilar va Guruhlar</h3>
      <select onChange={e => setSelectedUser(users.find(u => u._id === e.target.value))}>
        <option value="">Foydalanuvchini tanlang</option>
        {users.map(user => (
          <option key={user._id} value={user._id}>{user.username} ({user.role})</option>
        ))}
      </select>
      <input
        placeholder="Guruh nomi"
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
      />
      <button onClick={assignGroup}>Guruhga Qo‘shish</button>

      <hr />

      <h3>Ishchilar ro‘yxati</h3>
      <ul>
        {users.map(user => (
          <li key={user._id}>{user.username} — {user.role} — Guruh: {user.group || 'Yo‘q'}</li>
        ))}
      </ul>
    </div>
  );
}
