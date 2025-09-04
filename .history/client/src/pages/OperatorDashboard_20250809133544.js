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
  const [brandLogo, setBrandLogo] = useState('');
  const [brandStatus, setBrandStatus] = useState(''); // tekshiruvchidan natija
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
    setBrandLogo('');
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

  // Step-by-step state
  const [brandStep, setBrandStep] = useState(1); // 1: brend nomi, 2: natija kutish, 3: hujjatlar
  const [yuridikDocs, setYuridikDocs] = useState({
    mchjNomi: '', mchjManzili: '', stir: '', oked: '', xr: '', bank: '', mfo: '', logo: '', brandName: '', direktorPassport: ''
  });
  const [jismoniyDocs, setJismoniyDocs] = useState({
    passport: '', brandName: '', manzil: ''
  });
  const [docsStep, setDocsStep] = useState(1);
  const [currentJob, setCurrentJob] = useState(null); // ariza id

  // Brend nomi yuborish
  const sendBrandName = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ brandName, brandLogo, status: 'tekshiruvchi' })
      });
      if (!res.ok) throw new Error('Brend nomini yuborishda xatolik');
      const data = await res.json();
      setCurrentJob(data._id);
      setBrandStep(2); // natija kutish
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  // Tekshiruvchidan natijani olish (polling)
  useEffect(() => {
    let interval;
    if (brandStep === 2 && currentJob) {
      interval = setInterval(async () => {
        const res = await fetch(`http://localhost:5000/api/jobs/${currentJob}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const job = await res.json();
          if (job.status === 'band') {
            setBrandStatus('band');
            setBrandStep(1); // qayta nom so‘rash
            setBrandName('');
            setBrandLogo('');
            setCurrentJob(null);
            clearInterval(interval);
          } else if (job.status === 'bo‘sh' || job.status === 'hujjatlar') {
            setBrandStatus('bo‘sh');
            setBrandStep(3); // hujjatlar bosqichi
            clearInterval(interval);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [brandStep, currentJob, token]);

  // Hujjatlarni yuborish
  const sendDocs = async () => {
    setLoading(true);
    try {
      let body = { status: 'hujjatlar', personType };
      if (personType === 'yuridik') body.yuridikDocs = yuridikDocs;
      if (personType === 'jismoniy') body.jismoniyDocs = jismoniyDocs;
      await fetch(`http://localhost:5000/api/jobs/${currentJob}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      setBrandStep(1);
      setBrandName('');
      setBrandLogo('');
      setPersonType('');
      setYuridikDocs({ mchjNomi: '', mchjManzili: '', stir: '', oked: '', xr: '', bank: '', mfo: '', logo: '', brandName: '', direktorPassport: '' });
      setJismoniyDocs({ passport: '', brandName: '', manzil: '' });
      setCurrentJob(null);
      setDocsStep(1);
      alert('Hujjatlar yuborildi!');
    } catch (err) {
      alert('Hujjatlarni yuborishda xatolik: ' + err.message);
    }
    setLoading(false);
  };

  // Step 5: Brend va shaxs turi tanlanganda docs step boshlanadi
  useEffect(() => {
    if (step === 5 && personType) setDocsStep(1);
  }, [step, personType]);

  // Step-by-step docs form
  const renderDocsStep = () => {
    if (personType === 'yuridik') {
      const fields = [
        { key: 'mchjNomi', label: '1. MCHJ nomi' },
        { key: 'mchjManzili', label: '2. MCHJ manzili toʻliq' },
        { key: 'stir', label: '3. STIR' },
        { key: 'oked', label: '4. OKED' },
        { key: 'xr', label: '5. X/R' },
        { key: 'bank', label: '6. Bank va filial nomi' },
        { key: 'mfo', label: '7. MFO' },
        { key: 'logo', label: '8. Logo (fayl yoki link)' },
        { key: 'brandName', label: '9. Patentlanayotgan brand nomi' },
        { key: 'direktorPassport', label: '10. Direktor pasporti (fayl yoki link)' }
      ];
      const field = fields[docsStep-1];
      return (
        <div>
          <h4>{field.label}</h4>
          <input type="text" value={yuridikDocs[field.key]} onChange={e => setYuridikDocs(d => ({...d, [field.key]: e.target.value}))} />
          <div style={{marginTop:16}}>
            {docsStep > 1 && <button onClick={()=>setDocsStep(docsStep-1)}>Orqaga</button>}
            {docsStep < 10 && <button onClick={()=>setDocsStep(docsStep+1)} disabled={!yuridikDocs[field.key]}>Keyingi</button>}
            {docsStep === 10 && <button onClick={handleSave} disabled={!yuridikDocs[field.key]}>Yuborish</button>}
          </div>
        </div>
      );
    } else if (personType === 'jismoniy') {
      const fields = [
        { key: 'passport', label: '1. Pasport (oldi-orqa)' },
        { key: 'brandName', label: '2. Brand nomi to‘liq' },
        { key: 'manzil', label: '3. Yashash manzili to‘liq' }
      ];
      const field = fields[docsStep-1];
      return (
        <div>
          <h4>{field.label}</h4>
          <input type="text" value={jismoniyDocs[field.key]} onChange={e => setJismoniyDocs(d => ({...d, [field.key]: e.target.value}))} />
          <div style={{marginTop:16}}>
            {docsStep > 1 && <button onClick={()=>setDocsStep(docsStep-1)}>Orqaga</button>}
            {docsStep < 3 && <button onClick={()=>setDocsStep(docsStep+1)} disabled={!jismoniyDocs[field.key]}>Keyingi</button>}
            {docsStep === 3 && <button onClick={handleSave} disabled={!jismoniyDocs[field.key]}>Yuborish</button>}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedTask) return;
    setLoading(true);
    try {
      if (step === 5 && brandName && personType) {
        let body = { brandName, personType, status: 'tekshiruvchi', comments: 'Tekshiruvchiga yuborildi' };
        if (personType === 'yuridik') body.yuridikDocs = yuridikDocs;
        if (personType === 'jismoniy') body.jismoniyDocs = jismoniyDocs;
        const res = await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Statusni o‘zgartirishda xatolik');
      }
      // Step 4 yoki 6: faqat status va izoh saqlash
      else if (step === 4 && futureDate) {
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'kutilmoqda',
            comments: `Keyinroq: ${futureDate}`
          })
        });
      } else if (step === 6) {
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: 'tugatilgan',
            comments: 'Xizmatdan foydalanmaydi'
          })
        });
      }
      setShowModal(false);
      fetchTasks('yangi');
    } catch (err) {
      alert('Saqlashda xatolik: ' + err.message);
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

  // Yangi ishlar ro‘yxati (zamonaviy UI)
  const renderTasks = () => (
    <div className="tasks-list-modern">
      <h3>🟦 Yangi ishlar</h3>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards-modern">
          {tasks.map(task => (
            <div className="task-card-modern" key={task._id}>
              <div>
                <b>ID:</b> {task._id.slice(-5).toUpperCase()}<br />
                <b>Ism:</b> {task.clientName} {task.clientSurname}<br />
                <b>Status:</b> {task.status}
              </div>
              <button className="task-view-btn" onClick={() => openTaskModal(task)}>Ko‘rish</button>
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
            {personType && renderDocsStep()}
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

  // Yangi: Topbar (admin panel uslubida)
  const renderTopbar = () => (
    <nav className="topbar-modern">
      <div className="topbar-left">
        <img src="/favicon.ico" alt="Logo" className="topbar-logo" />
        <span className="topbar-title">Operator Panel</span>
      </div>
      <div className="topbar-tabs">
        <button className={selectedSection === 'profil' ? 'active' : ''} onClick={() => setSelectedSection('profil')}>👤 Profil</button>
        <button className={selectedSection === 'yangi' ? 'active' : ''} onClick={() => setSelectedSection('yangi')}>🟦 Yangi mijozlar</button>
        <button className={selectedSection === 'jarayonda' ? 'active' : ''} onClick={() => setSelectedSection('jarayonda')}>🟨 Jarayonda</button>
        <button className={selectedSection === 'tugatilgan' ? 'active' : ''} onClick={() => setSelectedSection('tugatilgan')}>✅ Tugatilgan</button>
      </div>
      <button className="logout-btn-modern" onClick={onLogout}>🚪 Chiqish</button>
    </nav>
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

  // STEP-BY-STEP OPERATOR UI (minimal, zamonaviy, faqat brend nomi va natija)
  const renderStepByStep = () => {
    if (brandStep === 1) {
      // Faqat brend nomi va logotip so‘rash
      return (
        <div className="step-box">
          <h3>Brend nomi va logotip</h3>
          <input type="text" placeholder="Brend nomi" value={brandName} onChange={e => setBrandName(e.target.value)} />
          <input type="text" placeholder="Logotip (link yoki fayl)" value={brandLogo} onChange={e => setBrandLogo(e.target.value)} />
          <button onClick={sendBrandName} disabled={!brandName || loading}>Tekshiruvchiga yuborish</button>
          {brandStatus === 'band' && <div className="error">Bu nom band! Yangi nom kiriting.</div>}
        </div>
      );
    }
    if (brandStep === 2) {
      // Tekshiruvchidan natija kutish
      return (
        <div className="step-box">
          <h3>Brend nomi tekshirilmoqda...</h3>
          <div className="loader" />
          <p>Iltimos, kuting...</p>
        </div>
      );
    }
    if (brandStep === 3) {
      // Hujjatlar bosqichi (faqat brend nomi bo‘sh bo‘lsa)
      return (
        <div className="step-box">
          <h3>Hujjatlarni to‘ldiring</h3>
          <select value={personType} onChange={e => setPersonType(e.target.value)}>
            <option value="">Shaxs turi</option>
            <option value="yuridik">Yuridik</option>
            <option value="jismoniy">Jismoniy</option>
          </select>
          {personType && renderDocsStep()}
          <button onClick={sendDocs} disabled={loading || !personType}>Hujjatlarni yuborish</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="operator-admin-wrapper">
      {renderTopbar()}
      <div className="operator-admin-main">
        <h2>Operator Step-by-Step</h2>
        {renderStepByStep()}
        {renderSection()}
      </div>
      {showModal && renderModal()}
    </div>
  );
}

export default OperatorDashboard;
