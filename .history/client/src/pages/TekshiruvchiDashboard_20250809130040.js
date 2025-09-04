import React, { useEffect, useState } from 'react';
import './TekshiruvchiDashboard.css';

function TekshiruvchiDashboard() {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [brandStatus, setBrandStatus] = useState('');
  const [comment, setComment] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [section, setSection] = useState('tekshirish');
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
      }
    };
    fetchProfile();
  }, [token]);

  // Ishlarni olish
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=tekshiruvchi', {
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

  // Statistika
  const checkedCount = tasks.filter(t => t.status === 'tekshiruvchi').length;
  const inProgressCount = tasks.filter(t => t.status === 'jarayonda').length;
  const doneCount = tasks.filter(t => t.status === 'tugatilgan').length;

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setStep(1);
    setBrandStatus('');
    setComment('');
    setScreenshot(null);
  };

  const handleBrandStatus = (status) => {
    setBrandStatus(status);
    if (status === 'band') setStep(2);
    else setStep(3);
  };

  const handleSave = async () => {
    if (!selectedTask) return;
    setTasksLoading(true);
    try {
      // Step 2: Band bo‘lsa screenshot va izoh bilan statusni o‘zgartirish
      if (step === 2 && screenshot && comment) {
        const formData = new FormData();
        formData.append('status', 'jarayonda');
        formData.append('comments', comment);
        formData.append('screenshot', screenshot);
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } else if (step === 1 && brandStatus === 'ok') {
        // Bo'ladi tugmasi bosilganda statusni jarayonga o‘tkazish
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'jarayonda',
            comments: 'Tekshiruvdan o‘tdi'
          })
        });
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert('Saqlashda xatolik: ' + err.message);
    }
    setTasksLoading(false);
  };

  // Profil kartasi (zamonaviy UI)
  const renderProfile = () => (
    <div className="profile-card-modern">
      <div className="profile-avatar-wrap">
        <label className="avatar-upload">
          <img
            src={profile?.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"}
            alt="Avatar"
            className="avatar-img-modern"
          />
          <input type="file" onChange={handleAvatarChange} disabled={loading} />
        </label>
      </div>
      <div className="profile-info">
        <h2>{profile?.firstName} {profile?.lastName}</h2>
        <p className="profile-role">{profile?.role?.toUpperCase() || ''}</p>
        <p className="profile-balance">Balans: <b>{profile?.balance?.toLocaleString() || 0} so‘m</b></p>
      </div>
    </div>
  );

  // Sidebar (zamonaviy UI)
  const renderSidebar = () => (
    <aside className="sidebar-modern">
      <div className="sidebar-header-modern">
        <img src={profile?.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"} alt="User" className="avatar-modern" />
        <h3>{profile ? `${profile.firstName} ${profile.lastName}` : "Yuklanmoqda..."}</h3>
        <p className="balance-modern">Balans: {profile?.balance?.toLocaleString() || 0} so‘m</p>
      </div>
      <nav className="sidebar-nav-modern">
        <button onClick={() => setSection('profil')}>👤 Profil</button>
        <button onClick={() => setSection('tekshirish')}>🟦 Tekshirish</button>
        <button onClick={() => setSection('yangi')}>➕ Yangi ish</button>
        <button onClick={() => setSection('yurist')}>⚖️ Yurist bilan aloqa</button>
        <button className="logout-btn-modern" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>🚪 Chiqish</button>
      </nav>
    </aside>
  );

  // Yangi ishlar ro'yxati
  const renderTasks = () => (
    <div className="tasks-list">
      <h3>🟦 Tekshirishga yuborilgan ishlar</h3>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards">
          {tasks.map(task => (
            <div className="task-card" key={task._id}>
              <div>
                <b>ID:</b> {task._id.slice(-5).toUpperCase()}<br />
                <b>Ism:</b> {task.clientName} {task.clientSurname}<br />
                <b>Brend:</b> {task.brandName}
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
            <h4>Brendni tekshirish</h4>
            <p><b>Brend:</b> {selectedTask.brandName}</p>
            <button onClick={() => handleBrandStatus('ok')}>✅ Bo'ladi</button>
            <button onClick={() => handleBrandStatus('band')}>🚫 Band</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h4>Band — Screenshot va izoh</h4>
            <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files[0])} />
            <textarea placeholder="Izoh" value={comment} onChange={e => setComment(e.target.value)} style={{width:'100%',margin:'10px 0'}} />
            <button onClick={handleSave} disabled={!screenshot || !comment}>Yuborish</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h4>Natija saqlandi</h4>
            <button onClick={() => setShowModal(false)}>Yopish</button>
          </div>
        )}
      </div>
    </div>
  );

  // Yangi ish va yurist bilan aloqa uchun placeholder
  const renderSection = () => {
    if (section === 'tekshirish') return renderTasks();
    if (section === 'yangi') return (<div style={{padding:'30px'}}><h2>➕ Yangi ish (tez orada)</h2></div>);
    if (section === 'yurist') return (<div style={{padding:'30px'}}><h2>⚖️ Yurist bilan aloqa (tez orada)</h2></div>);
    return null;
  };

  return (
    <div className="dashboard-container-modern">
      {renderSidebar()}
      <div className="main-content-modern">
        {renderSection()}
        {renderModal()}
      </div>
    </div>
  );
}

export default TekshiruvchiDashboard;
