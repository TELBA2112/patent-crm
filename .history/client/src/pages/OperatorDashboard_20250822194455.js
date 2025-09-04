import React, { useState, useEffect } from 'react';

function OperatorDashboard({ onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const token = localStorage.getItem('token');

  const fetchJobs = async () => {
    const res = await fetch('http://localhost:5000/api/jobs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const createJob = async () => {
    const res = await fetch('http://localhost:5000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ clientName, phone })
    });
    if (res.ok) {
      alert('Yangi ish yaratildi');
      setClientName('');
      setPhone('');
      fetchJobs();
    } else {
      alert('Xato: ish yaratilmadi');
    }
  };

  const sendForReview = async (id) => {
    const res = await fetch(`http://localhost:5000/api/jobs/${id}/send-for-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ brandName })
    });
    if (res.ok) {
      alert('Brend tekshiruvchiga yuborildi');
      fetchJobs();
    } else {
      alert('Xato: yuborilmadi');
    }
  };

  return (
    <div>
      <h2>Operator Dashboard</h2>
      <button onClick={onLogout}>Chiqish</button>

      <h3>Yangi ish yaratish</h3>
      <input placeholder="Mijoz ismi" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      <input placeholder="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <button onClick={createJob}>Yaratish</button>

      <h3>Ishlar ro‘yxati</h3>
      <ul>
        {jobs.map((job) => (
          <li key={job._id}>
            {job.clientName} ({job.status})
            <input placeholder="Brend nomi" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            <button onClick={() => sendForReview(job._id)}>Tekshiruvchiga yuborish</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OperatorDashboard;
