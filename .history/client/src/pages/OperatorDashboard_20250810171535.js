import React, { useEffect, useState } from 'react';
import './OperatorDashboard.css';
import SidebarOperator from './components/SidebarOperator';

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

  // Yangi: Ishni tekshiruvchiga yuborish
  const handleAssign = async (jobId) => {
    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ish tekshiruvchiga yuborildi');
      fetchTasks(selectedSection);
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
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
        const data = await res.json();
        setBrandStatus(data.status);
        if (data.status === 'bo‘sh') setBrandStep(3); // hujjatlar
        if (data.status === 'band') setBrandStep(1); // qayta nomi so‘rash
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [brandStep, currentJob, token]);

  // Hujjatlarni yuborish
  const sendDocs = async () => {
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/jobs/${currentJob}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          personType,
          yuridikDocs: personType === 'yuridik' ? yuridikDocs : {},
          jismoniyDocs: personType === 'jismoniy' ? jismoniyDocs : {},
          status: 'jarayonda'
        })
      });
      alert('Hujjatlar yuborildi!');
      setStep(1);
    } catch (err) {
      alert('Hujjatlar yuborishda xatolik');
    }
    setLoading(false);
  };

  // Hujjatlar step-by-step render
  const renderDocsStep = () => {
    if (personType === 'yuridik') {
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
      const field = fields[docsStep - 1];
      return (
        <div>
          <h4>{field.label}</h4>
          <input
            type="text"
            value={yuridikDocs[field.key]}
            onChange={e => setYuridikDocs({ ...yuridikDocs, [field.key]: e.target.value })}
          />
          <div style={{ marginTop: 16 }}>
            {docsStep > 1 && <button onClick={() => setDocsStep(docsStep - 1)}>Orqaga</button>}
            {docsStep < 10 && <button onClick={() => setDocsStep(docsStep + 1)}>Keyingi</button>}
          </div>
        </div>
      );
    } else if (personType === 'jismoniy') {
      const fields = [
        { key: 'passport', label: '1. Pasport (oldi-orqa)' },
        { key: 'brandName', label: '2. Brand nomi to‘liq' },
        { key: 'manzil', label: '3. Yashash manzili to‘liq' }
      ];
      const field = fields[docsStep - 1];
      return (
        <div>
          <h4>{field.label}</h4>
          <input
            type="text"
            value={jismoniyDocs[field.key]}
            onChange={e => setJismoniyDocs({ ...jismoniyDocs, [field.key]: e.target.value })}
          />
          <div style={{ marginTop: 16 }}>
            {docsStep > 1 && <button onClick={() => setDocsStep(docsStep - 1)}>Orqaga</button>}
            {docsStep < 3 && <button onClick={() => setDocsStep(docsStep + 1)}>Keyingi</button>}
          </div>
        </div>
      );
    }
    return null;
  };

  // Saqlash funksiyasi
  const handleSave = () => {
    // TODO: Saqlash logikasi
  };

  // Modal render (step-by-step)
  const renderModal = () => selectedTask && (
    <div className="modal">
      <div className="modal-content">
        <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
        <h3>{selectedTask.phone} (ID: {selectedTask._id.slice(-5)})</h3>
        {step === 1 && (
          <div>
            <h4>1. Telefon raqamini ko‘rish</h4>
            <button className="show-phone-btn" onClick={handleShowPhone}>📞 Raqamni ko‘rish</button>
            {showPhone && (
              <div>
                <p className="phone-number">{selectedTask.phone}</p>
                <p>Qolgan vaqt: {phoneTimer} sekund</p>
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div>
            <h4>2. Qo‘ng‘iroq natijasi</h4>
            <button onClick={() => handleCallResult('answered')}>✅ Bog‘landi</button>
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

  // Sidebar (admin panel uslubida, chapda)
  const renderSidebar = () => (
    <aside className="sidebar-admin">
      <h2 className="sidebar-title">📝 Operator Panel</h2>
      <ul className="sidebar-list">
        <li className={selectedSection === 'profil' ? 'active' : ''} onClick={() => setSelectedSection('profil')}>
          <span role="img" aria-label="profil">👤</span> Profil
        </li>
        <li className={selectedSection === 'yangi' ? 'active' : ''} onClick={() => setSelectedSection('yangi')}>
          <span role="img" aria-label="yangi">🟦</span> Yangi mijozlar
        </li>
        <li className={selectedSection === 'jarayonda' ? 'active' : ''} onClick={() => setSelectedSection('jarayonda')}>
          <span role="img" aria-label="jarayonda">🟨</span> Jarayonda
        </li>
        <li className={selectedSection === 'tugatilgan' ? 'active' : ''} onClick={() => setSelectedSection('tugatilgan')}>
          <span role="img" aria-label="tugatilgan">✅</span> Tugatilgan
        </li>
        <li onClick={onLogout}>
          <span role="img" aria-label="chiqish">🚪</span> Chiqish
        </li>
      </ul>
    </aside>
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

  // Yangi: Ishlar ro'yxatini render qilish (yuborish tugmasi bilan)
  const renderTasks = () => (
    <div className="tasks-list-modern">
      <h2>🟦 Yangi ishlar</h2>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards-modern">
          {tasks.map(task => (
            <div key={task._id} className="task-card-modern">
              <h3>{task.phone}</h3>
              <p>Status: {task.status}</p>
              {task.status === 'pending' && (
                <button onClick={() => handleAssign(task._id)}>
                  Tekshiruvchiga yuborish
                </button>
              )}
              {task.status === 'rejected' && <p>Sabab: {task.history[task.history.length - 1]?.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
      <SidebarOperator current={selectedSection} setCurrent={setSelectedSection} onLogout={onLogout} />
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