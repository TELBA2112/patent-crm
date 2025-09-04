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
  const [loading, setLoading] = useState(false);
  const [docsStep, setDocsStep] = useState(1);
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

  // Yangi: Review yuborish
  const handleReview = async (status, reason) => {
    try {
      await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, reason: comment })
      });
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert('Review yuborishda xatolik');
    }
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

  // Avatar upload funksiyasi (Operator panelidan)
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile) return;
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

  // Yangi ishlar ro'yxati
  const renderTasks = () => (
    <div className="tasks-list">
      <h3>🟦 Tekshirishga yuborilgan ishlar</h3>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards-modern">
          {tasks.map(task => (
            <div className="task-card-modern" key={task._id}>
              <div>
                <b>ID:</b> {task._id.slice(-5).toUpperCase()}<br />
                <b>Brend:</b> {task.brandName}<br />
                <b>Status:</b> {task.status}
              </div>
              <button onClick={() => openTaskModal(task)}>Tekshirish</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Hujjatlar step-by-step render
  const renderDocsStep = () => {
    if (selectedTask.personType === 'yuridik' && selectedTask.yuridikDocs) {
      const fields = [
        { key: 'mchjNomi', label: '1. MCHJ nomi to‘liq' },
        { key: 'mchjManzili', label: '2. MCHJ manzili to‘liq' },
        { key: 'stir', label: '3. STIR' },
        { key: 'oked', label: '4. OKED' },
        { key: 'xr', label: '5. X/R' },
        { key: 'bank', label: '6. Bank nomi' },
        { key: 'mfo', label: '7. MFO' },
        { key: 'logo', label: '8. Logo (fayl yoki link)' },
        { key: 'brandName', label: '9. Patentlanayotgan brand nomi' },
        { key: 'direktorPassport', label: '10. Direktor pasporti (fayl yoki link)' }
      ];
      const field = fields[docsStep-1];
      return (
        <div>
          <h4>{field.label}</h4>
          <div className="docs-value">{selectedTask.yuridikDocs[field.key]}</div>
          <div style={{marginTop:16}}>
            {docsStep > 1 && <button onClick={()=>setDocsStep(docsStep-1)}>Orqaga</button>}
            {docsStep < 10 && <button onClick={()=>setDocsStep(docsStep+1)}>Keyingi</button>}
          </div>
        </div>
      );
    } else if (selectedTask.personType === 'jismoniy' && selectedTask.jismoniyDocs) {
      const fields = [
        { key: 'passport', label: '1. Pasport (oldi-orqa)' },
        { key: 'brandName', label: '2. Brand nomi to‘liq' },
        { key: 'manzil', label: '3. Yashash manzili to‘liq' }
      ];
      const field = fields[docsStep-1];
      return (
        <div>
          <h4>{field.label}</h4>
          <div className="docs-value">{selectedTask.jismoniyDocs[field.key]}</div>
          <div style={{marginTop:16}}>
            {docsStep > 1 && <button onClick={()=>setDocsStep(docsStep-1)}>Orqaga</button>}
            {docsStep < 3 && <button onClick={()=>setDocsStep(docsStep+1)}>Keyingi</button>}
          </div>
        </div>
      );
    }
    return null;
  };

  // STEP-BY-STEP TEKSHIRUVCHI UI (minimal, faqat brend nomi tekshirish)
  const renderStepByStep = () => {
    if (section === 'tekshirish') {
      return (
        <div className="step-box">
          <h3>Tekshirishga yuborilgan brendlar</h3>
          {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
            <div className="task-cards-modern">
              {tasks.map(task => (
                <div className="task-card-modern" key={task._id}>
                  <div>
                    <b>ID:</b> {task._id.slice(-5).toUpperCase()}<br />
                    <b>Brend:</b> {task.brandName}<br />
                    <b>Status:</b> {task.status}
                  </div>
                  <button onClick={() => openTaskModal(task)}>Tekshirish</button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Step-by-step modal faqat brend nomi uchun
  const renderModal = () => selectedTask && (
    <div className="modal">
      <div className="modal-content">
        <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
        <h4>Brend nomini tekshirish</h4>
        <p><b>Brend:</b> {selectedTask.brandName}</p>
        <input type="text" placeholder="Sabab/izoh" value={comment} onChange={e => setComment(e.target.value)} />
        <button onClick={() => handleReview('rejected', comment)} disabled={loading}>🚫 Band</button>
        <button onClick={() => handleReview('approved', '')} disabled={loading}>✅ Bo‘sh</button>
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

  // Yangi: Topbar (admin panel uslubida)
  const renderTopbar = () => (
    <nav className="topbar-modern">
      <div className="topbar-left">
        <img src="/favicon.ico" alt="Logo" className="topbar-logo" />
        <span className="topbar-title">Tekshiruvchi Panel</span>
      </div>
      <div className="topbar-tabs">
        <button className={section === 'profil' ? 'active' : ''} onClick={() => setSection('profil')}>👤 Profil</button>
        <button className={section === 'tekshirish' ? 'active' : ''} onClick={() => setSection('tekshirish')}>🟦 Tekshirish</button>
        <button className={section === 'yangi' ? 'active' : ''} onClick={() => setSection('yangi')}>➕ Yangi ish</button>
        <button className={section === 'yurist' ? 'active' : ''} onClick={() => setSection('yurist')}>⚖️ Yurist bilan aloqa</button>
      </div>
      <button className="logout-btn-modern" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>🚪 Chiqish</button>
    </nav>
  );

  return (
    <div className="tekshiruvchi-admin-wrapper">
      {renderTopbar()}
      <div className="tekshiruvchi-admin-main">
        <h2>Tekshiruvchi Step-by-Step</h2>
        {renderStepByStep()}
        {showModal && renderModal()}
      </div>
    </div>
  );
}
// Eski kod...

const handleBrandCheck = (busy, image, comment) => {
  fetch(`/api/jobs/${selectedTask._id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status: busy ? 'rejected' : 'approved', reason: comment, image }),
    headers: { Authorization: `Bearer ${token}` }
  });
};

const handleDocumentReview = (approved, error) => {
  fetch(`/api/jobs/${selectedTask._id}/review-documents`, {
    method: 'POST',
    body: JSON.stringify({ status: approved ? 'approved' : 'rejected', reason: error }),
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Modal da yangi options qo'shilgan

// Topbar menu yangilangan
const renderTopbar = () => (
  <nav>
    <button onClick={() => setSection('profil')}>Profil</button>
    <button onClick={() => setSection('brend-ready')}>Brend topshirishga tayyor</button>
    <button onClick={() => setSection('yurist')}>Yurist</button>
    <button onClick={() => setSection('yangi')}>Yangi ish</button>
  </nav>
);
export default TekshiruvchiDashboard;