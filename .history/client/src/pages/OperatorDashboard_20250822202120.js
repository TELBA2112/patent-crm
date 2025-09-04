import React, { useState, useEffect } from 'react';

function OperatorDashboard({ onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  // Har bir ish uchun alohida brand nomi saqlaymiz: { [jobId]: 'Brand nomi' }
  const [brandById, setBrandById] = useState({});
  const token = localStorage.getItem('token');

  const api = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    // xatoni to‘liq ko‘rsatish uchun body ni ham o‘qiymiz
    const raw = await res.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = raw;
    }
    if (!res.ok) {
      const msg = data?.message || data || 'Noma’lum xatolik';
      throw new Error(`${res.status} — ${msg}`);
    }
    return data;
  };

  const fetchJobs = async () => {
    try {
      const data = await api('http://localhost:5000/api/jobs');
      setJobs(data);
    } catch (e) {
      alert('Ishlarni olishda xato: ' + e.message);
      setJobs([]);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createJob = async () => {
    if (!clientName || !phone) {
      alert('Ism va telefonni kiriting');
      return;
    }
    try {
      await api('http://localhost:5000/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ clientName, phone })
      });
      alert('Yangi ish yaratildi');
      setClientName('');
      setPhone('');
      fetchJobs();
    } catch (e) {
      alert('Xato: ' + e.message);
    }
  };

  const sendForReview = async (id) => {
    const brandName = (brandById[id] || '').trim();
    if (!brandName) {
      alert('Brend nomini kiriting');
      return;
    }
    try {
      await api(`http://localhost:5000/api/jobs/${id}/send-for-review`, {
        method: 'POST',
        body: JSON.stringify({ brandName })
      });
      alert('Brend tekshiruvchiga yuborildi');
      // yuborilgandan keyin o‘sha ishning inputini tozalaymiz
      setBrandById(prev => ({ ...prev, [id]: '' }));
      fetchJobs();
    } catch (e) {
      alert('Xato: ' + e.message);
    }
  };

  const onChangeBrand = (id, val) => {
    setBrandById(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Operator Dashboard (mini test)</h2>
      <button onClick={onLogout} style={{ marginBottom: 12 }}>Chiqish</button>

      <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 20 }}>
        <h3>Yangi ish yaratish</h3>
        <input
          placeholder="Mijoz ismi"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          placeholder="Telefon"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button onClick={createJob}>Yaratish</button>
      </div>

      <h3>Ishlar ro‘yxati</h3>
      {jobs.length === 0 ? (
        <p>Ishlar yo‘q</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {jobs.map((job) => (
            <li key={job._id} style={{ border: '1px solid #eee', padding: 12, marginBottom: 10 }}>
              <div><b>ID:</b> {job._id}</div>
              <div><b>Mijoz:</b> {job.clientName || '-'}</div>
              <div><b>Telefon:</b> {job.phone || '-'}</div>
              <div><b>Status:</b> {job.status}</div>
              <div><b>Brend:</b> {job.brandName || '-'}</div>

              <div style={{ marginTop: 8 }}>
                <input
                  placeholder="Brend nomi"
                  value={brandById[job._id] || ''}
                  onChange={(e) => onChangeBrand(job._id, e.target.value)}
                  style={{ marginRight: 8 }}
                />
                <button onClick={() => sendForReview(job._id)}>
                  Tekshiruvchiga yuborish
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OperatorDashboard;
