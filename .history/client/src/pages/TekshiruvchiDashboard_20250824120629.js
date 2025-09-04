import React, { useEffect, useState, useCallback } from 'react';
import SidebarTekshiruvchi from './components/SidebarTekshiruvchi';
import './TekshiruvchiDashboard.css';

function TekshiruvchiDashboard() {
  const [profile, setProfile] = useState(null);
  const [currentSection, setCurrentSection] = useState('brend');
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [brandStatus, setBrandStatus] = useState('');
  const [reason, setReason] = useState('');
  const token = localStorage.getItem('token');

  // Profilni olish
  const fetchProfile = useCallback(async () => {
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
  }, [token]);

  // Ishlarni olish
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=in_review', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Ishlarni olishda xatolik:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    if (currentSection === 'brend') {
      fetchTasks();
    }
  }, [token, currentSection, fetchTasks, fetchProfile]);

  const handleReview = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    if (!brandStatus) return alert("Iltimos, brend holatini tanlang.");
    if (brandStatus === 'rejected' && !reason) return alert("Rad etish sababini kiriting.");
  
    try {
      // So'rov manzilidagi xatolikni tuzatish - /api/jobs/ o'rniga /api/job-actions/ ishlatish kerak
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/review-brand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: brandStatus === 'approved' ? 'approved' : 'rejected',
          reason: brandStatus === 'rejected' ? reason : '',
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server javobi:', errorText);
        throw new Error(`Statusni yangilashda xatolik: ${res.status} - ${errorText}`);
      }
  
      alert('Ish muvaffaqiyatli yangilandi!');
      setShowModal(false);
      setSelectedTask(null);
      setBrandStatus('');
      setReason('');
      fetchTasks();
    } catch (err) {
      console.error('Xatolik yuz berdi:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'profil':
        return (
          <div className="dashboard-content">
            <h3>👤 Profil ma'lumotlari</h3>
            {profile ? (
              <div className="profile-details">
                <p><strong>Ism:</strong> {profile.firstName} {profile.lastName}</p>
                <p><strong>Login:</strong> {profile.username}</p>
                <p><strong>Lavozim:</strong> Tekshiruvchi</p>
              </div>
            ) : (
              <p>Profil yuklanmoqda...</p>
            )}
          </div>
        );
      case 'brend':
        return (
          <div className="dashboard-content">
            <h3>📄 Brend tekshirish</h3>
            {tasksLoading ? (
              <p>Yuklanmoqda...</p>
            ) : tasks.length === 0 ? (
              <p>Tekshirish uchun ishlar mavjud emas.</p>
            ) : (
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task._id} className="task-item">
                    <div className="task-details">
                      <h4>{task.brandName}</h4>
                      <p>Mijoz: {task.clientName} {task.clientSurname}</p>
                      <p>Telefon: {task.phone}</p>
                    </div>
                    <button onClick={() => handleReview(task)}>Tekshirish</button>
                  </div>
                ))}
              </div>
            )}
            {renderModal()}
          </div>
        );
      case 'hujjatlar':
        return (
          <div className="dashboard-content">
            <h3>📝 Topshirishga tayyor hujjatlar</h3>
            <p>Bu bo'lim tez orada tayyor bo'ladi.</p>
          </div>
        );
      case 'yurist':
        return (
          <div className="dashboard-content">
            <h3>⚖️ Yurist</h3>
            <p>Bu bo'lim tez orada tayyor bo'ladi.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderModal = () => {
    if (!showModal || !selectedTask) return null;
    return (
      <div className="modal">
        <div className="modal-content">
          <h3>"{selectedTask.brandName}" brendini tekshirish</h3>
          <p>Mijoz: {selectedTask.clientName} {selectedTask.clientSurname}</p>
          <p>Telefon: {selectedTask.phone}</p>
          <div className="modal-actions">
            <button
              onClick={() => setBrandStatus('approved')}
              className={brandStatus === 'approved' ? 'active' : ''}
            >
              Ma'qullash
            </button>
            <button
              onClick={() => setBrandStatus('rejected')}
              className={brandStatus === 'rejected' ? 'active' : ''}
            >
              Rad etish
            </button>
          </div>
          {brandStatus === 'rejected' && (
            <textarea
              placeholder="Rad etish sababini kiriting..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          )}
          <div className="modal-footer">
            <button onClick={handleModalSubmit} disabled={!brandStatus || (brandStatus === 'rejected' && !reason)}>
              Saqlash
            </button>
            <button onClick={() => setShowModal(false)} className="cancel"> 
              Bekor qilish
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="tekshiruvchi-wrapper">
      <SidebarTekshiruvchi current={currentSection} setCurrent={setCurrentSection} onLogout={onLogout} />
      <div className="tekshiruvchi-main">
        {renderContent()}
      </div>
    </div>
  );
}

export default TekshiruvchiDashboard;