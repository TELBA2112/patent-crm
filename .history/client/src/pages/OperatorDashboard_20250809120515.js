import React, { useEffect, useState } from 'react';
import './OperatorDashboard.css';

function OperatorDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('yangi');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Yangi: Ishlar uchun state
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const token = localStorage.getItem('token');

  // Profilni olish
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Profilni olishda xatolik');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        alert(err.message);
      }
    };
    fetchProfile();
  }, []);

  // Yangi: Operator ishlarini olish
  useEffect(() => {
    if (selectedSection === 'yangi' || selectedSection === 'jarayonda' || selectedSection === 'tugatilgan') {
      fetchTasks(selectedSection);
    }
  }, [selectedSection]);

  const fetchTasks = async (status) => {
    setTasksLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setTasks([]);
    }
    setTasksLoading(false);
  };

  // Avatar upload funksiyasi
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await fetch(`http://localhost:5000/api/users/${profile._id}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(prev => ({ ...prev, avatar: data.avatar }));
        alert('Avatar muvaffaqiyatli yuklandi!');
      } else {
        alert(data.message || 'Avatar yuklashda xatolik');
      }
    } catch (error) {
      alert('Avatar yuklashda xatolik yuz berdi');
    }
    setLoading(false);
  };

  // Yangi: Ishlar jadvali
  const renderTasksTable = () => (
    <div className="tasks-table">
      {tasksLoading ? (
        <p>Yuklanmoqda...</p>
      ) : tasks.length === 0 ? (
        <p>Ishlar topilmadi</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Ism</th>
              <th>Familiya</th>
              <th>Telefon</th>
              <th>Brend</th>
              <th>Status</th>
              <th>Izoh</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task._id}>
                <td>{task.clientName}</td>
                <td>{task.clientSurname}</td>
                <td>{task.phone}</td>
                <td>{task.brandName}</td>
                <td>{task.status}</td>
                <td>{task.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // Bo‘limlarni render qilish
  const renderSection = () => {
    switch (selectedSection) {
      case 'profil':
        return profile ? (
          <div className="profile-section">
            <h2>👤 Mening profilim</h2>
            <p><strong>Ism:</strong> {profile.firstName || '-'}</p>
            <p><strong>Familiya:</strong> {profile.lastName || '-'}</p>
            <p><strong>Balans:</strong> {profile.balance?.toLocaleString() || 0} so‘m</p>
            <img src={profile.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"} alt="Profil rasmi" className="avatar" />
            <input type="file" onChange={handleAvatarChange} disabled={loading} />
          </div>
        ) : <p>Yuklanmoqda...</p>;

      case 'yangi':
      case 'jarayonda':
      case 'tugatilgan':
        return (
          <div>
            <h2>
              {selectedSection === 'yangi' && '🟦 Yangi mijozlar'}
              {selectedSection === 'jarayonda' && '🟨 Jarayondagi mijozlar'}
              {selectedSection === 'tugatilgan' && '✅ Tugatilgan mijozlar'}
            </h2>
            {renderTasksTable()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={profile?.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"} alt="User" className="avatar" />
          <h3>{profile ? `${profile.firstName} ${profile.lastName}` : "Yuklanmoqda..."}</h3>
          <p className="balance">Balans: {profile?.balance?.toLocaleString() || 0} so‘m</p>
        </div>

        <nav className="sidebar-nav">
          <button onClick={() => setSelectedSection('profil')}>👤 Profil</button>
          <button onClick={() => setSelectedSection('yangi')}>🟦 Yangi mijozlar</button>
          <button onClick={() => setSelectedSection('jarayonda')}>🟨 Jarayonda</button>
          <button onClick={() => setSelectedSection('tugatilgan')}>✅ Tugatilgan</button>
          <button className="logout-btn" onClick={onLogout}>🚪 Chiqish</button>
        </nav>
      </aside>

      <main className="main-content">
        {renderSection()}
      </main>
    </div>
  );
}

export default OperatorDashboard;

/* CSS qismi */
.tasks-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}
.tasks-table th, .tasks-table td {
  border: 1px solid #ddd;
  padding: 8px;
}
.tasks-table th {
  background: #f0f0f0;
}
