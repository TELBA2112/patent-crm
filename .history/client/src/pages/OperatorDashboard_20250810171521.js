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
  const [phoneTimer, setPhoneTimer] = useState(10);
  const [callResult, setCallResult] = useState('');
  const [clientIntent, setClientIntent] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandStatus, setBrandStatus] = useState('');
  const [personType, setPersonType] = useState('');
  const token = localStorage.getItem('token');

  // Profilni olish
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Profilni olishda xatolik');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
        alert(err.message);
        onLogout();
      }
    };
    fetchProfile();
  }, [token, onLogout]);

  // Vazifalarni olish
  useEffect(() => {
    if (selectedSection === 'yangi' || selectedSection === 'boglandi') {
      const fetchTasks = async () => {
        setTasksLoading(true);
        try {
          const res = await fetch(`http://localhost:5000/api/jobs?status=${selectedSection}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!res.ok) {
            throw new Error('Ishlarni yuklashda xatolik');
          }
          const data = await res.json();
          setTasks(data);
        } catch (err) {
          console.error('Vazifalarni olishda xatolik:', err);
          alert('Vazifalarni yuklashda xatolik yuz berdi.');
        } finally {
          setTasksLoading(false);
        }
      };
      fetchTasks();
    }
  }, [selectedSection, token]);

  // Telefon raqam vaqti
  useEffect(() => {
    if (showPhone && phoneTimer > 0) {
      const timer = setTimeout(() => {
        setPhoneTimer(phoneTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (phoneTimer === 0) {
      setShowPhone(false);
    }
  }, [showPhone, phoneTimer]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setStep(1);
    setShowModal(true);
  };

  const handleStep1Submit = async () => {
    if (!selectedTask || !callResult) return;
    setLoading(true);
    try {
      const updateData = {
        status: callResult === 'boglandi' ? 'boglandi' : 'yangi',
        comments: callResult,
        assignedTo: profile._id,
      };

      if (callResult === 'boglandi' && clientIntent === 'keyinroq' && futureDate) {
        // Keyinroq uchun yangi ish yaratish yoki mavjudini yangilash
        // Hozircha oddiy yangilash
        updateData.futureContactDate = futureDate;
      }

      const res = await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error('Statusni yangilashda xatolik');
      
      const updatedTask = await res.json();
      setSelectedTask(updatedTask);
      
      if (callResult === 'boglandi') {
        if (clientIntent === 'brend') {
          setStep(2);
        } else if (clientIntent === 'qiziqish') {
          setStep(3); // Hujjatlar bosqichi
        } else {
          alert('Status yangilandi!');
          setShowModal(false);
          // Vazifalar ro'yxatini qayta yuklash
          const resTasks = await fetch(`http://localhost:5000/api/jobs?status=${selectedSection}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const newTasks = await resTasks.json();
          setTasks(newTasks);
        }
      } else {
        alert('Status yangilandi!');
        setShowModal(false);
        // Vazifalar ro'yxatini qayta yuklash
        const resTasks = await fetch(`http://localhost:5000/api/jobs?status=${selectedSection}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const newTasks = await resTasks.json();
        setTasks(newTasks);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendBrandForReview = async () => {
    if (!brandName) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}/send-for-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ brandName }),
      });

      if (!res.ok) throw new Error('Brendni tekshiruvchiga yuborishda xatolik');
      const data = await res.json();
      setSelectedTask(data);
      alert('Brend tekshiruvchiga yuborildi!');
      setShowModal(false);
      // Vazifalar ro'yxatini yangilash
      const resTasks = await fetch(`http://localhost:5000/api/jobs?status=${selectedSection}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newTasks = await resTasks.json();
      setTasks(newTasks);

    } catch (err) {
      alert(err.message);
      setBrandStatus('band');
    } finally {
      setLoading(false);
    }
  };

  const sendDocs = async () => {
    if (!personType) return;
    // Hujjatlar yuklash logikasi
    setLoading(true);
    try {
      // Bu yerda hujjatlarni (fayllarni) yuklash mantiqi bo'ladi.
      // Hozircha oddiy API chaqiruvi bilan
      const res = await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}/upload-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ personType, documents: {} }), // Hujjat ma'lumotlari
      });

      if (!res.ok) throw new Error('Hujjatlarni yuborishda xatolik');
      const data = await res.json();
      setSelectedTask(data);
      alert('Hujjatlar yuborildi!');
      setShowModal(false);
      // Vazifalar ro'yxatini yangilash
      const resTasks = await fetch(`http://localhost:5000/api/jobs?status=${selectedSection}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const newTasks = await resTasks.json();
      setTasks(newTasks);

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    if (!selectedTask) return null;

    if (step === 1) {
      return (
        <div className="step-box">
          <h3>Mijoz bilan bog'lanish</h3>
          <p>Mijoz: {selectedTask.clientName} {selectedTask.clientSurname}</p>
          <button onClick={() => { setShowPhone(true); setPhoneTimer(10); }}>Telefon raqamni ko‘rsatish</button>
          {showPhone && (
            <div>
              <p className="phone-number">Telefon: {selectedTask.phone}</p>
              <p>Raqam {phoneTimer} soniyadan keyin berkitiladi.</p>
            </div>
          )}
          <label>
            Qo‘ng‘iroq natijasi:
            <select value={callResult} onChange={e => setCallResult(e.target.value)}>
              <option value="">Tanlang</option>
              <option value="boglandi">Bog‘landi</option>
              <option value="javob_yoq">Javob yo‘q</option>
              <option value="band">Band</option>
              <option value="notogri">Noto‘g‘ri raqam</option>
            </select>
          </label>
          {callResult === 'boglandi' && (
            <>
              <label>
                Mijozning maqsadi:
                <select value={clientIntent} onChange={e => setClientIntent(e.target.value)}>
                  <option value="">Tanlang</option>
                  <option value="qiziqish">Qiziqish bildirdi</option>
                  <option value="brend">Brend nomi bor</option>
                  <option value="keyinroq">Keyinroq bog‘lanish</option>
                </select>
              </label>
              {clientIntent === 'keyinroq' && (
                <input type="datetime-local" value={futureDate} onChange={e => setFutureDate(e.target.value)} />
              )}
            </>
          )}
          <button onClick={handleStep1Submit} disabled={!callResult || (clientIntent === 'keyinroq' && !futureDate)}>Keyingisi</button>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="step-box">
          <h3>Brend nomini kiriting</h3>
          <input type="text" placeholder="Brend nomi" value={brandName} onChange={e => setBrandName(e.target.value)} />
          <button onClick={sendBrandForReview} disabled={!brandName || loading}>Tekshiruvchiga yuborish</button>
          {brandStatus === 'band' && <div className="error">Bu nom band! Yangi nom kiriting.</div>}
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="step-box">
          <h3>Hujjatlarni to‘ldiring</h3>
          <select value={personType} onChange={e => setPersonType(e.target.value)}>
            <option value="">Shaxs turi</option>
            <option value="yuridik">Yuridik</option>
            <option value="jismoniy">Jismoniy</option>
          </select>
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
        {selectedSection === 'profil' && (
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
        )}
        {(selectedSection === 'yangi' || selectedSection === 'boglandi') && (
          <div className="tasks-container">
            <h3>{selectedSection === 'yangi' ? 'Yangi ishlar' : 'Bog‘langan ishlar'}</h3>
            {tasksLoading ? (
              <div className="loader" />
            ) : (
              <ul>
                {tasks.length > 0 ? (
                  tasks.map(task => (
                    <li key={task._id} onClick={() => handleTaskClick(task)}>
                      {task.clientName} - {task.phone}
                    </li>
                  ))
                ) : (
                  <p>Hozircha ishlar mavjud emas.</p>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowModal(false)}>&times;</span>
            <h2>Vazifa #{selectedTask.jobNo}</h2>
            {renderCurrentStep()}
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorDashboard;