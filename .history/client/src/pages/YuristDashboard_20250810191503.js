import React, { useEffect, useState } from 'react';
import './YuristDashboard.css';

function YuristDashboard({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  // Profilni olish
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Profilni olishda xatolik');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setProfile(null);
        console.error('Profilni olishda xatolik:', err);
      }
    };
    fetchProfile();
  }, [token]);

  // Ishlarni olish
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=to_lawyer', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError('Ishlarni olishda xatolik: ' + err.message);
      console.error('Ishlarni olishda xatolik:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const handleUploadCertificates = async (jobId, file) => {
    if (!file) {
      return alert("Fayl tanlang!");
    }
    if (file.type !== 'application/vnd.rar' && file.type !== 'application/x-rar-compressed') {
      return alert("Faqat .rar formatidagi fayl yuklang.");
    }
    
    const formData = new FormData();
    formData.append('certificates', file);

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/upload-certificates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Fayl yuklashda xatolik');

      alert('Guvohnoma muvaffaqiyatli yuklandi!');
      fetchTasks(); // Ro'yxatni yangilash
    } catch (err) {
      setError('Fayl yuklashda xatolik: ' + err.message);
    }
  };

  return (
    <div className="yurist-dashboard-wrapper">
      <div className="dashboard-header">
        <h2>Yurist Paneli</h2>
        {profile && <div className="profile-info">Xush kelibsiz, {profile.firstName}</div>}
      </div>

      <div className="tasks-section">
        <h3>Guvohnoma yuklanishi kerak bo'lgan ishlar</h3>
        {error && <div className="error-message">{error}</div>}
        {tasksLoading ? (
          <p>Yuklanmoqda...</p>
        ) : tasks.length === 0 ? (
          <p>Yuklanishi kerak bo'lgan guvohnomalar mavjud emas.</p>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <div key={task._id} className="task-item">
                <div className="task-details">
                  <h4>{task.brandName}</h4>
                  <p>Mijoz: {task.clientName} {task.clientSurname}</p>
                </div>
                <div className="upload-section">
                  <input
                    type="file"
                    accept=".rar"
                    onChange={(e) => handleUploadCertificates(task._id, e.target.files[0])}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default YuristDashboard;