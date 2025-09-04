import React, { useEffect, useState, useCallback } from 'react';
import './YuristDashboard.css';
import html2pdf from 'html2pdf.js'; // PDF yaratish uchun qo'shimcha kutubxona

function YuristDashboard({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedSection, setSelectedSection] = useState('yangi');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [statistics, setStatistics] = useState(null);
  const token = localStorage.getItem('token');
  
  // Yangi holatlar - hujjatlar to'plash va to'lov
  const [processingStep, setProcessingStep] = useState(1);
  const [documentData, setDocumentData] = useState({
    yuridik: {
      ishonchnoma: null,
      passportFront: null,
      passportBack: null,
      permanentAddress: '',
      brandName: '',
      classes: '',
      companyDetails: ''
    },
    jismoniy: {
      ishonchnoma: null,
      passportFront: null,
      passportBack: null,
      permanentAddress: '',
      brandName: '',
      classes: ''
    }
  });
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceComment, setInvoiceComment] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Profilni olish
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Profilni olishda xatolik');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setProfile(null);
      console.error('Profilni olishda xatolik:', err);
    }
  }, [token]);

  // Ishlarni olish - kengaytirilgan filtrlash bilan
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      // Bo'limga qarab status filterini o'rnatish
      let status = '';
      if (selectedSection === 'yangi') {
        status = 'to_lawyer';  // Yuristga yuborilgan yangi ishlar
      } else if (selectedSection === 'jarayonda') {
        status = 'lawyer_processing';  // Yurist ko'rib chiqayotgan ishlar
      } else if (selectedSection === 'tugatilgan') {
        status = 'lawyer_completed,finished';  // Yurist yakunlagan ishlar
      }

      // Qo'shimcha filtrlar uchun
      const queryParams = new URLSearchParams();
      queryParams.append('status', status);
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (dateFilter.from) {
        queryParams.append('fromDate', dateFilter.from);
      }
      
      if (dateFilter.to) {
        queryParams.append('toDate', dateFilter.to);
      }

      const res = await fetch(`http://localhost:5000/api/jobs?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError('Ishlarni olishda xatolik: ' + err.message);
      console.error('Ishlarni olishda xatolik:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [token, selectedSection, searchQuery, dateFilter]);

  // Statistikani yuklash
  const fetchStatistics = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5000/api/statistics/lawyer', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Statistikani olishda xatolik');
      
      const data = await res.json();
      setStatistics(data);
    } catch (err) {
      console.error('Statistikani olishda xatolik:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    fetchTasks();
    fetchStatistics();
  }, [token, fetchTasks, fetchProfile, fetchStatistics, selectedSection]);

  // Ishni tanlash va modalka ochish - yangilangan
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setComment('');
    setProcessingStep(1);
    
    // Agar tasda documentData bo'lsa, uni yuklash
    if (task.documentData) {
      if (task.personType === 'yuridik' && task.documentData.yuridik) {
        setDocumentData(prev => ({
          ...prev,
          yuridik: { ...task.documentData.yuridik }
        }));
      } else if (task.personType === 'jismoniy' && task.documentData.jismoniy) {
        setDocumentData(prev => ({
          ...prev,
          jismoniy: { ...task.documentData.jismoniy }
        }));
      }
    }
  };

  // Fayl yuklash funksiyasi
  const handleFileUpload = (e, fieldName, personType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Fayl turi tekshirish
    if (!file.type.startsWith('image/')) {
      alert('Faqat rasm fayllarini yuklash mumkin');
      e.target.value = '';
      return;
    }

    // Fayl hajmini tekshirish
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('Fayl hajmi 5MB dan oshmasligi kerak');
      e.target.value = '';
      return;
    }

    // FileReader orqali faylni o'qish
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentData(prev => ({
        ...prev,
        [personType]: {
          ...prev[personType],
          [fieldName]: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  // Matn maydonlari o'zgarishlarini boshqarish
  const handleDocumentDataChange = (e, fieldName, personType) => {
    const { value } = e.target;
    setDocumentData(prev => ({
      ...prev,
      [personType]: {
        ...prev[personType],
        [fieldName]: value
      }
    }));
  };

  // To'lov hisobi yuklash
  const handleInvoiceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Fayl turini tekshirish (PDF yoki rasm)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Faqat PDF yoki rasm fayllarini yuklash mumkin');
      e.target.value = '';
      return;
    }

    // Fayl hajmini tekshirish
    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Fayl hajmi 10MB dan oshmasligi kerak');
      e.target.value = '';
      return;
    }

    setInvoiceFile(file);
  };

  // Ishni jarayonga qo'shish
  const handleAcceptTask = async () => {
    if (!selectedTask) return;
    
    try {
      // Avval hujjatlar to'g'ri kelganini tekshirish
      if (!validateRequiredDocuments()) {
        return alert("Zaruriy hujjatlar to'liq emas! Tekshiruvchidan qayta so'rang.");
      }
      
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/accept-by-lawyer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: comment })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Xatolik: ${errorText}`);
      }

      alert('Ish muvaffaqiyatli qabul qilindi!');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  // Zaruriy hujjatlarni tekshirish
  const validateRequiredDocuments = () => {
    if (!selectedTask) return false;
    
    const personType = selectedTask.personType || 'jismoniy';
    
    if (personType === 'jismoniy') {
      // Jismoniy shaxs uchun zaruriy hujjatlar
      if (!selectedTask.jismoniyDocs?.passportImageFront || !selectedTask.jismoniyDocs?.passportImageBack) {
        return false;
      }
    } else {
      // Yuridik shaxs uchun zaruriy hujjatlar
      if (!selectedTask.yuridikDocs?.directorPassportImage || !selectedTask.yuridikDocs?.stir) {
        return false;
      }
    }
    
    return true;
  };

  // Ishni yakunlash
  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    if (!comment.trim()) return alert("Izoh kiritishingiz kerak!");
    if (!invoiceFile) return alert("Guvohnoma faylini yuklang!");
    
    try {
      const formData = new FormData();
      formData.append('comment', comment);
      formData.append('certificates', invoiceFile);

      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/complete-by-lawyer`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Xatolik: ${errorText}`);
      }

      alert('Ish muvaffaqiyatli yakunlandi!');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  // Guvohnoma yuklash
  const handleUploadCertificates = async (jobId, file) => {
    if (!file) {
      return alert("Fayl tanlang!");
    }
    if (file.type !== 'application/vnd.rar' && file.type !== 'application/x-rar-compressed') {
      return alert("Faqat .rar formatidagi fayl yuklang.");
    }
    
    const formData = new FormData();
    formData.append('certificates', file);

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/upload-certificates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Fayl yuklashda xatolik');

      alert('Guvohnoma muvaffaqiyatli yuklandi!');
      fetchTasks();
    } catch (err) {
      setError('Fayl yuklashda xatolik: ' + err.message);
    }
  };

  // To'lov hisobini saqlash va yuborish
  const saveInvoiceAndNotifyClient = async () => {
    if (!selectedTask?._id) return;
    if (!invoiceAmount || !invoiceFile) {
      alert('Iltimos, to\'lov summasi va hisobni to\'ldiring');
      return;
    }

    const formData = new FormData();
    formData.append('amount', invoiceAmount);
    formData.append('comment', invoiceComment);
    formData.append('invoiceFile', invoiceFile);

    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/send-invoice`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`To'lov hisobini yuborishda xatolik: ${errorText}`);
      }

      alert('To\'lov hisobi muvaffaqiyatli yuborildi!');
      setProcessingStep(3);
      fetchTasks(); // Ishlar ro'yxatini yangilash
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  // Hujjatlarni saqlash
  const saveDocuments = async () => {
    if (!selectedTask?._id) return;
    
    const personType = selectedTask.personType || 'jismoniy';
    const docData = documentData[personType];
    
    // Asosiy ma'lumotlarni tekshirish
    if (!docData.brandName || !docData.classes) {
      alert('Brend nomi va sinflarini kiritishingiz kerak');
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/save-lawyer-docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          documentData: {
            [personType]: docData
          }
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Hujjatlarni saqlashda xatolik: ${errorText}`);
      }

      alert('Hujjatlar muvaffaqiyatli saqlandi!');
      setProcessingStep(2); // To'lov bosqichiga o'tish
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  // Rasmni ko'rish uchun modal
  const openImagePreview = (imageUrl) => {
    setImagePreview(imageUrl);
  };

  const renderImagePreviewModal = () => {
    if (!imagePreview) return null;
    
    return (
      <div className="image-preview-modal" onClick={() => setImagePreview(null)}>
        <div className="image-preview-content">
          <button className="close-preview-btn" onClick={() => setImagePreview(null)}>×</button>
          <img src={imagePreview} alt="Katta ko'rinish" />
        </div>
      </div>
    );
  };

  // Yuridik shaxs hujjatlar formasi
  const renderYuridikDocumentsForm = () => {
    return (
      <div className="documents-form">
        <h4>Yuridik shaxs hujjatlari</h4>
        
        <div className="form-group">
          <label>Ishonchnoma</label>
          <input 
            type="file" 
            onChange={(e) => handleFileUpload(e, 'ishonchnoma', 'yuridik')}
            className="file-input"
            accept="image/*"
          />
          {documentData.yuridik.ishonchnoma && (
            <div className="image-preview" onClick={() => openImagePreview(documentData.yuridik.ishonchnoma)}>
              <img src={documentData.yuridik.ishonchnoma} alt="Ishonchnoma" width="100" />
              <span>Kattalashtirish uchun bosing</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Pasport old qismi</label>
          <input 
            type="file" 
            onChange={(e) => handleFileUpload(e, 'passportFront', 'yuridik')}
            className="file-input"
            accept="image/*"
          />
          {documentData.yuridik.passportFront && (
            <div className="image-preview" onClick={() => openImagePreview(documentData.yuridik.passportFront)}>
              <img src={documentData.yuridik.passportFront} alt="Pasport old qismi" width="100" />
              <span>Kattalashtirish uchun bosing</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Pasport orqa qismi</label>
          <input 
            type="file" 
            onChange={(e) => handleFileUpload(e, 'passportBack', 'yuridik')}
            className="file-input"
            accept="image/*"
          />
          {documentData.yuridik.passportBack && (
            <div className="image-preview" onClick={() => openImagePreview(documentData.yuridik.passportBack)}>
              <img src={documentData.yuridik.passportBack} alt="Pasport orqa qismi" width="100" />
              <span>Kattalashtirish uchun bosing</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Doimiy yashash joyi</label>
          <textarea
            value={documentData.yuridik.permanentAddress}
            onChange={(e) => handleDocumentDataChange(e, 'permanentAddress', 'yuridik')}
            placeholder="Doimiy yashash manzilini kiriting..."
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>Brend nomi</label>
          <input
            type="text"
            value={documentData.yuridik.brandName}
            onChange={(e) => handleDocumentDataChange(e, 'brandName', 'yuridik')}
            placeholder="Brend nomini kiriting..."
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>MKTU sinflari</label>
          <input
            type="text"
            value={documentData.yuridik.classes}
            onChange={(e) => handleDocumentDataChange(e, 'classes', 'yuridik')}
            placeholder="Sinf raqamlarini vergul bilan ajratib kiriting (masalan: 1, 3, 5)"
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>Firma rekvizitlari (STIR, h/r, va boshqalar)</label>
          <textarea
            value={documentData.yuridik.companyDetails}
            onChange={(e) => handleDocumentDataChange(e, 'companyDetails', 'yuridik')}
            placeholder="STIR, h/r, MFO va boshqa ma'lumotlarni kiriting..."
            className="text-input"
          />
        </div>
      </div>
    );
  };

  // Jismoniy shaxs hujjatlar formasi
  const renderJismoniyDocumentsForm = () => {
    return (
      <div className="documents-form">
        <h4>Jismoniy shaxs hujjatlari</h4>
        
        <div className="form-group">
          <label>Ishonchnoma</label>
          <input 
            type="file" 
            onChange={(e) => handleFileUpload(e, 'ishonchnoma', 'jismoniy')}
            className="file-input"
            accept="image/*"
          />
          {documentData.jismoniy.ishonchnoma && (
            <div className="image-preview" onClick={() => openImagePreview(documentData.jismoniy.ishonchnoma)}>
              <img src={documentData.jismoniy.ishonchnoma} alt="Ishonchnoma" width="100" />
              <span>Kattalashtirish uchun bosing</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Pasport old qismi</label>
          <input 
            type="file" 
            onChange={(e) => handleFileUpload(e, 'passportFront', 'jismoniy')}
            className="file-input"
            accept="image/*"
          />
          {documentData.jismoniy.passportFront && (
            <div className="image-preview" onClick={() => openImagePreview(documentData.jismoniy.passportFront)}>
              <img src={documentData.jismoniy.passportFront} alt="Pasport old qismi" width="100" />
              <span>Kattalashtirish uchun bosing</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Pasport orqa qismi</label>
          <input 
            type="file" 
            onChange={(e) => handleFileUpload(e, 'passportBack', 'jismoniy')}
            className="file-input"
            accept="image/*"
          />
          {documentData.jismoniy.passportBack && (
            <div className="image-preview" onClick={() => openImagePreview(documentData.jismoniy.passportBack)}>
              <img src={documentData.jismoniy.passportBack} alt="Pasport orqa qismi" width="100" />
              <span>Kattalashtirish uchun bosing</span>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Doimiy yashash joyi</label>
          <textarea
            value={documentData.jismoniy.permanentAddress}
            onChange={(e) => handleDocumentDataChange(e, 'permanentAddress', 'jismoniy')}
            placeholder="Doimiy yashash manzilini kiriting..."
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>Brend nomi</label>
          <input
            type="text"
            value={documentData.jismoniy.brandName}
            onChange={(e) => handleDocumentDataChange(e, 'brandName', 'jismoniy')}
            placeholder="Brend nomini kiriting..."
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>MKTU sinflari</label>
          <input
            type="text"
            value={documentData.jismoniy.classes}
            onChange={(e) => handleDocumentDataChange(e, 'classes', 'jismoniy')}
            placeholder="Sinf raqamlarini vergul bilan ajratib kiriting (masalan: 1, 3, 5)"
            className="text-input"
          />
        </div>
      </div>
    );
  };

  // To'lov hisobi formasi
  const renderInvoiceForm = () => {
    return (
      <div className="invoice-form">
        <h4>To'lov hisobini shakllantirish</h4>
        
        <div className="form-group">
          <label>To'lov summasi (so'm)</label>
          <input
            type="number"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
            placeholder="Summani kiriting..."
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>Izoh</label>
          <textarea
            value={invoiceComment}
            onChange={(e) => setInvoiceComment(e.target.value)}
            placeholder="To'lov haqida qo'shimcha ma'lumot..."
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>To'lov hisobi (PDF yoki rasm)</label>
          <input
            type="file"
            onChange={handleInvoiceFileUpload}
            className="file-input"
            accept="application/pdf,image/*"
          />
          {invoiceFile && (
            <p className="file-info">Fayl yuklandi: {invoiceFile.name} ({Math.round(invoiceFile.size / 1024)} KB)</p>
          )}
        </div>
        
        <button
          onClick={saveInvoiceAndNotifyClient}
          className="send-invoice-btn"
          disabled={!invoiceAmount || !invoiceFile}
        >
          To'lov hisobini yuborish
        </button>
      </div>
    );
  };

  // Guvohnoma yuklash formasi - kengaytirilgan fayl tiplar bilan
  const renderCertificateUploadForm = () => {
    return (
      <div className="certificate-upload">
        <h4>Guvohnoma yuklash</h4>
        
        <div className="form-group">
          <label>Guvohnoma fayli (.rar, .zip, .pdf)</label>
          <input
            type="file"
            onChange={(e) => setInvoiceFile(e.target.files[0])}
            className="file-input"
            accept=".rar,.zip,.pdf,application/x-rar-compressed,application/zip,application/pdf"
          />
          {invoiceFile && (
            <p className="file-info">Fayl yuklandi: {invoiceFile.name} ({Math.round(invoiceFile.size / 1024)} KB)</p>
          )}
        </div>
        
        <div className="form-group">
          <label>Izoh</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Guvohnoma haqida qo'shimcha ma'lumot..."
            className="text-input"
          />
        </div>
        
        <button
          onClick={handleCompleteTask}
          className="upload-certificate-btn"
          disabled={!invoiceFile || !comment.trim()}
        >
          Guvohnomani yuklash va ishni yakunlash
        </button>
      </div>
    );
  };

  // Ishonchnoma yaratish bo'limi
  const renderPowerOfAttorneyGenerator = () => {
    return (
      <div className="power-of-attorney-generator">
        <h4>Ishonchnoma yaratish</h4>
        <p>Mijoz uchun ishonchnoma shakli yarating:</p>
        
        <div className="power-of-attorney-types">
          <button onClick={() => generatePowerOfAttorney('registration')} className="power-btn">
            Ro'yxatdan o'tkazish uchun
          </button>
          <button onClick={() => generatePowerOfAttorney('renewal')} className="power-btn">
            Yangilash uchun
          </button>
          <button onClick={() => generatePowerOfAttorney('objection')} className="power-btn">
            E'tiroz uchun
          </button>
          <button onClick={() => generatePowerOfAttorney('change')} className="power-btn">
            O'zgartirish uchun
          </button>
        </div>
      </div>
    );
  };

  // Statistikani ko'rsatish bo'limi
  const renderStatistics = () => (
    <div className="statistics-container">
      <h3>📊 Hisobotlar va statistika</h3>
      
      <div className="stats-cards">
        <div className="stat-card">
          <h4>Yangi ishlar</h4>
          <div className="stat-value">{statistics?.new || 0}</div>
        </div>
        <div className="stat-card">
          <h4>Jarayondagi ishlar</h4>
          <div className="stat-value">{statistics?.inProgress || 0}</div>
        </div>
        <div className="stat-card">
          <h4>Yakunlangan ishlar</h4>
          <div className="stat-value">{statistics?.completed || 0}</div>
        </div>
        <div className="stat-card">
          <h4>O'rtacha vaqt</h4>
          <div className="stat-value">{statistics?.averageTime || '-'} kun</div>
        </div>
      </div>
    </div>
  );

  // Modal oyna - yangi ishonchnoma bo'limi bilan yangilandi
  const renderModal = () => {
    if (!showModal || !selectedTask) return null;
    
    return (
      <div className="modal">
        <div className="modal-content">
          <h3>Ish #{selectedTask.jobId || selectedTask._id.slice(-5)}</h3>
          <p><strong>Mijoz:</strong> {selectedTask.clientName} {selectedTask.clientSurname}</p>
          <p><strong>Brend:</strong> {selectedTask.brandName}</p>
          <p><strong>Telefon:</strong> {selectedTask.phone}</p>
          <p><strong>Status:</strong> {selectedTask.status}</p>
          
          {selectedTask.classes && Array.isArray(selectedTask.classes) && selectedTask.classes.length > 0 && (
            <p><strong>MKTU sinflari:</strong> {selectedTask.classes.join(', ')}</p>
          )}
          
          {selectedTask.personType && (
            <p><strong>Shaxs turi:</strong> {selectedTask.personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}</p>
          )}
          
          {selectedTask.comments && (
            <div className="task-comments">
              <p><strong>Izohlar:</strong> {selectedTask.comments}</p>
            </div>
          )}
          
          {/* Jarayondagi ishlar uchun bosqichli interfeys */}
          {selectedTask.status === 'lawyer_processing' && (
            <div className="processing-steps">
              <div className="steps-indicator">
                <div className={`step ${processingStep >= 1 ? 'active' : ''}`}>1. Hujjatlar</div>
                <div className={`step ${processingStep >= 2 ? 'active' : ''}`}>2. To'lov</div>
                <div className={`step ${processingStep >= 3 ? 'active' : ''}`}>3. Guvohnoma</div>
              </div>
              
              {processingStep === 1 && (
                <>
                  {selectedTask.personType === 'yuridik' ? renderYuridikDocumentsForm() : renderJismoniyDocumentsForm()}
                  
                  {/* Ishonchnoma yaratish qo'shildi */}
                  {renderPowerOfAttorneyGenerator()}
                  
                  <button onClick={saveDocuments} className="step-action-btn">
                    Hujjatlarni saqlash va keyingi bosqichga o'tish
                  </button>
                </>
              )}
              
              {processingStep === 2 && (
                <>
                  {renderInvoiceForm()}
                </>
              )}
              
              {processingStep === 3 && (
                <>
                  {renderCertificateUploadForm()}
                </>
              )}
            </div>
          )}
          
          {/* Yangi ishlar uchun qabul qilish */}
          {selectedTask.status === 'to_lawyer' && (
            <>
              {/* Mavjud hujjatlarni ko'rsatish */}
              <div className="documents-preview">
                <h4>Mavjud hujjatlar:</h4>
                {selectedTask.personType === 'yuridik' && selectedTask.yuridikDocs && (
                  <div className="document-item-preview">
                    <p><strong>Kompaniya nomi:</strong> {selectedTask.yuridikDocs.companyName}</p>
                    <p><strong>STIR:</strong> {selectedTask.yuridikDocs.stir}</p>
                    {/* Pasport rasmini ko'rsatish */}
                    {selectedTask.yuridikDocs.directorPassportImage && (
                      <div className="preview-image">
                        <p>Direktor pasporti:</p>
                        <img 
                          src={selectedTask.yuridikDocs.directorPassportImage} 
                          alt="Direktor pasporti" 
                          width="150"
                          onClick={() => openImagePreview(selectedTask.yuridikDocs.directorPassportImage)}
                          className="clickable-image"
                        />
                      </div>
                    )}
                    {/* Boshqa ma'lumotlar... */}
                  </div>
                )}
                
                {selectedTask.personType === 'jismoniy' && selectedTask.jismoniyDocs && (
                  <div className="document-item-preview">
                    {/* Pasport rasmlarini ko'rsatish */}
                    {selectedTask.jismoniyDocs.passportImageFront && (
                      <div className="preview-image">
                        <p>Pasport old qismi:</p>
                        <img 
                          src={selectedTask.jismoniyDocs.passportImageFront} 
                          alt="Pasport old qismi" 
                          width="150"
                          onClick={() => openImagePreview(selectedTask.jismoniyDocs.passportImageFront)}
                          className="clickable-image"
                        />
                      </div>
                    )}
                    
                    {selectedTask.jismoniyDocs.passportImageBack && (
                      <div className="preview-image">
                        <p>Pasport orqa qismi:</p>
                        <img 
                          src={selectedTask.jismoniyDocs.passportImageBack} 
                          alt="Pasport orqa qismi" 
                          width="150"
                          onClick={() => openImagePreview(selectedTask.jismoniyDocs.passportImageBack)}
                          className="clickable-image"
                        />
                      </div>
                    )}
                    {/* Boshqa ma'lumotlar... */}
                  </div>
                )}
              </div>
              
              <textarea
                placeholder="Izoh yoki qaydlar kiriting..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
              ></textarea>
              
              <button onClick={handleAcceptTask}>Ishni qabul qilish</button>
            </>
          )}
          
          <button className="close-button" onClick={() => setShowModal(false)}>Yopish</button>
        </div>
      </div>
    );
  };

  // Sidebar - hisobot bo'limi qo'shildi
  const renderSidebar = () => (
    <div className="yurist-sidebar">
      <h2>👨‍⚖️ Yurist Panel</h2>
      <div className="sidebar-links">
        <div 
          className={`sidebar-link ${selectedSection === 'yangi' ? 'active' : ''}`} 
          onClick={() => setSelectedSection('yangi')}
        >
          🟢 Yangi ishlar
        </div>
        <div 
          className={`sidebar-link ${selectedSection === 'jarayonda' ? 'active' : ''}`} 
          onClick={() => setSelectedSection('jarayonda')}
        >
          🟡 Jarayondagi ishlar
        </div>
        <div 
          className={`sidebar-link ${selectedSection === 'tugatilgan' ? 'active' : ''}`} 
          onClick={() => setSelectedSection('tugatilgan')}
        >
          ✅ Tugatilgan ishlar
        </div>
        <div 
          className={`sidebar-link ${selectedSection === 'hisobot' ? 'active' : ''}`} 
          onClick={() => setSelectedSection('hisobot')}
        >
          📊 Hisobotlar
        </div>
        <div 
          className="sidebar-link" 
          onClick={onLogout}
        >
          🚪 Chiqish
        </div>
      </div>
    </div>
  );

  // Ishonchnoma generatsiya qilish
  const generatePowerOfAttorney = (type) => {
    if (!selectedTask) return;
    
    const personType = selectedTask.personType || 'jismoniy';
    const docData = documentData[personType];
    const now = new Date();
    const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
    
    const clientInfo = personType === 'jismoniy' 
      ? `${selectedTask.clientName} ${selectedTask.clientSurname}, pasport: ${docData.passportInfo || 'Ma\'lumot kiritilmagan'}`
      : `${docData.companyName || selectedTask.clientName}, STIR: ${docData.stir || 'Ma\'lumot kiritilmagan'}`;
      
    // Ishonchnoma turlari
    const templateTypes = {
      registration: 'Patent/Tovar belgisini ro\'yxatdan o\'tkazish',
      renewal: 'Patent/Tovar belgisini yangilash',
      objection: 'Patent/Tovar belgisiga e\'tiroz bildirish',
      change: 'Patent/Tovar belgisiga o\'zgartirish kiritish'
    };
    
    const title = templateTypes[type] || templateTypes.registration;
    
    // HTML shablon
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2>ISHONCHNOMA / ДОВЕРЕННОСТЬ</h2>
          <p>Toshkent shahri, ${formattedDate} yil</p>
        </div>
        
        <p style="text-align: justify; line-height: 1.5;">
          Men, ${clientInfo}, patent va tovar belgilari bo'yicha ishonchli vakil _______________ ga mening nomimdan
          "${docData.brandName || selectedTask.brandName}" tovar belgisi bo'yicha <strong>${title}</strong> uchun
          O'zbekiston Respublikasi Intellektual mulk agentligiga (O'zpatent) mening nomimdan barcha hujjatlarni
          tayyorlash, topshirish va olib borish vakolatini beraman.
        </p>
        
        <p style="text-align: justify; line-height: 1.5;">
          Ushbu ishonchnoma imzolangan sanadan boshlab 1 (bir) yil muddatga berildi.
        </p>
        
        <div style="margin-top: 50px;">
          <p>Ishonch bildiruvchi: _______________________</p>
          <p>Sana: ${formattedDate}</p>
        </div>
      </div>
    `;
    
    // PDF yaratish
    const element = document.createElement('div');
    element.innerHTML = content;
    document.body.appendChild(element);
    
    const opt = {
      margin: 10,
      filename: `Ishonchnoma_${type}_${selectedTask.clientName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(element).set(opt).save().then(() => {
      document.body.removeChild(element);
    });
  };

  return (
    <div className="yurist-dashboard">
      {renderSidebar()}
      
      <div className="yurist-content">
        <div className="yurist-header">
          <h2>{
            selectedSection === 'yangi' ? 'Yangi ishlar' : 
            selectedSection === 'jarayonda' ? 'Jarayondagi ishlar' : 
            selectedSection === 'hisobot' ? 'Hisobotlar' :
            'Tugatilgan ishlar'
          }</h2>
          {profile && <p>Xush kelibsiz, {profile.firstName} {profile.lastName}</p>}
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {/* Izlash qismi */}
        {selectedSection !== 'hisobot' && (
          <div className="search-filters">
            <input 
              type="text"
              placeholder="Mijoz yoki ish ID bo'yicha izlash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="date-filters">
              <input 
                type="date"
                placeholder="Dan"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({...dateFilter, from: e.target.value})}
                className="date-input"
              />
              <input 
                type="date"
                placeholder="Gacha"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({...dateFilter, to: e.target.value})}
                className="date-input"
              />
            </div>
            <button onClick={fetchTasks} className="search-button">
              🔍 Izlash
            </button>
          </div>
        )}
        
        {/* Asosiy kontent */}
        {selectedSection === 'hisobot' ? (
          renderStatistics()
        ) : (
          <div className="tasks-container">
            {tasksLoading ? (
              <p>Yuklanmoqda...</p>
            ) : tasks.length === 0 ? (
              <p>Ishlar mavjud emas.</p>
            ) : (
              <div className="tasks-grid">
                {tasks.map(task => (
                  <div 
                    key={task._id} 
                    className={`task-card ${task.status}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <h4>#{task.jobId || task._id.slice(-5)} - {task.brandName}</h4>
                    <p>Mijoz: {task.clientName} {task.clientSurname}</p>
                    <p>Telefon: {task.phone}</p>
                    <p className="task-status">Status: {
                      task.status === 'to_lawyer' ? 'Yangi' :
                      task.status === 'lawyer_processing' ? 'Jarayonda' :
                      task.status === 'lawyer_completed' ? 'Yakunlangan' :
                      task.status
                    }</p>
                    {task.status === 'lawyer_processing' && (
                      <div className="task-upload">
                        <label className="file-upload-btn">
                          Guvohnoma yuklash
                          <input 
                            type="file" 
                            onChange={(e) => handleUploadCertificates(task._id, e.target.files[0])}
                            onClick={(e) => e.stopPropagation()}
                            accept=".rar"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {renderModal()}
      {renderImagePreviewModal()}
      
      <style jsx>{`
        /* Existing styles */
        
        .documents-form, .invoice-form, .certificate-upload {
          margin: 15px 0;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        
        .text-input, .file-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        textarea.text-input {
          min-height: 80px;
        }
        
        .image-preview {
          margin-top: 5px;
          display: inline-block;
          cursor: pointer;
          position: relative;
        }
        
        .image-preview img {
          border: 1px solid #ddd;
          padding: 3px;
          background: white;
        }
        
        .image-preview span {
          display: block;
          font-size: 12px;
          color: #666;
        }
        
        .steps-indicator {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        
        .step {
          flex: 1;
          text-align: center;
          padding: 10px 0;
          background: #f0f0f0;
          border-radius: 4px;
          margin: 0 5px;
          color: #666;
        }
        
        .step.active {
          background: #4CAF50;
          color: white;
          font-weight: bold;
        }
        
        .step-action-btn, .send-invoice-btn, .upload-certificate-btn {
          display: block;
          width: 100%;
          padding: 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          margin-top: 15px;
        }
        
        .step-action-btn:disabled, .send-invoice-btn:disabled, .upload-certificate-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        
        .file-info {
          margin-top: 5px;
          font-size: 13px;
          color: #666;
        }
        
        .image-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .image-preview-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
        }
        
        .image-preview-content img {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
          border: 2px solid white;
        }
        
        .close-preview-btn {
          position: absolute;
          top: -20px;
          right: -20px;
          background: white;
          color: black;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
        }
        
        .search-filters {
          display: flex;
          margin-bottom: 20px;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .search-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          min-width: 200px;
        }
        
        .date-filters {
          display: flex;
          gap: 10px;
        }
        
        .date-input {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 150px;
        }
        
        .search-button {
          padding: 10px 15px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .power-of-attorney-generator {
          margin: 20px 0;
          padding: 15px;
          background: #f0f7ff;
          border-radius: 5px;
          border-left: 3px solid #007bff;
        }
        
        .power-of-attorney-types {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        
        .power-btn {
          padding: 8px 12px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .power-btn:hover {
          background: #0056b3;
        }
        
        .statistics-container {
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .stat-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 6px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #4CAF50;
          margin-top: 10px;
        }
        
        .documents-preview {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        
        .document-item-preview {
          margin-bottom: 10px;
        }
        
        .preview-image {
          display: inline-block;
          margin: 10px;
          text-align: center;
        }
        
        .clickable-image {
          cursor: pointer;
          transition: transform 0.2s;
          border: 2px solid #ddd;
          border-radius: 4px;
        }
        
        .clickable-image:hover {
          transform: scale(1.05);
          border-color: #007bff;
        }
      `}</style>
    </div>
  );
}

export default YuristDashboard;