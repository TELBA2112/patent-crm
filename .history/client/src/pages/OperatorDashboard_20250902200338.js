import React, { useEffect, useState, useCallback } from 'react';
import './OperatorDashboard.css';
import SidebarOperator from './components/SidebarOperator';
import { mktuClasses, getRecommendedClasses } from '../utils/mktuData';
import { saveJobMktuClasses } from '../utils/mktuUtils';
import { apiFetch, apiUrl } from '../utils/api';

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
  
  // Add missing state variables for document collection and power of attorney
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
    passportImageFront: null,
    passportImageBack: null,
    fullBrandName: '',
    fullAddress: ''
  });
  
  // Add missing state variables for power of attorney functionality
  const [showPowerOfAttorney, setShowPowerOfAttorney] = useState(false);
  const [powerOfAttorneyData, setPowerOfAttorneyData] = useState(null);
  const [powerOfAttorneyPreview, setPowerOfAttorneyPreview] = useState(null);
  
  const token = localStorage.getItem('token');
  const [activitySearch, setActivitySearch] = useState('');
  const [recommendedClasses, setRecommendedClasses] = useState([]);

  // Profil ma'lumotlarini olish
  const fetchProfile = useCallback(async () => {
    try {
  const res = await apiFetch('/api/users/me');
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
  const res = await apiFetch(`/api/jobs?status=${status}`);
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

  // Brendni tekshiruvchiga yuborish - Use utility functions
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
    
    // Normalize MKTU classes to ensure they're numbers
    const normalizedClasses = selectedClasses.map(cls => parseInt(cls)).filter(cls => !isNaN(cls));
    
    console.log('Brend yuborilmoqda:', { jobId: selectedTask._id, brandName, classes: normalizedClasses });
    
    try {
      // First, update the MKTU classes using the utility function
      const classesSaved = await saveJobMktuClasses(selectedTask._id, normalizedClasses, token);
      
      if (!classesSaved) {
        console.warn('MKTU sinflarini saqlashda muammo yuz berdi, davom etish...');
      } else {
        console.log('MKTU sinflari muvaffaqiyatli saqlandi');
      }
      
      // Then send brand for review with the MKTU classes
      const res = await apiFetch(`/api/job-actions/${selectedTask._id}/send-for-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName,
          classes: normalizedClasses
        })
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

  // Telefon raqami ko'rinishi uchun taymer
  useEffect(() => {
    let timer;
    if (showPhone && phoneTimer > 0) {
      timer = setTimeout(() => setPhoneTimer(t => t - 1), 1000);
    } else if (showPhone && phoneTimer === 0) {
      setShowPhone(false);
    }
    return () => clearTimeout(timer);
  }, [showPhone, phoneTimer]);

  // Ishni tanlash - tekshiruvdan qaytgan ishlar uchun to'g'ri bosqichni belgilash - MKTU sinflari uchun yangilangan
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
    
    // MKTU sinflarini to'g'ri formatta olish - improved
    if (task.classes && Array.isArray(task.classes)) {
      const classNumbers = normalizeMktuClasses(task.classes);
      console.log('Task dan olingan MKTU sinflari:', classNumbers);
      setSelectedClasses(classNumbers);
    } else {
      console.log('Task da MKTU sinflari topilmadi');
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
        await apiFetch(`/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
        await apiFetch(`/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
        await apiFetch(`/api/jobs/${selectedTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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

  // Hujjatlarni saqlash va tekshiruvchiga yuborish - Use utility functions
  const saveDocsAndSendToReview = async () => {
    if (!selectedTask?._id) {
      return alert('Ish tanlanmagan');
    }

    // Ensure MKTU classes are properly handled
    let classesToSend = selectedClasses && selectedClasses.length > 0
      ? selectedClasses.map(cls => parseInt(cls)).filter(cls => !isNaN(cls))
      : selectedTask.classes && Array.isArray(selectedTask.classes)
        ? normalizeMktuClasses(selectedTask.classes)
        : [];
    
    // Critical check for MKTU classes
    if (classesToSend.length === 0) {
      return alert('⚠️ MKTU sinflari tanlanmagan! Iltimos, "MKTU sinflarini tahrirlash" tugmasini bosib, kamida bitta sinfni tanlang.');
    }

    try {
      setLoading(true);
      
      // First update the MKTU classes using the utility function
      const classesSaved = await saveJobMktuClasses(selectedTask._id, classesToSend, token);
      
      if (!classesSaved) {
        console.warn('MKTU sinflarini saqlashda muammo yuz berdi, davom etish...');
      } else {
        console.log('MKTU sinflari muvaffaqiyatli saqlandi');
      }
      
      // Then proceed with document upload
      const docsData = personType === 'yuridik' 
        ? { yuridikDocs } 
        : { jismoniyDocs };
      
      console.log('Hujjatlar yuborilmoqda:', {
        personType,
        classes: classesToSend,
        ...docsData
      });
      
      // API orqali ma'lumotlarni yuborish
      const res = await apiFetch(`/api/job-actions/${selectedTask._id}/submit-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personType,
          classes: classesToSend,
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

  // Hujjatlar yig'ish qadamlarini ko'rsatish - fully enhanced MKTU display
  const renderDocsStep = () => {
    if (!personType) {
      return (
        <div className="docs-step">
          <p>Iltimos, avval shaxs turini tanlang.</p>
        </div>
      );
    }

    // Get the correct MKTU classes to display
    const displayClasses = selectedClasses && selectedClasses.length > 0
      ? selectedClasses
      : selectedTask && selectedTask.classes
        ? normalizeMktuClasses(selectedTask.classes)
        : [];

    return (
      <div className="docs-collection-form">
        {personType === 'yuridik' ? renderYuridikDocsStep() : renderJismoniyDocsStep()}
        
        {/* MKTU sinflarini ko'rsatish bo'limi - enhanced display */}
        <div className="selected-mktu-classes-section">
          <h4>Tanlangan MKTU sinflari</h4>
          {displayClasses.length > 0 ? (
            <div className="selected-mktu-list">
              {displayClasses.sort((a, b) => a - b).map(classNum => (
                <span key={classNum} className="selected-mktu-item">{classNum}</span>
              ))}
            </div>
          ) : (
            <div className="no-mktu-warning">
              <p className="no-mktu-selected">⚠️ MKTU sinflari tanlanmagan!</p>
              <p className="mktu-help-text">Iltimos, "MKTU sinflarini tahrirlash" tugmasini bosib, kamida bitta MKTU sinfini tanlang.</p>
            </div>
          )}
          <div className="mktu-edit-container">
            <button 
              onClick={() => {
                setStep(3); // MKTU sinf tanlash qadamiga qaytish
              }}
              className="edit-mktu-btn"
            >
              MKTU sinflarini tahrirlash
            </button>
          </div>
        </div>
        
        {renderDocsNavButtons()}
      </div>
    );
  };

  // Update Modal content to show MKTU classes consistently - focus on case 1 and 4
  const renderModalContent = () => {
    // Task ma'lumotlarini ko'rsatish
    console.log('Modal content rendering for step:', step);
    console.log('Selected task status:', selectedTask?.status);
    console.log('Selected MKTU classes:', selectedClasses);
    
    switch (step) {
      case 1:
        return (
          <div className="step-box">
            <h3>1-Bosqich: Mijoz bilan bog'lanish</h3>
            <p>Mijozning telefon raqamini ko'rish uchun tugmani bosing:</p>
            <button onClick={handleShowPhone} className="show-phone-btn" disabled={showPhone}>
              Telefon raqamini ko'rsatish
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
                ✅ Bog'landi
              </button>
              <button
                onClick={() => setCallResult('boglanmadi')}
                className={`btn-secondary ${callResult === 'boglanmadi' ? 'active' : ''}`}
              >
                ❌ Bog'lanmadi
              </button>
            </div>
            
            {/* Yangi: Qo'ng'iroq natijasi "Bog'landi" bo'lganda, erta bosqichdanoq MKTU sinflarini tanlash imkoni */}
            {callResult === 'boglandi' && (
              <div className="early-mktu-selection">
                <h4>Faoliyat turi bo'yicha MKTU sinflari:</h4>
                <p className="helper-text">Mijozdan faoliyat turi haqida so'rang va tegishli MKTU sinflarini tanlang</p>
                
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
                </div>
              </div>
            )}
            
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
                min={new Date().toISOString().split('T')[0]} // Bugundan oldingi sanalar bo'lmasligi kerak
              />
            )}
            
            {/* Agar mijoz xizmatni qildirmoqchi bo'lsa, MKTU sinflarini ko'rsatish */}
            {clientIntent === 'qildirmoqchi' && selectedClasses.length > 0 && (
              <div className="selected-mktu-info">
                <h4>Tanlangan MKTU sinflari:</h4>
                <div className="selected-mktu-list">
                  {selectedClasses.sort((a, b) => a - b).map(classNum => (
                    <span key={classNum} className="selected-mktu-item">{classNum}</span>
                  ))}
                </div>
                <button 
                  className="edit-mktu-btn-small" 
                  onClick={() => {
                    setStep(3); // MKTU sinf tanlash qadamiga o'tish
                  }}
                >
                  MKTU sinflarini tahrirlash
                </button>
              </div>
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
            <h3>3-Bosqich: Brend nomi va MKTU sinflari</h3>
            <p>Mijozning brend nomini kiriting va faoliyat turiga mos MKTU sinflarini tanlang.</p>
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
        // Get the correct MKTU classes to display
        const displayClasses = selectedClasses && selectedClasses.length > 0
          ? selectedClasses
          : selectedTask && selectedTask.classes
            ? normalizeMktuClasses(selectedTask.classes)
            : [];
            
        return (
          <div className="step-box">
            <h3>4-Bosqich: Hujjatlarni to'plash</h3>
            {selectedTask.status === 'approved' || selectedTask.status === 'documents_pending' ? (
              <div>
                <p className="approved-status">✅ Brend nomi "{selectedTask.brandName}" tasdiqlandi va hujjat yig'ishga tayyor.</p>
                
                {/* Tanlangan MKTU sinflarini ko'rsatish - enhanced display */}
                <div className="mktu-classes-display">
                  <h4>Tanlangan MKTU sinflari:</h4>
                  {displayClasses.length > 0 ? (
                    <div className="mktu-classes-list">
                      {displayClasses.sort((a, b) => a - b).map(classNum => (
                        <span key={classNum} className="mktu-class-tag">{classNum}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="no-mktu-warning">
                      <p>⚠️ Sinflar tanlanmagan! Hujjatlarni to'plashdan oldin MKTU sinflarini tanlang.</p>
                      <button 
                        className="add-mktu-btn" 
                        onClick={() => {
                          setStep(3); // MKTU sinf tanlash qadamiga o'tish
                        }}
                      >
                        MKTU sinflarini qo'shish
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
            
            {personType && (
              <div className="power-of-attorney-buttons">
                <button
                  className={personType === 'jismoniy' ? 'btn-power-jismoniy' : 'btn-power-yuridik'}
                  onClick={() => generatePowerOfAttorney(selectedTask, personType)}
                >
                  📄 {personType === 'jismoniy' ? 'Jismoniy' : 'Yuridik'} shaxs uchun ishonchnoma
                </button>
              </div>
            )}
            
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

  // Ishonchnoma yaratish funksiyasi - avtomatik to'ldirish bilan
  const generatePowerOfAttorney = async (task, type) => {
    if (!task) return;
    
    setLoading(true);
    
    try {
      // API orqali ma'lumotlarni olish
  const res = await apiFetch(`/api/power-of-attorney/${task._id}`);
      
      if (!res.ok) {
        throw new Error("Ishonchnoma ma'lumotlarini olishda xatolik");
      }
      
      const powerOfAttorneyData = await res.json();
      
      const now = new Date();
      const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
      
      // MKTU sinflarni tekshirish
      let classesString = '';
      if (task.classes && Array.isArray(task.classes) && task.classes.length > 0) {
        classesString = task.classes.join(', ');
      } else if (selectedClasses && selectedClasses.length > 0) {
        classesString = selectedClasses.join(', ');
      } else {
        classesString = '[Sinf tanlanmagan]';
      }
      
      let powerOfAttorneyContent = '';
      let fileName = '';
      
      if (type === 'jismoniy') {
        // JSHSHR endi API dan keladi
        const jshshr = powerOfAttorneyData.jshshr || '[ЖШШИР олинмади]';
        
        powerOfAttorneyContent = `
          <div style="padding: 20px; font-family: 'Times New Roman', serif; line-height: 1.5;">
            <h2 style="text-align: center; text-transform: uppercase; margin-bottom: 20px;">ИШОНЧНОМА</h2>
            
            <p style="text-align: justify; margin-bottom: 15px;">
              <strong>Ушбу ишончномани берувчи фукаро:</strong> ${task.jismoniyDocs?.fullAddress || '[Манзил киритилмаган]'} фаолият кўрсатувчи ${task.clientName} ${task.clientSurname} JSHSHR: ${jshshr}
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
        fileName: fileName,
        classes: task.classes || selectedClasses || []
      });
      setPowerOfAttorneyPreview(powerOfAttorneyContent);
      setShowPowerOfAttorney(true);
    } catch (err) {
      console.error("Ishonchnoma yaratishda xatolik:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ishonchnomani yuklab olish funksiyasi - PDF yoki DOCX formatida
  const downloadPowerOfAttorney = async (format = 'docx') => {
    if (!powerOfAttorneyData || !selectedTask) return;
    
    try {
      setLoading(true);
      
      // API ga ma'lumotlarni saqlash
      const saveRes = await apiFetch(`/api/jobs/${selectedTask._id}/power-of-attorney`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: powerOfAttorneyData.content,
          personType: personType,
          classes: powerOfAttorneyData.classes || selectedClasses || [],
          format: format // PDF yoki DOCX formatini yuborish
        })
      });
      
      if (!saveRes.ok) {
        throw new Error("Ishonchnomani saqlashda xatolik");
      }
      
      if (format === 'pdf') {
        // PDF formatda yuklash uchun serverga so'rov
  const pdfRes = await apiFetch(`/api/jobs/${selectedTask._id}/power-of-attorney-pdf`);
        
        if (!pdfRes.ok) {
          throw new Error("PDF formatda yuklashda xatolik");
        }
        
        // PDF blob olish
        const pdfBlob = await pdfRes.blob();
        
        // PDF ni yuklab olish
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = powerOfAttorneyData.fileName.replace('.docx', '.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // HTML to DOCX conversion (client-side)
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Ishonchnoma</title></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + powerOfAttorneyData.content + postHtml;
        
        // Create a Blob with the content
        const blob = new Blob(['\ufeff', html], {
          type: 'application/msword'
        });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = powerOfAttorneyData.fileName;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      alert(`Ishonchnoma muvaffaqiyatli yaratildi va ${format.toUpperCase()} formatida saqlandi!`);
    } catch (error) {
      console.error('Ishonchnomani yuklab olishda xatolik:', error);
      alert('Xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Power of attorney modal - PDF va DOCX formatlar bilan
  const renderPowerOfAttorneyModal = () => {
    if (!showPowerOfAttorney) return null;
    
    return (
      <div className="power-of-attorney-modal">
        <div className="power-of-attorney-content">
          <div className="power-of-attorney-header">
            <h3>Ishonchnoma</h3>
            <button className="close-btn" onClick={() => setShowPowerOfAttorney(false)}>×</button>
          </div>
          
          <div className="power-of-attorney-preview">
            <div dangerouslySetInnerHTML={{ __html: powerOfAttorneyPreview }} />
          </div>
          
          <div className="power-of-attorney-actions">
            <button onClick={() => downloadPowerOfAttorney('docx')} className="download-btn">
              <i className="download-icon">📥</i> Word formatida yuklab olish
            </button>
            <button onClick={() => downloadPowerOfAttorney('pdf')} className="download-btn pdf-download-btn">
              <i className="download-icon">📑</i> PDF formatida yuklab olish
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add normalizeMktuClasses function - this is what's missing
  const normalizeMktuClasses = (classes) => {
    if (!classes || !Array.isArray(classes)) return [];
    
    return classes.map(cls => {
      // Convert any class object or string to a number
      if (typeof cls === 'object' && cls.classNumber) {
        return parseInt(cls.classNumber);
      }
      return parseInt(cls) || Number(cls);
    }).filter(c => !isNaN(c)); // Remove any invalid entries
  };
  
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
  
  // MKTU sinf tanlovi rendereri - tanlangan sinflar ko'rinadigan qilib yangilangan
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
        
        {/* Tanlangan sinflarni ko'rsatish */}
        <div className="selected-classes-info">
          <h4>Tanlangan sinflar:</h4>
          {selectedClasses.length === 0 ? (
            <p className="no-classes-selected">Hali sinflar tanlanmagan. Qidiruv orqali sinflarni tanlang.</p>
          ) : (
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
          )}
        </div>
        
        {/* Qo'shimcha sinf qo'shish bo'limi */}
        <div className="add-class-manually">
          <h4>Sinfni qo'lda qo'shish:</h4>
          <div className="manual-class-input">
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  const classNum = parseInt(e.target.value);
                  if (!selectedClasses.includes(classNum)) {
                    handleClassToggle(classNum);
                  }
                  e.target.value = ''; // Reset select after adding
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Sinf tanlang</option>
              {Array.from({length: 45}, (_, i) => i + 1).map(num => (
                <option 
                  key={num} 
                  value={num}
                  disabled={selectedClasses.includes(num)}
                >
                  {num} - {(mktuClasses.find(c => c.classNumber === num) || {name: ''}).name}
                </option>
              ))}
            </select>
          </div>
        </div>
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
        const newClasses = [...prevClasses, classNum];
        console.log(`Sinf ${classNum} qo'shildi. Yangi ro'yxat:`, newClasses);
        return newClasses;
      }
    });
  };

  // Profilni ko'rsatish
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
      
      {/* Add power of attorney modal to render */}
      {renderPowerOfAttorneyModal()}
    </div>
  );
}

export default OperatorDashboard;

<style jsx>{`
  /* Existing styles */
  
  /* Yangi stillar - tanlangan sinflar ko'rinishi uchun */
  .selected-classes-info {
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 20px;
    margin-top: 20px;
    margin-bottom: 20px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.04);
  }
  
  /* MKTU sinflarini 1-bosqichda ko'rsatish uchun stillar */
  .early-mktu-selection {
    margin-top: 20px;
    padding: 15px;
    background-color: #f0f8ff;
    border-radius: 8px;
    border: 1px solid #bddeff;
  }
  
  .early-mktu-selection h4 {
    margin-top: 0;
    color: #0066cc;
    margin-bottom: 10px;
  }
  
  .helper-text {
    font-size: 14px;
    color: #666;
    margin-bottom: 15px;
    font-style: italic;
  }
  
  /* PDF yuklash tugmasi uchun stillar */
  .pdf-download-btn {
    background-color: #e74c3c;
    margin-left: 10px;
  }
  
  .pdf-download-btn:hover {
    background-color: #c0392b;
  }
  
  .edit-mktu-btn-small {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    margin-top: 10px;
  }
  
  .edit-mktu-btn-small:hover {
    background-color: #2980b9;
  }
  
  .selected-mktu-info {
    background-color: #f0f8ff;
    padding: 12px;
    border-radius: 8px;
    margin: 15px 0;
    border: 1px solid #bddeff;
  }
  
  .add-mktu-btn {
    background-color: #2ecc71;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 15px;
    margin-top: 10px;
    cursor: pointer;
    font-weight: 600;
  }
  
  .add-mktu-btn:hover {
    background-color: #27ae60;
  }
`}</style>