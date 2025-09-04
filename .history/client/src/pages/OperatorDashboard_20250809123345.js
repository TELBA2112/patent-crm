import React, { useEffect, useState } from 'react';
import './OperatorDashboard.css';

function OperatorDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('yangi');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Yangi: Ishlar uchun state
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [showPhone, setShowPhone] = useState(false);
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
    setLoading(true);
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
    setLoading(false);
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

  // Step-by-step modal
  const handleShowTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setStep(1);
    setShowPhone(false);
  };

  const handleShowPhone = () => {
    setShowPhone(true);
    setTimeout(() => setStep(2), 30000); // 30 sekunddan keyin keyingi step
  };

  // Yangi: Ishlar jadvali
  const renderTasksTable = () => (
    <div className="tasks-table">
      {loading ? (
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
      {/* Profil kartasi */}
      <div className="profile-card">
        <img src={profile?.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"} alt="Avatar" />
        <h2>{profile?.firstName} {profile?.lastName}</h2>
        <p>Balans: <b>{profile?.balance?.toLocaleString() || 0} so‘m</b></p>
      </div>

      {/* Yangi ishlar ro‘yxati */}
      <div className="tasks-list">
        <h3>🟦 Yangi ishlar</h3>
        {tasks.map(task => (
          <div className="task-card" key={task._id}>
            <div>
              <b>ID:</b> {task._id.slice(-5).toUpperCase()} {/* qisqa id */}
              <b>Ism:</b> {task.clientName} {task.clientSurname}
              <b>Status:</b> {task.status}
            </div>
            <button onClick={() => handleShowTask(task)}>Ko‘rish</button>
          </div>
        ))}
      </div>

      {/* Modal/drawer step-by-step */}
      {showModal && selectedTask && (
        <div className="modal">
          {step === 1 && (
            <div>
              <h4>1. Mijoz ma'lumotlari</h4>
              <p><b>Ism:</b> {selectedTask.clientName}</p>
              <p><b>Familiya:</b> {selectedTask.clientSurname}</p>
              <p><b>Izoh:</b> {selectedTask.comments}</p>
              <p><b>Brend:</b> {selectedTask.brandName}</p>
              <button onClick={handleShowPhone}>Telefonni ko‘rish</button>
              {showPhone && <p style={{color:'red'}}>{selectedTask.phone}</p>}
            </div>
          )}
          {step === 2 && (
            <div>
              <h4>2. Bog‘lanish natijasi</h4>
              <button>📞 Oldi</button>
              <button>❌ Olmadi</button>
              {/* ... */}
            </div>
          )}
          {/* ...step 3 va 4... */}
          <button onClick={() => setShowModal(false)}>Yopish</button>
        </div>
      )}
    </div>
  );
}

export default OperatorDashboard;
