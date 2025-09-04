import React, { useEffect, useState, useCallback } from 'react';
import SidebarExaminer from './components/Sidebartekshiruvchi';
import './TekshiruvchiDashboard.css';

function TekshiruvchiDashboard({ onLogout }) {
  const [current, setCurrent] = useState('profil');
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [reviewResult, setReviewResult] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const token = localStorage.getItem('token');

  const fetchJobs = useCallback(async (status) => {
    if (!token) return;
    setJobsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
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
    if (current === 'tekshirish') {
      fetchJobs('tekshiruvchi');
    }
  }, [current, fetchJobs]);

  const handleReviewSubmit = async () => {
    if (!selectedJob || !reviewResult) return alert('Iltimos, natijani tanlang.');
    try {
      await fetch(`http://localhost:5000/api/jobs/${selectedJob._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: reviewResult, reason: reviewReason }),
      });
      alert('Tekshiruv natijasi yuborildi!');
      setSelectedJob(null);
      setReviewResult('');
      setReviewReason('');
      fetchJobs('tekshiruvchi');
    } catch (err) {
      alert('Natijani yuborishda xatolik: ' + err.message);
    }
  };

  const renderJobDetails = () => {
    if (!selectedJob) return null;
    return (
      <div className="job-details">
        <h3>Ish ma'lumotlari</h3>
        <p><strong>Brend nomi:</strong> {selectedJob.brandName}</p>
        <p><strong>Mijoz:</strong> {selectedJob.clientName} {selectedJob.clientSurname}</p>
        <p><strong>Telefon:</strong> {selectedJob.phone}</p>
        <p><strong>Holati:</strong> {selectedJob.status}</p>
        <hr />
        <h4>Tekshiruv natijasi</h4>
        <div className="review-options">
          <button onClick={() => setReviewResult('band')} className={reviewResult === 'band' ? 'active' : ''}>❌ Band</button>
          <button onClick={() => setReviewResult('bo‘sh')} className={reviewResult === 'bo‘sh' ? 'active' : ''}>✅ Bo‘sh</button>
        </div>
        {reviewResult === 'band' && (
          <textarea
            placeholder="Izohni kiriting (sababini tushuntiring)"
            value={reviewReason}
            onChange={e => setReviewReason(e.target.value)}
          />
        )}
        <button onClick={handleReviewSubmit} disabled={!reviewResult || (reviewResult === 'band' && !reviewReason)}>
          Yuborish
        </button>
      </div>
    );
  };

  return (
    <div className="examiner-wrapper">
      <SidebarExaminer current={current} setCurrent={setCurrent} onLogout={onLogout} />
      <div className="examiner-main">
        {current === 'profil' && <h2>👤 Tekshiruvchi profilingiz bu yerda...</h2>}
        {current === 'tekshirish' && (
          <>
            <h2>🔎 Brendlarni tekshirish</h2>
            {jobsLoading ? (
              <p>Ishlar yuklanmoqda...</p>
            ) : jobs.length > 0 ? (
              <div className="job-cards">
                {jobs.map(job => (
                  <div key={job._id} className="job-card" onClick={() => setSelectedJob(job)}>
                    <h4>{job.brandName}</h4>
                    <p>Mijoz: {job.clientName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Tekshirish uchun ishlar mavjud emas.</p>
            )}
            {renderJobDetails()}
          </>
        )}
      </div>
    </div>
  );
}

export default TekshiruvchiDashboard;