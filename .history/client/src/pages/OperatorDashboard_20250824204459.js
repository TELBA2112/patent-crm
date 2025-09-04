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
  const [phoneTimer, setPhoneTimer] = useState(10);
  const [callResult, setCallResult] = useState('');
  const [clientIntent, setClientIntent] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [brandName, setBrandName] = useState('');
  const [personType, setPersonType] = useState('');
  const token = localStorage.getItem('token');

  // Profil ma'lumotlarini olish
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

  // Ishlarni olish - yangilangan status filterlari bilan
  const fetchTasks = useCallback(async (section) => {
    setTasksLoading(true);
    let status;
    
    // Bo'limga qarab status filterini o'zgartirish
    switch(section) {
      case 'yangi':
        // Yangi va tekshiruvchi rad etgan ishlar
        status = 'yangi,returned_to_operator';
        break;
      case 'jarayonda':
        // Jarayonda (bajarilmoqda), tekshiruvchiga yuborilgan, tasdiqlangan va hujjat kutilayotgan ishlar
        status = 'bajarilmoqda,brand_in_review,approved,documents_pending';
        break;
      case 'tugatilgan':
        // Bajarilgan va tugatilgan ishlar
        status = 'bajarildi,finished';
        break;
      default:
        status = 'yangi';
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      
      // Qo'shimcha ma'lumot bilan ishlarni boyitish
      const tasks = data.map(task => {
        const taskWithMeta = {...task};
        
        // Qaytarilgan ishlarni alohida belgilash
        if (task.status === 'returned_to_operator') {
          taskWithMeta.isReturned = true;
        }
        
        // Brend tekshirilayotgan ishlarni ko'rsatish
        if (task.status === 'brand_in_review') {
          taskWithMeta.isInReview = true;
        }
        
        // Tasdiqlangan ishlarni ko'rsatish
        if (task.status === 'approved' || task.status === 'documents_pending') {
          taskWithMeta.isApproved = true;
        }
        
        return taskWithMeta;
      });
      
      setTasks(tasks);
    } catch (err) {
      alert('Ishlarni olishda xatolik: ' + err.message);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [token]);

  // Brendni tekshiruvchiga yuborish
  const sendBrandForReview = async () => {
    if (!brandName) {
      alert('Iltimos, brend nomini kiriting.');
      return;
    }
    if (!selectedTask?._id) {
      console.error('Tanlangan ish ID si yo`q:', selectedTask);
      alert('Xatolik: Ish tanlanmagan');
      return;
    }
    setLoading(true);
    console.log('Brend yuborilmoqda:', { jobId: selectedTask._id, brandName });
    try {
      // Endpoint manzilini to'g'rilash - jobs dan job-actions ga o'zgartirish va PATCH o'rniga POST ishlatish
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/send-for-review`, {
        method: 'POST',  // PATCH emas POST
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ brandName })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server javobi:', errorText);
        throw new Error(`Brendni yuborishda xatolik: ${res.status} - ${errorText}`);
      }
      const data = await res.json();
      console.log('Brend yuborildi:', data);
      alert('Brend tekshiruvchiga muvaffaqiyatli yuborildi!');
      setShowModal(false);
      fetchTasks(selectedSection);
    } catch (err) {
      console.error('Frontend xatosi:', err);
      alert('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bo‘lim o‘zgarishi yoki dastlabki yuklash
  useEffect(() => {
    if (selectedSection === 'profil') {
      fetchProfile();
    } else if (['yangi', 'jarayonda', 'tugatilgan'].includes(selectedSection)) {
      fetchTasks(selectedSection);
    }
  }, [selectedSection, fetchProfile, fetchTasks]);

  // Telefon raqami ko‘rinishi uchun taymer
  useEffect(() => {
    let timer;
    if (showPhone && phoneTimer > 0) {
      timer = setTimeout(() => setPhoneTimer(t => t - 1), 1000);
    } else if (showPhone && phoneTimer === 0) {
      setShowPhone(false);
    }
    return () => clearTimeout(timer);
  }, [showPhone, phoneTimer]);

  // Ishni tanlash - tekshiruvdan qaytgan ishlar uchun to'g'ri bosqichni belgilash
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    
    // Brend tasdiqlangan bo'lsa, 4-bosqichga o'tish (hujjatlar bosqichi)
    if (task.status === 'approved' || task.status === 'documents_pending') {
      setStep(4);
      console.log('Brend tasdiqlangan, 4-bosqich: hujjatlar bosqichiga o\'tildi');
    } else {
      setStep(1);
      console.log('Yangi ish, 1-bosqich: qo\'ng\'iroq bosqichi');
    }
    
    setShowPhone(false);
    setPhoneTimer(10);
    setCallResult('');
    setClientIntent('');
    setFutureDate('');
    
    // Agar brend tasdiqlangan bo'lsa, brend nomini kiritish kerak emas
    if (task.brandName) {
      setBrandName(task.brandName);
    } else {
      setBrandName('');
    }
    
    setPersonType(task.personType || '');
  };

  // Telefon raqamini ko‘rsatish
  const handleShowPhone = () => {
    setShowPhone(true);
    setPhoneTimer(10);
  };

  // Qo‘ng‘iroq natijasini yuborish
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

  // Mijoz niyatini yuborish
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
        alert('Ish keyinroqqa o‘tkazildi.');
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
          body: JSON.stringify({ status: 'rejected', reason: 'Mijoz xizmatdan voz kechdi' })
        });
        alert('Ish rad etildi.');
        setShowModal(false);
        fetchTasks(selectedSection);
      } catch (err) {
        alert('Xatolik: ' + err.message);
      }
    }
  };

  // Hujjat yig‘ish qadamlarini ko‘rsatish
  const renderDocsStep = () => {
    return (
      <div className="docs-step">
        <p>Hujjatlarni yuklash: {personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}</p>
        <p>Bu funksiya hali to‘liq amalga oshirilmagan.</p>
      </div>
    );
  };

  // Modal oynasi kontentini ko'rsatish
  const renderModalContent = () => {
    // Task ma'lumotlarini ko'rsatish
    console.log('Modal content rendering for step:', step);
    console.log('Selected task status:', selectedTask?.status);
    
    switch (step) {
      case 1:
        return (
          <div className="step-box">
            <h3>1-Bosqich: Mijoz bilan bog‘lanish</h3>
            <p>Mijozning telefon raqamini ko‘rish uchun tugmani bosing:</p>
            <button onClick={handleShowPhone} className="show-phone-btn" disabled={showPhone}>
              Telefon raqamini ko‘rsatish
            </button>
            {showPhone && (
              <div>
                <p>Telefon: {selectedTask.phone} ({phoneTimer} sekund qoldi)</p>
              </div>
            )}
            <div className="call-result-buttons">
              <button
                onClick={() => setCallResult('boglandi')}
                className={`btn-secondary ${callResult === 'boglandi' ? 'active' : ''}`}
              >
                ✅ Bog‘landi
              </button>
              <button
                onClick={() => setCallResult('boglanmadi')}
                className={`btn-secondary ${callResult === 'boglanmadi' ? 'active' : ''}`}
              >
                ❌ Bog‘lanmadi
              </button>
            </div>
            <button
              onClick={handleCallResultSubmit}
              className="btn-primary"
              disabled={!callResult}
            >
              Keyingisi
            </button>
          </div>
        );
      case 2:
        return (
          <div className="step-box">
            <h3>2-Bosqich: Mijozning niyati</h3>
            <p>Mijozning xizmatga qiziqishini aniqlang:</p>
            <div className="intent-buttons">
              <button
                onClick={() => setClientIntent('qildirmaydi')}
                className={`btn-secondary ${clientIntent === 'qildirmaydi' ? 'active' : ''}`}
              >
                0% Xizmatdan foydalanmaydi
              </button>
              <button
                onClick={() => setClientIntent('keyinroq')}
                className={`btn-secondary ${clientIntent === 'keyinroq' ? 'active' : ''}`}
              >
                ⏳ Keyinroq qildirmoqchi
              </button>
              <button
                onClick={() => setClientIntent('qildirmoqchi')}
                className={`btn-secondary ${clientIntent === 'qildirmoqchi' ? 'active' : ''}`}
              >
                ✅ Qildirmoqchi
              </button>
            </div>
            {clientIntent === 'keyinroq' && (
              <input
                type="date"
                value={futureDate}
                onChange={e => setFutureDate(e.target.value)}
                className="date-input"
              />
            )}
            <button
              onClick={handleClientIntentSubmit}
              className="btn-primary"
              disabled={!clientIntent || (clientIntent === 'keyinroq' && !futureDate)}
            >
              Keyingisi
            </button>
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
            <button
              onClick={sendBrandForReview}
              className="btn-primary"
              disabled={!brandName || loading}
            >
              Tekshiruvchiga yuborish
            </button>
          </div>
        );
      case 4:
        return (
          <div className="step-box">
            <h3>4-Bosqich: Hujjatlarni to'plash</h3>
            {selectedTask.status === 'approved' || selectedTask.status === 'documents_pending' ? (
              <p className="approved-status">✅ Brend nomi "{selectedTask.brandName}" tasdiqlandi va hujjat yig'ishga tayyor.</p>
            ) : (
              <p>Brend nomi tekshirildi va tasdiqlandi. Endi mijozdan hujjatlarni to'plang.</p>
            )}
            
            <select
              value={personType}
              onChange={e => setPersonType(e.target.value)}
              className="person-type-select"
            >
              <option value="">Shaxs turini tanlang</option>
              <option value="yuridik">Yuridik shaxs</option>
              <option value="jismoniy">Jismoniy shaxs</option>
            </select>
            {personType && renderDocsStep()}
            
            {/* Yuristga yuborish qismi - operatorlar uchun ko'rsatilmaydi */}
            <div className="documents-completion-info">
              <p className="note-text">
                <strong>Eslatma:</strong> Hujjatlar to'planib bo'lgach, ish tekshiruvchi yoki admin tomonidan yuristga yuboriladi.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Profilni ko‘rsatish
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

  // Ishlarni ko'rsatish - yangilangan status indikatorlari bilan
  const renderTasks = () => (
    <div className="tasks-list-modern">
      <h2>
        {selectedSection === 'yangi' ? '🟦 Yangi ishlar' : 
         selectedSection === 'jarayonda' ? '🟨 Jarayondagi ishlar' : 
         '✅ Tugatilgan ishlar'}
      </h2>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards-modern">
          {tasks.map(task => (
            <div key={task._id} 
                 className={`task-card-modern 
                   ${task.isReturned ? 'returned-task' : ''} 
                   ${task.isInReview ? 'in-review-task' : ''}
                   ${task.isApproved ? 'approved-task' : ''}`} 
                 onClick={() => handleTaskClick(task)}>
              <h3>{task.clientName || 'Nomaʼlum'} {task.clientSurname || ''}</h3>
              <p>ID: {task.jobId || task._id.slice(-5)}</p>
              <p>Telefon: {task.phone}</p>
              <p>Brend: {task.brandName || '—'}</p>
              <p>Holati: 
                <span className={`status-label status-${task.status}`}>
                  {task.status === 'yangi' ? 'Yangi' :
                   task.status === 'returned_to_operator' ? 'Qaytarildi' :
                   task.status === 'brand_in_review' ? 'Tekshirilmoqda' :
                   task.status === 'approved' ? 'Tasdiqlangan' : 
                   task.status === 'documents_pending' ? 'Hujjat kutilmoqda' :
                   task.status === 'bajarildi' ? 'Bajarildi' :
                   task.status === 'finished' ? 'Tugatilgan' :
                   task.status}
                </span>
              </p>
              {task.isReturned && <p className="return-reason">⚠️ Brend tekshiruvidan qaytdi</p>}
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