import React, { useEffect, useState } from 'react';
import './OperatorDashboard.css';

function OperatorDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('yangi');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [showPhone, setShowPhone] = useState(false);
  const [phoneTimer, setPhoneTimer] = useState(10); // 10 sekund
  const [callResult, setCallResult] = useState('');
  const [clientIntent, setClientIntent] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [brandName, setBrandName] = useState('');
  const [personType, setPersonType] = useState('');
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
        alert(err.message);
      }
    };
    fetchProfile();
  }, [token]);

  // Ishlarni olish
  useEffect(() => {
    if (['yangi', 'jarayonda', 'tugatilgan'].includes(selectedSection)) {
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
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${profile._id}/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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

  // Step-by-step modal logikasi
  useEffect(() => {
    let timer;
    if (showPhone && phoneTimer > 0) {
      timer = setTimeout(() => setPhoneTimer(t => t - 1), 1000);
    } else if (showPhone && phoneTimer === 0) {
      setStep(2);
    }
    return () => clearTimeout(timer);
  }, [showPhone, phoneTimer]);

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setStep(1);
    setShowPhone(false);
    setPhoneTimer(10); // 10 sekund
    setCallResult('');
    setClientIntent('');
    setFutureDate('');
    setBrandName('');
    setPersonType('');
  };

  const handleShowPhone = () => {
    setShowPhone(true);
    setPhoneTimer(10); // 10 sekund
  };

  const handleCallResult = (result) => {
    setCallResult(result);
    setStep(3);
  };

  const handleIntent = (intent) => {
    setClientIntent(intent);
    if (intent === 'later') setStep(4);
    else if (intent === 'do') setStep(5);
    else setStep(6); // 0% qizil
  };

  const handleSave = () => {
    // TODO: API orqali natijani saqlash
    setShowModal(false);
    // Yangi ishlarni qayta yuklash
    fetchTasks('yangi');
  };

  // Profil kartasi
  const renderProfile = () => (
    <div className="profile-card">
      <label className="avatar-upload">
        <img
          src={profile?.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"}
          alt="Avatar"
          className="avatar-img"
        />
        <input type="file" onChange={handleAvatarChange} disabled={loading} />
      </label>
      <h2>{profile?.firstName} {profile?.lastName}</h2>
      <p>Balans: <b>{profile?.balance?.toLocaleString() || 0} so‘m</b></p>
    </div>
  );

  // Yangi ishlar ro‘yxati
  const renderTasks = () => (
    <div className="tasks-list">
      <h3>🟦 Yangi ishlar</h3>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards">
          {tasks.map(task => (
            <div className="task-card" key={task._id}>
              <div>
                <b>ID:</b> {task._id.slice(-5).toUpperCase()}<br />
                <b>Ism:</b> {task.clientName} {task.clientSurname}<br />
                <b>Status:</b> {task.status}
              </div>
              <button onClick={() => openTaskModal(task)}>Ko‘rish</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step-by-step modal
  const renderModal = () => selectedTask && (
    <div className="modal">
      <div className="modal-content">
        <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
        {step === 1 && (
          <div>
            <h4>1. Mijoz ma'lumotlari</h4>
            <p><b>Ism:</b> {selectedTask.clientName}</p>
            <p><b>Familiya:</b> {selectedTask.clientSurname}</p>
            <p><b>Izoh:</b> {selectedTask.comments}</p>
            <p><b>Brend:</b> {selectedTask.brandName}</p>
            <button className="show-phone-btn" onClick={handleShowPhone}>Telefonni ko‘rish</button>
            {showPhone && <p style={{color:'red',fontWeight:'bold',fontSize:'18px'}}>{selectedTask.phone} <span>({phoneTimer})</span></p>}
          </div>
        )}
        {step === 2 && (
          <div>
            <h4>2. Bog‘lanish natijasi</h4>
            <button onClick={() => handleCallResult('answered')}>📞 Oldi</button>
            <button onClick={() => handleCallResult('not-answered')}>❌ Olmadi</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h4>3. Mijoz xohishi</h4>
            <button onClick={() => handleIntent('no')}>0% ❌ Xizmatdan foydalanmaydi</button>
            <button onClick={() => handleIntent('later')}>⏳ Keyinroq qildirmoqchi</button>
            <button onClick={() => handleIntent('do')}>✅ Qildirmoqchi</button>
          </div>
        )}
        {step === 4 && (
          <div>
            <h4>Taxminiy sana</h4>
            <input type="date" value={futureDate} onChange={e => setFutureDate(e.target.value)} />
            <button onClick={handleSave} disabled={!futureDate}>Saqlash</button>
          </div>
        )}
        {step === 5 && (
          <div>
            <h4>Brend va shaxs turi</h4>
            <input type="text" placeholder="Brend nomi" value={brandName} onChange={e => setBrandName(e.target.value)} />
            <select value={personType} onChange={e => setPersonType(e.target.value)}>
              <option value="">Shaxs turi</option>
              <option value="yuridik">Yuridik</option>
              <option value="jismoniy">Jismoniy</option>
            </select>
            <button onClick={handleSave} disabled={!brandName}>Yuborish</button>
          </div>
        )}
        {step === 6 && (
          <div>
            <h4 style={{color:'red'}}>0% Xizmatdan foydalanmaydi</h4>
            <button onClick={handleSave}>Saqlash</button>
          </div>
        )}
      </div>
    </div>
  );

  // Bo‘limlarni render qilish
  const renderSection = () => {
    switch (selectedSection) {
      case 'profil':
        return profile ? renderProfile() : <p>Yuklanmoqda...</p>;
      case 'yangi':
        return renderTasks();
      case 'jarayonda':
      case 'tugatilgan':
        return (
          <div style={{padding:'30px'}}>
            <h2>{selectedSection === 'jarayonda' ? '🟨 Jarayondagi mijozlar' : '✅ Tugatilgan mijozlar'}</h2>
            {/* TODO: Shu statusdagi ishlar uchun ham zamonaviy UI */}
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
      {showModal && renderModal()}
    </div>
  );
}

export default OperatorDashboard;
