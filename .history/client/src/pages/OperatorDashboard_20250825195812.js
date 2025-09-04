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
  
  // MKTU sinflar tanlovi rendereri - faqat qidiruv bilan soddalashtirilgan versiya
  const renderClassSelection = () => {
    return (
      <div className="class-selection">
        <p>MKTU sinflarini tanlang (maksimum 45):</p>
        
        {/* Faoliyat turi bo'yicha qidiruv - chiroyli dizayn bilan */}
        <div className="activity-search">
          <div className="search-box">
            <i className="search-icon">🔍</i>
            <input
              type="text"
              placeholder="Faoliyat turini kiriting (masalan: 'yuridik xizmatlar', 'kiyim', 'oziq-ovqat'...)"
              value={activitySearch}
              onChange={handleActivitySearch}
              className="activity-search-input"
            />
            {activitySearch && (
              <button 
                className="clear-search" 
                onClick={() => {
                  setActivitySearch('');
                  setRecommendedClasses([]);
                }}
              >
                ×
              </button>
            )}
          </div>
          
          {recommendedClasses.length > 0 && (
            <div className="recommended-classes">
              <div className="recommended-classes-header">
                <h4>Tavsiya qilingan MKTU sinflari: <span className="count-badge">{recommendedClasses.length}</span></h4>
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
                      <p className="rec-class-description">{recClass.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activitySearch && recommendedClasses.length === 0 && (
            <div className="no-results">
              <p>🔍 Hech narsa topilmadi. Boshqa kalit so'z bilan qidirib ko'ring.</p>
            </div>
          )}
        </div>
        
        <p className="class-count">Tanlangan sinflar: {selectedClasses.length}/45</p>
        
        {selectedClasses.length > 0 && (
          <div className="selected-classes-info">
            <h4>Tanlangan sinflar:</h4>
            <div className="selected-classes-list">
              {selectedClasses.sort((a, b) => a - b).map(selectedClassNum => {
                const classInfo = mktuClasses.find(c => c.classNumber === selectedClassNum) || { 
                  name: `Sinf ${selectedClassNum}`, 
                  description: 'Ma\'lumot mavjud emas' 
                };
                
                return (
                  <div key={selectedClassNum} className="selected-class-item">
                    <div className="selected-class-number">{selectedClassNum}</div>
                    <div className="selected-class-content">
                      <div className="selected-class-name">{classInfo.name}</div>
                      <div className="selected-class-description">{classInfo.description.substring(0, 100)}...</div>
                    </div>
                    <button 
                      className="remove-class-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClassToggle(selectedClassNum);
                      }}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // MKTU sinfini tanlash yoki bekor qilish funksiyasi
  const handleClassToggle = (classNum) => {
    setSelectedClasses(prevClasses => {
      if (prevClasses.includes(classNum)) {
        // Agar sinf allaqachon tanlangan bo'lsa, uni olib tashlash
        return prevClasses.filter(num => num !== classNum);
      } else {
        // Aks holda, uni qo'shish
        return [...prevClasses, classNum];
      }
    });
  };

  // Ishonchnoma yaratish funksiyasi - avtomatik to'ldirish bilan
  const generatePowerOfAttorney = (task, type) => {
    if (!task) return;
    
    const now = new Date();
    const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
    
    // Tanlangan sinflarni tekshirish va olish
    let classesString = '';
    if (task.classes && Array.isArray(task.classes) && task.classes.length > 0) {
      classesString = task.classes.join(', ');
    } else {
      classesString = '[Sinf tanlanmagan]';
    }
    
    let powerOfAttorneyContent = '';
    let fileName = '';
    
    // Operator tomonidan kiritilgan ma'lumotlar - bu ma'lumotlar ishonchnomada avtomatik to'ldiriladi
    if (type === 'jismoniy') {
      // Jismoniy shaxs uchun ishonchnoma - operatordan olingan ma'lumotlar bilan
      powerOfAttorneyContent = `
        <div style="padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.5;">
          <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 20px;">ИШОНЧНОМА</h2>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>Ушбу ишончномани берувчи фукаро:</strong> ${task.jismoniyDocs?.fullAddress || '[Манзил киритилмаган]'} фаолият кўрсатувчи ${task.clientName} ${task.clientSurname} JSHSHR: ${jshshrInput || '[ЖШШИР киритилмаган]'}
          </p>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>Ушбу ишончномани берувчи фукаро:</strong>
          </p>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            Ишончнома, Турдиалиев Мухаммад Али Пулатжон угли (ЎзР Адлия вазирлигидан ҳуқуқий маслаҳат кўрсатувчи тижорий ташкилот сифатида 98-сонли рақам билан реестрдан ўтган Буюртмачи ${task.clientName} ${task.clientSurname} номидан Адлия вазирлиги ҳузуридаги "Интелектуал Мулк Маркази" давлат муассасасига ариза, давлат божларини тўлашда, сўровномаларга жавоб беришда, билдиришнома, Талабнома ва бошқа ҳужжатларни товар белгисини рўйхатдан ўтказиш учун топширишга ваколат ва ҳуқуқ берилди. Ишончнома 2025 йил 28 декабрга қадар амал қилади.
          </p>
          
          <p style="margin-bottom: 15px;">
            <strong>Ишончнома берилган сана:</strong> ${formattedDate}
          </p>
          
          <p style="margin-bottom: 15px;">
            <strong>Тасвирий белги:</strong> ${task.brandName || task.jismoniyDocs?.fullBrandName || '[Бренд номи киритилмаган]'}
          </p>
          
          <p style="margin-bottom: 30px;">
            <strong>Фаолият тури:</strong> ${classesString}
          </p>
          
          <p style="margin-bottom: 30px;">
            <strong>Ишончнома берувчи:</strong>
          </p>
          
          <p style="margin-top: 50px;">
            ${task.clientName} ${task.clientSurname} _________________ <span style="float: right;">Имзо</span>
          </p>
        </div>
      `;
      fileName = `Ishonchnoma_jismoniy_${task.clientName}_${task.clientSurname}.docx`;
    } else if (type === 'yuridik') {
      // Yuridik shaxs uchun ishonchnoma - operatordan olingan ma'lumotlar bilan
      powerOfAttorneyContent = `
        <div style="padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.5;">
          <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 20px;">ИШОНЧНОМА</h2>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>Ушбу ишончномани берувчи фукаро:</strong> ${task.yuridikDocs?.companyAddress || '[Манзил киритилмаган]'} фаолият кўрсатувчи «${task.yuridikDocs?.companyName || '[Компания номи киритилмаган]'}» МЧЖ номидан директори ${task.clientName} ${task.clientSurname} корхона ИНН: ${task.yuridikDocs?.stir || '[ИНН киритилмаган]'}
          </p>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            <strong>Ушбу ишончномани берувчи фукаро:</strong>
          </p>
          
          <p style="text-align: justify; margin-bottom: 15px;">
            Ишончнома, Турдиалиев Мухаммад Али Пулатжон угли (ЎзР Адлия вазирлигидан ҳуқуқий маслаҳат кўрсатувчи тижорий ташкилот сифатида 98-сонли рақам билан реестрдан ўтган Буюртмачи ${task.yuridikDocs?.companyName || '[Компания номи киритилмаган]'} номидан Адлия вазирлиги ҳузуридаги "Интелектуал Мулк Маркази" давлат муассасасига ариза, давлат божларини тўлашда, сўровномаларга жавоб беришда, билдиришнома, Талабнома ва бошқа ҳужжатларни товар белгисини рўйхатдан ўтказиш учун топширишга ваколат ва ҳуқуқ берилди. Ишончнома 2025 йил 28 декабрга қадар амал қилади.
          </p>
          
          <p style="margin-bottom: 15px;">
            <strong>Ишончнома берилган сана:</strong> ${formattedDate}
          </p>
          
          <p style="margin-bottom: 15px;">
            <strong>Тасвирий белги:</strong> ${task.brandName || task.yuridikDocs?.patentBrandName || '[Бренд номи киритилмаган]'}
          </p>
          
          <p style="margin-bottom: 30px;">
            <strong>Фаолият тури:</strong> ${classesString}
          </p>
          
          <p style="margin-bottom: 30px;">
            <strong>Ишончнома берувчи жамият директори:</strong>
          </p>
          
          <p style="margin-top: 50px;">
            ${task.clientName} ${task.clientSurname} _________________ <span style="float: right;">Имзо</span>
          </p>
        </div>
      `;
      fileName = `Ishonchnoma_yuridik_${task.yuridikDocs?.companyName || task.clientName}.docx`;
    }
    
    // Ma'lumotlarni saqlash va modal oynani ochish
    setPowerOfAttorneyData({
      content: powerOfAttorneyContent,
      fileName: fileName
    });
    setPowerOfAttorneyPreview(powerOfAttorneyContent);
    setShowPowerOfAttorney(true);
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
    background: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  
  /* Qidiruv qutisi stilini yaxshilash */
  .search-box {
    position: relative;
    margin-bottom: 15px;
  }
  
  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #777;
    font-style: normal;
    font-size: 16px;
    pointer-events: none;
  }
  
  .clear-search {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #777;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    height: 20px;
    width: 20px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .activity-search-input {
    width: 100%;
    padding: 14px 40px;
    border: 1px solid #ddd;
    border-radius: 50px;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: all 0.3s;
  }
  
  .activity-search-input:focus {
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
    outline: none;
  }
  
  /* Tavsiya qilingan sinflar stillarini yaxshilash */
  .recommended-classes {
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 15px;
    margin: 15px 0;
    box-shadow: 0 3px 10px rgba(0,0,0,0.04);
    transition: all 0.3s ease;
  }
  
  .recommended-classes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .recommended-classes-header h4 {
    margin: 0;
    font-size: 16px;
    color: #333;
    display: flex;
    align-items: center;
  }
  
  .count-badge {
    display: inline-block;
    background: #4CAF50;
    color: white;
    border-radius: 20px;
    padding: 2px 8px;
    margin-left: 8px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .select-all-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    font-weight: 600;
  }
  
  .select-all-btn:hover {
    background-color: #388e3c;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .recommended-classes-list {
    max-height: 450px;
    overflow-y: auto;
    padding-right: 5px;
  }
  
  .recommended-classes-list::-webkit-scrollbar {
    width: 6px;
  }
  
  .recommended-classes-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .recommended-classes-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  
  .recommended-classes-list::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
  }
  
  .recommended-class-item {
    display: flex;
    margin-bottom: 16px;
    padding: 14px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #eee;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .recommended-class-item:hover {
    background: #f3f8f4;
    border-color: #c8e6c9;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  }
  
  .rec-class-number {
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f0f0;
    border-radius: 50%;
    margin-right: 16px;
    cursor: pointer;
    font-weight: bold;
    font-size: 18px;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .rec-class-number:hover {
    transform: scale(1.05);
  }
  
  .rec-class-number.selected {
    background-color: #4CAF50;
    color: white;
  }
  
  .rec-class-info {
    flex: 1;
  }
  
  .rec-class-info strong {
    font-size: 16px;
    color: #333;
    display: block;
    margin-bottom: 8px;
  }
  
  .rec-class-description {
    margin: 5px 0 0;
    font-size: 14px;
    color: #555;
    line-height: 1.5;
  }
  
  .no-results {
    padding: 20px;
    text-align: center;
    background: #f5f5f5;
    border-radius: 8px;
    margin: 20px 0;
    color: #666;
  }
  
  /* Tanlangan sinflar stillarini yangilash */
  .class-count {
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 20px 0;
    background: #e8f5e9;
    padding: 10px;
    border-radius: 8px;
  }
  
  .selected-classes-info {
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.04);
  }
  
  .selected-classes-info h4 {
    margin: 0 0 15px;
    font-size: 16px;
    color: #333;
    text-align: center;
    font-weight: 600;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .selected-classes-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .selected-class-item {
    display: flex;
    align-items: flex-start;
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #e0e0e0;
    transition: all 0.2s;
    animation: fadeIn 0.3s ease-out;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .selected-class-item:hover {
    background-color: #f3f8f4;
    border-color: #c8e6c9;
  }
  
  .selected-class-number {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #4CAF50;
    color: white;
    border-radius: 50%;
    margin-right: 12px;
    font-weight: bold;
    font-size: 16px;
    flex-shrink: 0;
  }
  
  .selected-class-content {
    flex: 1;
  }
  
  .selected-class-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 5px;
    color: #333;
  }
  
  .selected-class-description {
    font-size: 12px;
    color: #666;
    line-height: 1.4;
  }
  
  .remove-class-btn {
    width: 24px;
    height: 24px;
    background-color: #ffebee;
    color: #f44336;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
    padding: 0;
    margin-left: 10px;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  
  .remove-class-btn:hover {
    background-color: #f44336;
    color: white;
    transform: scale(1.2);
  }
`}</style>