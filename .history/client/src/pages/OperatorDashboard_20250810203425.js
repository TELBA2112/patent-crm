import React, { useEffect, useState, useCallback } from 'react';
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
  const [yuridikDocs, setYuridikDocs] = useState({});
  const [jismoniyDocs, setJismoniyDocs] = useState({});
  const [docsStep, setDocsStep] = useState(1);
  const token = localStorage.getItem('token');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Profilni olishda xatolik');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      alert(err.message);
      onLogout();
    }
  }, [token, onLogout]);

  const fetchTasks = useCallback(async (status) => {
    setTasksLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      alert('Ishlarni olishda xatolik: ' + err.message);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedSection === 'profil') {
      fetchProfile();
    } else if (['yangi', 'jarayonda', 'tugatilgan'].includes(selectedSection)) {
      fetchTasks(selectedSection);
    }
  }, [selectedSection, fetchProfile, fetchTasks]);

  useEffect(() => {
    let timer;
    if (showPhone && phoneTimer > 0) {
      timer = setTimeout(() => setPhoneTimer(t => t - 1), 1000);
    } else if (showPhone && phoneTimer === 0) {
      setShowPhone(false);
      // setStep(2); // Avtomatik keyingi qadamga o'tish
    }
    return () => clearTimeout(timer);
  }, [showPhone, phoneTimer]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setStep(1);
    setShowPhone(false);
    setPhoneTimer(10);
    setCallResult('');
    setClientIntent('');
    setFutureDate('');
    setBrandName('');
    setBrandLogo('');
    setPersonType('');
    setDocsStep(1);
    setYuridikDocs({});
    setJismoniyDocs({});
  };

  const handleShowPhone = () => {
    setShowPhone(true);
    setPhoneTimer(10);
  };

  const handleCallResultSubmit = async () => {
    if (callResult === 'boglandi') {
      setStep(2);
    } else {
      try {
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'aloqa_uzildi', callResult })
        });
        alert('Status yangilandi.');
        setShowModal(false);
        fetchTasks(selectedSection);
      } catch (err) {
        alert('Xatolik: ' + err.message);
      }
    }
  };

  const handleClientIntentSubmit = async () => {
    if (clientIntent === 'qildirmoqchi') {
      setStep(3);
    } else if (clientIntent === 'keyinroq') {
      if (!futureDate) {
        alert('Iltimos, sanani kiriting.');
        return;
      }
      try {
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'keyinroq', futureDate })
        });
        alert('Status yangilandi.');
        setShowModal(false);
        fetchTasks(selectedSection);
      } catch (err) {
        alert('Xatolik: ' + err.message);
      }
    } else {
      try {
        await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'rad_etildi' })
        });
        alert('Status yangilandi.');
        setShowModal(false);
        fetchTasks(selectedSection);
      } catch (err) {
        alert('Xatolik: ' + err.message);
      }
    }
  };

  const sendBrandForReview = async () => {
    setLoading(true);
    try {
      // **MUHIM O'ZGARTIRISH:** `fetch` chaqiruviga `method`, `headers` va `body` qo'shildi.
      const res = await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}/send-for-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ brandName }),
      });
      
      // ... qolgan kod
    } catch (err) {
      // ...
    } finally {
      setLoading(false);
    }
  };

  const sendDocs = async () => {
    setLoading(true);
    try {
      const payload = {
        personType,
        status: 'hujjatlar_yuborildi',
      };
      if (personType === 'yuridik') {
        payload.yuridikDocs = yuridikDocs;
      } else {
        payload.jismoniyDocs = jismoniyDocs;
      }
      await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      alert('Hujjatlar yuborildi!');
      setShowModal(false);
      fetchTasks(selectedSection);
    } catch (err) {
      alert('Hujjatlar yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const renderDocsStep = () => {
    if (personType === 'yuridik') {
      const fields = [
        { key: 'mchjNomi', label: '1. MCHJ nomi to‘liq' },
        { key: 'mchjManzili', label: '2. MCHJ manzili to‘liq' },
        { key: 'stir', label: '3. STIR' },
        { key: 'oked', label: '4. OKED' },
        { key: 'xr', label: '5. X/R' },
        { key: 'bank', label: '6. Bank nomi va filiali' },
        { key: 'mfo', label: '7. MFO' },
        { key: 'logo', label: '8. Logo (fayl biriktirish)' },
        { key: 'brandName', label: '9. Patentlanayotgan brend nomi' },
        { key: 'direktorPassport', label: '10. Direktor pasporti (fayl biriktirish)' }
      ];
      const field = fields[docsStep - 1];
      return (
        <div className="docs-step-container">
          <h4>{field.label}</h4>
          <input
            type="text"
            placeholder={field.label}
            value={yuridikDocs[field.key] || ''}
            onChange={e => setYuridikDocs({ ...yuridikDocs, [field.key]: e.target.value })}
          />
          <div className="docs-nav-buttons">
            {docsStep > 1 && <button onClick={() => setDocsStep(docsStep - 1)}>Orqaga</button>}
            {docsStep < 10 && <button onClick={() => setDocsStep(docsStep + 1)}>Keyingi</button>}
            {docsStep === 10 && <button onClick={sendDocs} disabled={loading}>Yuborish</button>}
          </div>
        </div>
      );
    } else if (personType === 'jismoniy') {
      const fields = [
        { key: 'passport', label: '1. Pasport rasmi (oldi va orqa)' },
        { key: 'brandName', label: '2. Brend nomi to‘liq' },
        { key: 'manzil', label: '3. Yashash manzili to‘liq' }
      ];
      const field = fields[docsStep - 1];
      return (
        <div className="docs-step-container">
          <h4>{field.label}</h4>
          <input
            type="text"
            placeholder={field.label}
            value={jismoniyDocs[field.key] || ''}
            onChange={e => setJismoniyDocs({ ...jismoniyDocs, [field.key]: e.target.value })}
          />
          <div className="docs-nav-buttons">
            {docsStep > 1 && <button onClick={() => setDocsStep(docsStep - 1)}>Orqaga</button>}
            {docsStep < 3 && <button onClick={() => setDocsStep(docsStep + 1)}>Keyingi</button>}
            {docsStep === 3 && <button onClick={sendDocs} disabled={loading}>Yuborish</button>}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderModalContent = () => {
    if (!selectedTask) return null;

    switch (step) {
      case 1:
        return (
          <div className="step-box">
            <h3>1-Bosqich: Mijoz bilan aloqaga chiqish</h3>
            <p>Mijoz: {selectedTask.clientName || 'Nomaʼlum'} {selectedTask.clientSurname || ''}</p>
            {!showPhone && (
              <button onClick={handleShowPhone} className="btn-primary">📞 Raqamni ko‘rish</button>
            )}
            {showPhone && (
              <div>
                <p className="phone-number">Telefon: {selectedTask.phone}</p>
                <p>Raqam {phoneTimer} soniyadan keyin berkitiladi.</p>
                <div className="call-result-buttons">
                  <button onClick={() => setCallResult('boglandi')} className={`btn-secondary ${callResult === 'boglandi' ? 'active' : ''}`}>✅ Bog‘landi</button>
                  <button onClick={() => setCallResult('javob_yoq')} className={`btn-secondary ${callResult === 'javob_yoq' ? 'active' : ''}`}>❌ Javob yo‘q</button>
                </div>
                <button onClick={handleCallResultSubmit} className="btn-primary" disabled={!callResult}>Keyingisi</button>
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="step-box">
            <h3>2-Bosqich: Mijozning maqsadi</h3>
            <div className="intent-buttons">
              <button onClick={() => setClientIntent('qildirmaydi')} className={`btn-secondary ${clientIntent === 'qildirmaydi' ? 'active' : ''}`}>0% Xizmatdan foydalanmaydi</button>
              <button onClick={() => setClientIntent('keyinroq')} className={`btn-secondary ${clientIntent === 'keyinroq' ? 'active' : ''}`}>⏳ Keyinroq qildirmoqchi</button>
              <button onClick={() => setClientIntent('qildirmoqchi')} className={`btn-secondary ${clientIntent === 'qildirmoqchi' ? 'active' : ''}`}>✅ Qildirmoqchi</button>
            </div>
            {clientIntent === 'keyinroq' && (
              <input type="date" value={futureDate} onChange={e => setFutureDate(e.target.value)} className="date-input" />
            )}
            <button onClick={handleClientIntentSubmit} className="btn-primary" disabled={!clientIntent || (clientIntent === 'keyinroq' && !futureDate)}>Keyingisi</button>
          </div>
        );
      case 3:
        return (
          <div className="step-box">
            <h3>3-Bosqich: Brend nomi</h3>
            <p>Mijozning brend nomini kiriting. U tekshiruvchiga yuboriladi.</p>
            <input
              type="text"
              placeholder="Brend nomi"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              className="brand-input"
            />
            <button onClick={sendBrandForReview} className="btn-primary" disabled={!brandName || loading}>Tekshiruvchiga yuborish</button>
          </div>
        );
      case 4:
        return (
          <div className="step-box">
            <h3>4-Bosqich: Hujjatlarni to‘plash</h3>
            <p>Brend nomi tekshirildi va tasdiqlandi. Endi mijozdan hujjatlarni to'plang.</p>
            <select value={personType} onChange={e => setPersonType(e.target.value)} className="person-type-select">
              <option value="">Shaxs turini tanlang</option>
              <option value="yuridik">Yuridik shaxs</option>
              <option value="jismoniy">Jismoniy shaxs</option>
            </select>
            {personType && renderDocsStep()}
          </div>
        );
      default:
        return null;
    }
  };

  const renderProfile = () => {
    return (
      <div className="profile-container">
        <h3>👤 Profil ma'lumotlari</h3>
        {profile ? (
          <div className="profile-info">
            <p><strong>Foydalanuvchi nomi:</strong> {profile.username}</p>
            <p><strong>Rol:</strong> {profile.role}</p>
            <p><strong>Ism:</strong> {profile.firstName}</p>
            <p><strong>Familiya:</strong> {profile.lastName}</p>
          </div>
        ) : (
          <p>Yuklanmoqda...</p>
        )}
      </div>
    );
  };
  
  const renderTasks = () => (
    <div className="tasks-list-modern">
      <h2>🟦 Yangi ishlar</h2>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards-modern">
          {tasks.map(task => (
            <div key={task._id} className="task-card-modern" onClick={() => handleTaskClick(task)}>
              <h3>{task.clientName || 'Nomaʼlum'} {task.clientSurname || ''}</h3>
              <p>Telefon: {task.phone}</p>
              <p>Holati: {task.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="operator-admin-wrapper">
      <SidebarOperator current={selectedSection} setCurrent={setSelectedSection} onLogout={onLogout} />
      <div className="operator-admin-main">
        {selectedSection === 'profil' && renderProfile()}
        {['yangi', 'jarayonda', 'tugatilgan'].includes(selectedSection) && renderTasks()}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            <h2>Vazifa #{selectedTask._id.slice(-5)}</h2>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorDashboard;