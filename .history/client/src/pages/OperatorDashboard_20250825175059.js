import React, { useEffect, useState, useCallback } from 'react';
import './OperatorDashboard.css';
import SidebarOperator from './components/SidebarOperator';
import { mktuClasses, getRecommendedClasses } from '../utils/mktuData';

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
  const [selectedClasses, setSelectedClasses] = useState([]);
  
  // Add missing state variables for document collection
  const [docsStep, setDocsStep] = useState(1);
  const [yuridikDocs, setYuridikDocs] = useState({
    companyName: '',
    companyAddress: '',
    stir: '',
    oked: '',
    accountNumber: '',
    bankInfo: '',
    mfo: '',
    logo: null,
    patentBrandName: '',
    directorPassportImage: null
  });
  const [jismoniyDocs, setJismoniyDocs] = useState({
    passportImageFront: null, // Changed from passportImage to passportImageFront
    passportImageBack: null, // Added new field for back of passport
    fullBrandName: '',
    fullAddress: ''
  });
  
  const token = localStorage.getItem('token');
  const [activitySearch, setActivitySearch] = useState('');
  const [recommendedClasses, setRecommendedClasses] = useState([]);

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
        // Yangi, tekshiruvchi rad etgan va hujjatlari qaytarilgan ishlar
        status = 'yangi,returned_to_operator,documents_returned';
        break;
      case 'jarayonda':
        // Jarayonda (bajarilmoqda), tekshiruvchiga yuborilgan, tasdiqlangan va hujjat kutilayotgan ishlar
        status = 'bajarilmoqda,brand_in_review,approved,documents_pending,documents_submitted';
        break;
      case 'tugatilgan':
        // Bajarilgan va tugatilgan ishlar
        status = 'bajarildi,finished,to_lawyer,lawyer_processing,lawyer_completed';
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
    if (!selectedClasses || selectedClasses.length === 0) {
      alert('Iltimos, kamida bitta MKTU sinfini tanlang.');
      return;
    }
    if (!selectedTask?._id) {
      console.error('Tanlangan ish ID si yo`q:', selectedTask);
      alert('Xatolik: Ish tanlanmagan');
      return;
    }
    setLoading(true);
    console.log('Brend yuborilmoqda:', { jobId: selectedTask._id, brandName, classes: selectedClasses });
    try {
      // Endpoint manzilini to'g'rilash - jobs dan job-actions ga o'zgartirish va PATCH o'rniga POST ishlatish
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/send-for-review`, {
        method: 'POST',  // PATCH emas POST
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ brandName, classes: selectedClasses })
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
    
    // Status bo'yicha qaysi bosqichga o'tishni aniqlash
    if (task.status === 'approved' || task.status === 'documents_pending' || 
        task.status === 'documents_returned') {
      setStep(4);
      console.log('Hujjatlar bosqichiga o\'tildi');
    } else {
      setStep(1);
      console.log('Yangi ish, qo\'ng\'iroq bosqichi');
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
    
    // Agar task-da classes bo'lsa uni ham oldindan to'ldirish
    if (task.classes && Array.isArray(task.classes)) {
      setSelectedClasses(task.classes);
    } else {
      setSelectedClasses([]);
    }
    
    setPersonType(task.personType || '');
    
    // Agar brend tasdiqlangan bo'lsa, hujjatlarni oldindan to'ldirish
    if (task.status === 'approved' || task.status === 'documents_pending') {
      if (task.yuridikDocs) {
        setYuridikDocs(task.yuridikDocs);
      }
      if (task.jismoniyDocs) {
        setJismoniyDocs(task.jismoniyDocs);
      }
      
      // Hujjatlar bosqichini resetlash
      setDocsStep(1);
    }
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

  // Hujjatlar formasida keyingi bosqichga o'tish
  const goToNextDocsStep = () => {
    // Hozirgi bosqich ma'lumotlarini tekshirish
    if (personType === 'yuridik') {
      if (docsStep === 1 && !yuridikDocs.companyName) {
        return alert('MCHj nomini kiriting');
      } else if (docsStep === 2 && !yuridikDocs.companyAddress) {
        return alert('MCHj manzilini kiriting');
      } else if (docsStep === 3 && !yuridikDocs.stir) {
        return alert('STIR raqamini kiriting');
      }
      // Boshqa tekshirishlar...
      
      // Maksimal qadamlar sonidan oshib ketishni oldini olish
      if (docsStep < 10) {
        setDocsStep(prev => prev + 1);
      }
    } else if (personType === 'jismoniy') {
      if (docsStep === 1 && !jismoniyDocs.passportImageFront) {
        return alert('Passport old qismi rasmini yuklang');
      } else if (docsStep === 1 && !jismoniyDocs.passportImageBack) {
        return alert('Passport orqa qismi rasmini yuklang');
      } else if (docsStep === 2 && !jismoniyDocs.fullBrandName) {
        return alert('Brand nomini kiriting');
      }
      
      if (docsStep < 3) {
        setDocsStep(prev => prev + 1);
      }
    }
  };

  // Oldingi bosqichga qaytish
  const goToPrevDocsStep = () => {
    if (docsStep > 1) {
      setDocsStep(prev => prev - 1);
    }
  };

  // Forma ma'lumotlarini yangilash - yuridik shaxs uchun
  const handleYuridikDocsChange = (e) => {
    const { name, value } = e.target;
    setYuridikDocs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Forma ma'lumotlarini yangilash - jismoniy shaxs uchun
  const handleJismoniyDocsChange = (e) => {
    const { name, value } = e.target;
    setJismoniyDocs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fayl yuklash uchun
  const handleFileUpload = (e, type, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Fayl turi va hajmi tekshirish
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Faqat .jpg, .jpeg va .png formatdagi rasmlar qabul qilinadi');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Fayl hajmi 5MB dan oshmasligi kerak');
      e.target.value = '';
      return;
    }

    // Faylni o'qish va formaga qo'shish
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'yuridik') {
        setYuridikDocs(prev => ({
          ...prev,
          [fieldName]: reader.result
        }));
      } else {
        setJismoniyDocs(prev => ({
          ...prev,
          [fieldName]: reader.result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Hujjatlarni saqlash va tekshiruvchiga yuborish
  const saveDocsAndSendToReview = async () => {
    if (!selectedTask?._id) {
      return alert('Ish tanlanmagan');
    }

    try {
      setLoading(true);
      
      // Hujjatlar ma'lumotlarini yuborish
      const docsData = personType === 'yuridik' 
        ? { yuridikDocs } 
        : { jismoniyDocs };
      
      console.log('Yuborilayotgan ma\'lumotlar:', {
        personType,
        ...docsData
      });
      
      // Endpoint manzilini to'g'rilash
      const res = await fetch(`http://localhost:5000/api/jobs/${selectedTask._id}/upload-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          personType,
          ...docsData
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Hujjatlarni yuborishda xatolik: ${res.status} - ${errorText}`);
      }

      alert('Hujjatlar muvaffaqiyatli yuborildi!');
      setShowModal(false);
      fetchTasks(selectedSection);
    } catch (err) {
      console.error('Hujjatlarni yuborishda xatolik:', err);
      alert('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Yuridik shaxs hujjatlari bosqichlari
  const renderYuridikDocsStep = () => {
    switch (docsStep) {
      case 1:
        return (
          <div className="docs-form-step">
            <h4>1/10: MCHj nomi</h4>
            <input
              type="text"
              name="companyName"
              value={yuridikDocs.companyName}
              onChange={handleYuridikDocsChange}
              placeholder="MCHj nomini kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 2:
        return (
          <div className="docs-form-step">
            <h4>2/10: MCHj manzili</h4>
            <textarea
              name="companyAddress"
              value={yuridikDocs.companyAddress}
              onChange={handleYuridikDocsChange}
              placeholder="MCHj manzilini to'liq kiriting"
              className="docs-textarea"
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="docs-form-step">
            <h4>3/10: STIR</h4>
            <input
              type="text"
              name="stir"
              value={yuridikDocs.stir}
              onChange={handleYuridikDocsChange}
              placeholder="STIR raqamini kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 4:
        return (
          <div className="docs-form-step">
            <h4>4/10: OKED</h4>
            <input
              type="text"
              name="oked"
              value={yuridikDocs.oked}
              onChange={handleYuridikDocsChange}
              placeholder="OKED raqamini kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 5:
        return (
          <div className="docs-form-step">
            <h4>5/10: X/R (hisob raqami)</h4>
            <input
              type="text"
              name="accountNumber"
              value={yuridikDocs.accountNumber}
              onChange={handleYuridikDocsChange}
              placeholder="Hisob raqamini kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 6:
        return (
          <div className="docs-form-step">
            <h4>6/10: Bank ma'lumotlari</h4>
            <textarea
              name="bankInfo"
              value={yuridikDocs.bankInfo}
              onChange={handleYuridikDocsChange}
              placeholder="Bank nomi, filiali va manzili"
              className="docs-textarea"
              required
            />
          </div>
        );
      case 7:
        return (
          <div className="docs-form-step">
            <h4>7/10: MFO</h4>
            <input
              type="text"
              name="mfo"
              value={yuridikDocs.mfo}
              onChange={handleYuridikDocsChange}
              placeholder="MFO raqamini kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 8:
        return (
          <div className="docs-form-step">
            <h4>8/10: Logo</h4>
            <div className="file-upload-container">
              <label className="file-upload-label">
                <span>Logo yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'yuridik', 'logo')}
                  className="file-input"
                />
              </label>
              {yuridikDocs.logo && (
                <div className="file-preview">
                  <img src={yuridikDocs.logo} alt="Logo" width="100" />
                </div>
              )}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="docs-form-step">
            <h4>9/10: Patentlanayotgan brand nomi</h4>
            <input
              type="text"
              name="patentBrandName"
              value={yuridikDocs.patentBrandName}
              onChange={handleYuridikDocsChange}
              placeholder="Patentlanayotgan brand nomini kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 10:
        return (
          <div className="docs-form-step">
            <h4>10/10: Direktor pasport rasmi</h4>
            <div className="file-upload-container">
              <label className="file-upload-label">
                <span>Pasport rasmini yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'yuridik', 'directorPassportImage')}
                  className="file-input"
                />
              </label>
              {yuridikDocs.directorPassportImage && (
                <div className="file-preview">
                  <img src={yuridikDocs.directorPassportImage} alt="Direktor pasporti" width="100" />
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Jismoniy shaxs hujjatlari bosqichlari
  const renderJismoniyDocsStep = () => {
    switch (docsStep) {
      case 1:
        return (
          <div className="docs-form-step">
            <h4>1/3: Brand egasi pasport rasmi</h4>
            
            <div className="file-upload-container">
              <label className="file-upload-label">
                <span>Pasport old qismini yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'jismoniy', 'passportImageFront')}
                  className="file-input"
                />
              </label>
              {jismoniyDocs.passportImageFront && (
                <div className="file-preview">
                  <p>Old qismi:</p>
                  <img src={jismoniyDocs.passportImageFront} alt="Pasport old qismi" width="100" />
                </div>
              )}
            </div>

            <div className="file-upload-container">
              <label className="file-upload-label">
                <span>Pasport orqa qismini yuklash</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'jismoniy', 'passportImageBack')}
                  className="file-input"
                />
              </label>
              {jismoniyDocs.passportImageBack && (
                <div className="file-preview">
                  <p>Orqa qismi:</p>
                  <img src={jismoniyDocs.passportImageBack} alt="Pasport orqa qismi" width="100" />
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="docs-form-step">
            <h4>2/3: Brand nomi to'liq</h4>
            <input
              type="text"
              name="fullBrandName"
              value={jismoniyDocs.fullBrandName}
              onChange={handleJismoniyDocsChange}
              placeholder="Brand nomini to'liq kiriting"
              className="docs-input"
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="docs-form-step">
            <h4>3/3: Yashash manzili</h4>
            <textarea
              name="fullAddress"
              value={jismoniyDocs.fullAddress}
              onChange={handleJismoniyDocsChange}
              placeholder="Yashash manzilini to'liq kiriting"
              className="docs-textarea"
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Hujjatlar bosqichi nazorat tugmalarini ko'rsatish
  const renderDocsNavButtons = () => {
    const maxSteps = personType === 'yuridik' ? 10 : 3;
    const isLastStep = docsStep === maxSteps;
    
    return (
      <div className="docs-navigation">
        {docsStep > 1 && (
          <button type="button" onClick={goToPrevDocsStep} className="docs-nav-btn prev-btn">
            ⬅️ Orqaga
          </button>
        )}
        
        {!isLastStep ? (
          <button type="button" onClick={goToNextDocsStep} className="docs-nav-btn next-btn">
            Keyingisi ➡️
          </button>
        ) : (
          <button type="button" onClick={saveDocsAndSendToReview} className="docs-nav-btn submit-btn" disabled={loading}>
            {loading ? 'Saqlanmoqda...' : 'Saqlash va tekshiruvchiga yuborish'}
          </button>
        )}
      </div>
    );
  };

  // Hujjatlar yig'ish qadamlarini ko'rsatish - yangilangan
  const renderDocsStep = () => {
    if (!personType) {
      return (
        <div className="docs-step">
          <p>Iltimos, avval shaxs turini tanlang.</p>
        </div>
      );
    }

    return (
      <div className="docs-collection-form">
        {personType === 'yuridik' ? renderYuridikDocsStep() : renderJismoniyDocsStep()}
        {renderDocsNavButtons()}
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
            
            {renderClassSelection()}
            
            <button
              onClick={sendBrandForReview}
              className="btn-primary"
              disabled={!brandName || selectedClasses.length === 0 || loading}
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
            
            <div className="person-type-selection">
              <label>Shaxs turini tanlang:</label>
              <select
                value={personType}
                onChange={e => setPersonType(e.target.value)}
                className="person-type-select"
              >
                <option value="">Shaxs turini tanlang</option>
                <option value="yuridik">Yuridik shaxs</option>
                <option value="jismoniy">Jismoniy shaxs</option>
              </select>
            </div>
            
            {personType && renderDocsStep()}
            
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

  // Faoliyat turi bo'yicha sinflarni tavsiya qilish
  const handleActivitySearch = (e) => {
    const searchText = e.target.value;
    setActivitySearch(searchText);
    
    if (searchText.trim().length >= 3) {
      const recommended = getRecommendedClasses(searchText);
      setRecommendedClasses(recommended);
    } else {
      setRecommendedClasses([]);
    }
  };
  
  // Tavsiya qilingan sinfni tanlash
  const selectRecommendedClass = (classNumber) => {
    setSelectedClasses(prevClasses => {
      if (prevClasses.includes(classNumber)) {
        return prevClasses;
      } else {
        return [...prevClasses, classNumber];
      }
    });
  };
  
  // Barcha tavsiya qilingan sinflarni tanlash
  const selectAllRecommended = () => {
    if (recommendedClasses.length === 0) return;
    
    setSelectedClasses(prevClasses => {
      const newClasses = [...prevClasses];
      
      recommendedClasses.forEach(recommendedClass => {
        const classNumber = recommendedClass.classNumber;
        if (!newClasses.includes(classNumber)) {
          newClasses.push(classNumber);
        }
      });
      
      return newClasses;
    });
  };
  
  // MKTU sinflar tanlovi rendereri - yangilangan versiya
  const renderClassSelection = () => {
    const classes = Array.from({ length: 45 }, (_, i) => i + 1);
    
    return (
      <div className="class-selection">
        <p>MKTU sinflarini tanlang (maksimum 45):</p>
        
        {/* Faoliyat turi bo'yicha qidiruv */}
        <div className="activity-search">
          <input
            type="text"
            placeholder="Faoliyat turini kiriting (masalan: 'yuridik xizmatlar')"
            value={activitySearch}
            onChange={handleActivitySearch}
            className="activity-search-input"
          />
          
          {recommendedClasses.length > 0 && (
            <div className="recommended-classes">
              <div className="recommended-classes-header">
                <h4>Tavsiya qilingan MKTU sinflari:</h4>
                <button 
                  className="select-all-btn" 
                  onClick={selectAllRecommended}
                >
                  Barchasini tanlash
                </button>
              </div>
              
              <div className="recommended-classes-list">
                {recommendedClasses.map(recClass => (
                  <div key={recClass.classNumber} className="recommended-class-item">
                    <div 
                      className={`rec-class-number ${selectedClasses.includes(recClass.classNumber) ? 'selected' : ''}`}
                      onClick={() => selectRecommendedClass(recClass.classNumber)}
                    >
                      {recClass.classNumber}
                    </div>
                    <div className="rec-class-info">
                      <strong>{recClass.name}</strong>
                      <p>{recClass.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="class-grid">
          {classes.map(classNum => {
            // Sinf haqida ma'lumot olish
            const classInfo = mktuClasses.find(c => c.classNumber === classNum) || { 
              name: `Sinf ${classNum}`, 
              description: 'Ma\'lumot mavjud emas' 
            };
            
            return (
              <div 
                key={classNum} 
                className={`class-item ${selectedClasses.includes(classNum) ? 'selected' : ''}`}
                onClick={() => handleClassToggle(classNum)}
                title={`${classInfo.name}: ${classInfo.description}`}
              >
                {classNum}
              </div>
            );
          })}
        </div>
        <p className="class-count">Tanlangan sinflar: {selectedClasses.length}/45</p>
        
        {selectedClasses.length > 0 && (
          <div className="selected-classes-info">
            <h4>Tanlangan sinflar ma'lumoti:</h4>
            <ul className="selected-classes-list">
              {selectedClasses.sort((a, b) => a - b).map(selectedClassNum => {
                const classInfo = mktuClasses.find(c => c.classNumber === selectedClassNum) || { 
                  name: `Sinf ${selectedClassNum}`, 
                  description: 'Ma\'lumot mavjud emas' 
                };
                
                return (
                  <li key={selectedClassNum} className="selected-class-item">
                    <span className="selected-class-number">{selectedClassNum}</span>
                    <span className="selected-class-name">{classInfo.name}</span>
                    <button 
                      className="remove-class-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassToggle(selectedClassNum);
                      }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

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

<style jsx>{`
  /* Existing styles */
  
  .class-selection {
    margin-top: 15px;
    margin-bottom: 15px;
  }
  
  .class-grid {
    display: grid;
    grid-template-columns: repeat(9, 1fr);
    gap: 5px;
    margin-bottom: 10px;
  }
  
  .class-item {
    padding: 8px;
    border: 1px solid #ddd;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    background-color: #f8f8f8;
    transition: all 0.2s;
  }
  
  .class-item.selected {
    background-color: #4CAF50;
    color: white;
    border-color: #4CAF50;
  }
  
  .class-count {
    margin-top: 5px;
    font-size: 14px;
    color: #555;
  }
  
  /* Yangi stillar */
  .activity-search {
    margin-bottom: 15px;
  }
  
  .activity-search-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
    font-size: 14px;
  }
  
  .recommended-classes {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 15px;
  }
  
  .recommended-classes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .recommended-classes-header h4 {
    margin: 0;
    font-size: 16px;
    color: #333;
  }
  
  .select-all-btn {
    background-color: #2196F3;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .select-all-btn:hover {
    background-color: #0b7dda;
  }
  
  .recommended-classes-list {
    max-height: 200px;
    overflow-y: auto;
  }
  
  .recommended-class-item {
    display: flex;
    margin-bottom: 8px;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  
  .rec-class-number {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 50%;
    margin-right: 10px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .rec-class-number.selected {
    background-color: #4CAF50;
    color: white;
  }
  
  .rec-class-info {
    flex: 1;
  }
  
  .rec-class-info p {
    margin: 5px 0 0;
    font-size: 12px;
    color: #666;
  }
  
  .selected-classes-info {
    margin-top: 15px;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
  }
  
  .selected-classes-info h4 {
    margin: 0 0 10px;
    font-size: 16px;
    color: #333;
  }
  
  .selected-classes-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .selected-class-item {
    display: flex;
    align-items: center;
    padding: 5px 0;
    border-bottom: 1px solid #eee;
  }
  
  .selected-class-number {
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #4CAF50;
    color: white;
    border-radius: 50%;
    margin-right: 10px;
    font-weight: bold;
  }
  
  .selected-class-name {
    flex: 1;
  }
  
  .remove-class-btn {
    width: 20px;
    height: 20px;
    background-color: #ff5252;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 14px;
    padding: 0;
    margin-left: 10px;
  }
  
  .remove-class-btn:hover {
    background-color: #ff1744;
  }
`}</style>