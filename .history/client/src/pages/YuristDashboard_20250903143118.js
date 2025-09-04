import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../utils/api';
import HistoryBlock from './components/HistoryBlock';
import './YuristDashboard.css';

function YuristDashboard({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
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
  const [selectedSection, setSelectedSection] = useState('yangi');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [statistics, setStatistics] = useState(null);
  // PoA
  const [poaData, setPoaData] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedClasses, setSelectedClasses] = useState([]);
  const token = localStorage.getItem('token');
  
  // Profilni olish
  const fetchProfile = useCallback(async () => {
    try {
  const res = await fetch(`${API_BASE}/api/users/me`, {
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

  const res = await fetch(`${API_BASE}/api/jobs?${queryParams.toString()}`, {
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
      const res = await fetch(`${API_BASE}/api/statistics/lawyer`, {
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
    // Auto step based on current job state
    const invs = Array.isArray(task.invoices) ? task.invoices : [];
    const hasPending = invs.some(i => i.status === 'pending');
    const hasReceipt = invs.some(i => i.status === 'receipt_uploaded');
    const isPaid = invs.some(i => i.status === 'paid');
    // Default to Step 2 (To'lov) so invoice upload UI is visible immediately
    if (isPaid || task.status === 'lawyer_completed') {
      setProcessingStep(3);
    } else if (hasPending || hasReceipt) {
      setProcessingStep(2);
    } else {
      setProcessingStep(2);
    }
    setPoaData(null);
    
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

  // Fetch Power of Attorney on demand if not present in documents
  useEffect(() => {
    const fetchPoa = async () => {
      if (!showModal || !selectedTask) return;
      const docs = Array.isArray(selectedTask.documents) ? selectedTask.documents : [];
      const hasDoc = docs.some(d => d.type === 'power-of-attorney');
      if (hasDoc) return;
      try {
        const res = await fetch(`${API_BASE}/api/job-actions/${selectedTask._id}/power-of-attorney`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) return; // quietly ignore
        const data = await res.json();
        if (data && (data.content || data.jshshr)) {
          setPoaData(data);
        }
      } catch (_) {}
    };
    fetchPoa();
  }, [showModal, selectedTask, token]);

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
      
  const res = await fetch(`${API_BASE}/api/job-actions/${selectedTask._id}/accept-by-lawyer`, {
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
  // Modalni yopmasdan, bosqichli interfeysni ko'rsatamiz
  setSelectedTask(prev => ({ ...(prev || {}), status: 'lawyer_processing' }));
  setProcessingStep(1);
  // Ro'yxatni fon rejimida yangilaymiz
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

  const res = await fetch(`${API_BASE}/api/job-actions/${selectedTask._id}/complete-by-lawyer`, {
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
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}/upload-certificates`, {
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

  // To'lov hisobini saqlash va yuborish - MKTU sinflarini ham yuborish
  const saveInvoiceAndNotifyClient = async () => {
    if (!selectedTask?._id) return;
    if (!invoiceFile) {
      alert('Iltimos, hisob faylini yuklang');
      return;
    }

    const formData = new FormData();
    formData.append('amount', invoiceAmount);
    formData.append('comment', invoiceComment);
    formData.append('invoiceFile', invoiceFile);
    
    // Add MKTU classes if available
    if (selectedClasses && selectedClasses.length > 0) {
      formData.append('classes', JSON.stringify(selectedClasses));
    }

    try {
  const res = await fetch(`${API_BASE}/api/job-actions/${selectedTask._id}/send-invoice`, {
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
  setProcessingStep(2);
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
  const res = await fetch(`${API_BASE}/api/job-actions/${selectedTask._id}/save-lawyer-docs`, {
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
        {Array.isArray(selectedTask?.invoices) && selectedTask.invoices.length > 0 && (
          <div className="invoice-status-list">
            {selectedTask.invoices.map((inv, idx) => (
              <div key={inv._id || idx} className={`invoice-status-item status-${inv.status}`}>
                <div>
                  <strong>Invoice</strong> {inv.amount ? `— ${inv.amount} so'm` : ''}
                  <span style={{marginLeft:8}}>Holat: {inv.status}</span>
                </div>
                {inv.filePath && (
                  <a href={`${API_BASE}/${String(inv.filePath).replace(/^\/?/, '')}`} target="_blank" rel="noreferrer">Fayl</a>
                )}
                {inv.receiptPath && (
                  <a style={{marginLeft:8}} href={`${API_BASE}/${String(inv.receiptPath).replace(/^\/?/, '')}`} target="_blank" rel="noreferrer">Chek</a>
                )}
                {inv.status === 'receipt_uploaded' && (
                  <button
                    className="step-action-btn"
                    onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE}/api/job-actions/${selectedTask._id}/invoices/${inv._id}/approve-receipt`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error(await res.text());
                        alert('To\'lov tasdiqlandi');
                        await fetchTasks();
                        setProcessingStep(3);
                      } catch (e) {
                        alert('Xatolik: ' + e.message);
                      }
                    }}
                  >Chekni tasdiqlash</button>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="form-group">
          <label>To'lov summasi (so'm) — ixtiyoriy</label>
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
          disabled={!invoiceFile}
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

  // Ishonchnoma preview uchun yangi funksiyalar qo'shamiz
  const [powerOfAttorneyPreview, setPowerOfAttorneyPreview] = useState(null);

  // Hujjatni ko'rish funksiyasi - xatoliklarni qayta ishlash bilan yangilangan
  const handlePowerOfAttorneyPreview = (content) => {
    if (!content) {
      alert("Hujjat mazmuni topilmadi");
      return;
    }
    console.log("Power of attorney content:", content);
    setPowerOfAttorneyPreview(content);
  };

  const downloadPowerOfAttorneyPdf = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE}/api/job-actions/${jobId}/power-of-attorney-pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('PDF olishda xatolik');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ishonchnoma_${selectedTask?.clientName || 'mijoz'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      alert('Xatolik: ' + e.message);
    }
  };

  const closePowerOfAttorneyPreview = () => {
    setPowerOfAttorneyPreview(null);
  };

  // Ishonchnoma preview modali
  const renderPowerOfAttorneyPreviewModal = () => {
    if (!powerOfAttorneyPreview) return null;
    
    return (
      <div className="power-of-attorney-preview-modal" onClick={closePowerOfAttorneyPreview}>
        <div className="power-of-attorney-preview-content">
          <button className="close-preview-btn" onClick={closePowerOfAttorneyPreview}>×</button>
          
          {/* Agar URL bo'lsa rasm ko'rinishida, aks holda HTML kontentida ko'rsatamiz */}
          {typeof powerOfAttorneyPreview === 'string' && (
            powerOfAttorneyPreview.startsWith('data:') || powerOfAttorneyPreview.startsWith('http') ? (
              <img src={powerOfAttorneyPreview} alt="Ishonchnoma" />
            ) : (
              <div className="power-of-attorney-html-content" dangerouslySetInnerHTML={{ __html: powerOfAttorneyPreview }} />
            )
          )}
        </div>
      </div>
    );
  };

  // Modal oyna - yangilangan interfeys va hujjatlar ko'rinishi bilan
  const renderModal = () => {
    if (!showModal || !selectedTask) return null;
    
    // Ishonchnoma mavjudligini tekshirish - yangilangan va kuchaytrilgan
  const documents = selectedTask.documents || [];
  const hasPowerOfAttorney = documents.some(d => d.type === 'power-of-attorney') || !!poaData;
    
    // Debugging
    console.log('Task documents:', documents);
    console.log('Has power of attorney:', hasPowerOfAttorney);
    console.log('MKTU Classes:', selectedTask.classes);
    
    // Get task-specific classes or fall back to global selectedClasses
    const classesToDisplay = selectedTask.classes && selectedTask.classes.length > 0 ? 
      selectedTask.classes : selectedClasses;
    
    console.log("renderModal: Classes to display:", classesToDisplay);
    
  return (
      <div className="modal">
        <div className="modal-content">
          <button className="close-button" onClick={() => setShowModal(false)}>Yopish</button>
          
          <div className="task-header">
            <h3>Ish #{selectedTask.jobId || selectedTask._id.slice(-5)} - {selectedTask.brandName}</h3>
            <span className={`status-tag status-${selectedTask.status}`}>
              {selectedTask.status === 'to_lawyer' ? 'Yangi' :
               selectedTask.status === 'lawyer_processing' ? 'Jarayonda' :
               selectedTask.status === 'lawyer_completed' ? 'Yakunlangan' :
               selectedTask.status}
            </span>
          </div>
          
          <div className="task-content-container">
            {/* Mijoz va brend ma'lumotlari */}
            <div className="task-main-info">
              <div className="info-card client-card">
                <div className="info-card-header">
                  <h4>👤 Mijoz ma'lumotlari</h4>
                </div>
                <div className="info-card-body">
                  <div className="info-row">
                    <span className="info-label">Mijoz:</span>
                    <span className="info-value">{selectedTask.clientName} {selectedTask.clientSurname}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Telefon:</span>
                    <span className="info-value">{selectedTask.phone}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Shaxs turi:</span>
                    <span className="info-value">
                      {selectedTask.personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="info-card brand-card">
                <div className="info-card-header">
                  <h4>🔖 Brand ma'lumotlari</h4>
                </div>
                <div className="info-card-body">
                  <div className="info-row">
                    <span className="info-label">Brand nomi:</span>
                    <span className="info-value">{selectedTask.brandName || 'Kiritilmagan'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">MKTU sinflari:</span>
                    <span className="info-value">
                      {selectedTask.classes && Array.isArray(selectedTask.classes) && selectedTask.classes.length > 0 
                       ? selectedTask.classes.map(c => String(c)).join(', ') 
                       : 'Kiritilmagan'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mavjud hujjatlar */}
            <div className="task-documents-section">
              <h4 className="section-title">📋 Mavjud hujjatlar</h4>
              
              {selectedTask.personType === 'yuridik' && selectedTask.yuridikDocs && (
                <div className="documents-container yuridik-docs">
                  <h5>🏢 Yuridik shaxs hujjatlari</h5>
                  <div className="info-table">
                    <div className="info-table-row">
                      <div className="info-table-cell header">Kompaniya nomi</div>
                      <div className="info-table-cell">{selectedTask.yuridikDocs.companyName}</div>
                    </div>
                    <div className="info-table-row">
                      <div className="info-table-cell header">STIR</div>
                      <div className="info-table-cell">{selectedTask.yuridikDocs.stir}</div>
                    </div>
                    <div className="info-table-row">
                      <div className="info-table-cell header">Kompaniya manzili</div>
                      <div className="info-table-cell">{selectedTask.yuridikDocs.companyAddress}</div>
                    </div>
                    {selectedTask.yuridikDocs.accountNumber && (
                      <div className="info-table-row">
                        <div className="info-table-cell header">Hisob raqami</div>
                        <div className="info-table-cell">{selectedTask.yuridikDocs.accountNumber}</div>
                      </div>
                    )}
                    {selectedTask.yuridikDocs.bankInfo && (
                      <div className="info-table-row">
                        <div className="info-table-cell header">Bank ma'lumotlari</div>
                        <div className="info-table-cell">{selectedTask.yuridikDocs.bankInfo}</div>
                      </div>
                    )}
                    {selectedTask.yuridikDocs.mfo && (
                      <div className="info-table-row">
                        <div className="info-table-cell header">MFO</div>
                        <div className="info-table-cell">{selectedTask.yuridikDocs.mfo}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Direktor pasporti va boshqa hujjatlar */}
                  <div className="document-images-container">
                    {selectedTask.yuridikDocs.directorPassportImage && (
                      <div className="document-preview">
                        <p className="doc-title">Direktor pasporti</p>
                        <img 
                          src={selectedTask.yuridikDocs.directorPassportImage} 
                          alt="Direktor pasporti" 
                          onClick={() => openImagePreview(selectedTask.yuridikDocs.directorPassportImage)}
                          className="document-thumbnail" 
                        />
                        <button className="view-doc-btn" onClick={() => openImagePreview(selectedTask.yuridikDocs.directorPassportImage)}>
                          Ko'rish
                        </button>
                      </div>
                    )}
                    
                    {selectedTask.yuridikDocs.logo && (
                      <div className="document-preview">
                        <p className="doc-title">Logo</p>
                        <img 
                          src={selectedTask.yuridikDocs.logo} 
                          alt="Logo" 
                          onClick={() => openImagePreview(selectedTask.yuridikDocs.logo)}
                          className="document-thumbnail" 
                        />
                        <button className="view-doc-btn" onClick={() => openImagePreview(selectedTask.yuridikDocs.logo)}>
                          Ko'rish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedTask.personType === 'jismoniy' && selectedTask.jismoniyDocs && (
                <div className="documents-container jismoniy-docs">
                  <h5>👤 Jismoniy shaxs hujjatlari</h5>
                  <div className="info-table">
                    <div className="info-table-row">
                      <div className="info-table-cell header">To'liq brend nomi</div>
                      <div className="info-table-cell">{selectedTask.jismoniyDocs.fullBrandName}</div>
                    </div>
                    <div className="info-table-row">
                      <div className="info-table-cell header">Yashash manzili</div>
                      <div className="info-table-cell">{selectedTask.jismoniyDocs.fullAddress}</div>
                    </div>
                  </div>
                  
                  {/* Pasport rasmlari */}
                  <div className="document-images-container">
                    {selectedTask.jismoniyDocs.passportImageFront && (
                      <div className="document-preview">
                        <p className="doc-title">Pasport (old qismi)</p>
                        <img 
                          src={selectedTask.jismoniyDocs.passportImageFront} 
                          alt="Pasport old qismi" 
                          onClick={() => openImagePreview(selectedTask.jismoniyDocs.passportImageFront)}
                          className="document-thumbnail" 
                        />
                        <button className="view-doc-btn" onClick={() => openImagePreview(selectedTask.jismoniyDocs.passportImageFront)}>
                          Ko'rish
                        </button>
                      </div>
                    )}
                    
                    {selectedTask.jismoniyDocs.passportImageBack && (
                      <div className="document-preview">
                        <p className="doc-title">Pasport (orqa qismi)</p>
                        <img 
                          src={selectedTask.jismoniyDocs.passportImageBack} 
                          alt="Pasport orqa qismi" 
                          onClick={() => openImagePreview(selectedTask.jismoniyDocs.passportImageBack)}
                          className="document-thumbnail" 
                        />
                        <button className="view-doc-btn" onClick={() => openImagePreview(selectedTask.jismoniyDocs.passportImageBack)}>
                          Ko'rish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Ishonchnoma mavjud bo'lsa - API yoki documents orqali */}
              {hasPowerOfAttorney ? (
                <div className="power-of-attorney-block">
                  <h5>📝 Ishonchnoma</h5>
                  <div className="power-of-attorney-content">
                    <div className="poa-badge">✅ Ishonchnoma mavjud</div>
                    <div style={{marginTop:8}}>
                      <button className="view-poa-btn" onClick={() => downloadPowerOfAttorneyPdf(selectedTask._id)}>PDF yuklab olish</button>
                    </div>
                    
                    {/* Ishonchnomani ko'rish tugmalari */}
                    {documents.filter(d => d.type === 'power-of-attorney').map((doc, index) => (
                      <div key={index} className="poa-document">
                        <span className="poa-document-label">
                          {selectedTask.personType === 'yuridik' ? 'Yuridik shaxs ishonchnomasi' : 'Jismoniy shaxs ishonchnomasi'} 
                          {documents.filter(d => d.type === 'power-of-attorney').length > 1 ? ` #${index+1}` : ''}
                        </span>
                        <button 
                          className="view-poa-btn"
                          onClick={() => handlePowerOfAttorneyPreview(doc.content || doc.url)}
                        >
                          Ko'rish
                        </button>
                        
                        {doc.createdAt && (
                          <span className="poa-date">
                            Yaratilgan sana: {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                    {!documents.some(d => d.type === 'power-of-attorney') && poaData?.content && (
                      <div className="poa-document">
                        <span className="poa-document-label">Ishonchnoma (API)</span>
                        <button className="view-poa-btn" onClick={() => handlePowerOfAttorneyPreview(poaData.content)}>
                          Ko'rish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="power-of-attorney-missing-block">
                  <h5>📝 Ishonchnoma</h5>
                  <div className="power-of-attorney-missing-content">
                    <div className="poa-badge missing">⚠️ Diqqat: Bu ish uchun ishonchnoma mavjud emas!</div>
                  </div>
                </div>
              )}
              
              {/* Harakatlar tarixi va izohlar */}
              {Array.isArray(selectedTask.history) && selectedTask.history.length > 0 && (
                <div className="comments-block">
                  <h5>💬 Izohlar / Tarix</h5>
                  <div className="comments-content">
                    <HistoryBlock history={selectedTask.history} />
                  </div>
                </div>
              )}

              {/* To'lovlar (invoice) holati */}
              {selectedTask.invoices && selectedTask.invoices.length > 0 && (
                <div className="documents-container">
                  <h5>💳 To'lovlar</h5>
                  {selectedTask.invoices.map((inv, idx) => (
                    <div key={inv._id || idx} className="poa-document">
                      <div className="poa-document-label">{inv.amount ? inv.amount + " so'm" : 'Summasiz'}</div>
                      <span className="poa-date">Holat: {inv.status === 'paid' ? 'To\'langan' : 'Kutilmoqda'}</span>
                      {inv.filePath && (
                        <a className="view-poa-btn" href={`${API_BASE}/${String(inv.filePath).replace(/^\/?/, '')}`} target="_blank" rel="noreferrer">Hisobni ochish</a>
                      )}
                      {inv.receiptPath && (
                        <a className="view-poa-btn" href={`${API_BASE}/${String(inv.receiptPath).replace(/^\/?/, '')}`} target="_blank" rel="noreferrer">Chekni ko'rish</a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Jarayondagi ishlar uchun bosqichli interfeys */}
            {(selectedTask.status === 'lawyer_processing' || selectedTask.status === 'to_lawyer') && (
              <div className="processing-steps-container">
                <div className="steps-indicator">
                  <div className={`step ${processingStep >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-name">Hujjatlar</div>
                  </div>
                  <div className="step-connector"></div>
                  <div className={`step ${processingStep >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-name">To'lov</div>
                  </div>
                  <div className="step-connector"></div>
                  <div className={`step ${processingStep >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-name">Guvohnoma</div>
                  </div>
                </div>
                
                <div className="process-step-content">
                  {processingStep === 1 && (
                    <>
                      <div className="docs-review-note">
                        <p>Quyidagi hujjatlarni sarlavhadagi ma'lumotlar bilan solishtirib chiqing. Agar hammasi to'g'ri bo'lsa, tasdiqlang va to'lov bosqichiga o'ting.</p>
                      </div>
                      {/* Hujjatlar ko'rinishi yuqorida "Mavjud hujjatlar" bo'limida bor */}
                      <button onClick={() => setProcessingStep(2)} className="step-action-btn">
                        Tasdiqlash va To'lov bosqichiga o'tish
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
              </div>
            )}
            
            {/* Yangi ishlar uchun qabul qilish - o'zgartirildi */}
            {selectedTask.status === 'to_lawyer' && (
              <div className="accept-task-container">
                <h4 className="section-title">🔄 Ishni qabul qilish</h4>
                
                {/* Ishonchnoma ma'lumotlari ko'rsatiladi - qo'shildi */}
                {hasPowerOfAttorney ? (
                  <div className="accept-poa-info">
                    <p className="poa-notice">✅ Ushbu ish uchun ishonchnoma yuqorida mavjud.</p>
                  </div>
                ) : (
                  <div className="accept-poa-warning">
                    <p className="poa-notice warning">⚠️ Diqqat: Bu ish uchun ishonchnoma mavjud emas!</p>
                  </div>
                )}
                
                <textarea
                  placeholder="Izoh yoki qaydlar kiriting..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="accept-comment-textarea"
                ></textarea>
                
                <button onClick={handleAcceptTask} className="accept-task-btn">
                  ✅ Ishni qabul qilish
                </button>
              </div>
            )}
          </div>
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
          className={`sidebar-link ${selectedSection === 'hisobot' ? 'active' : ''}`} 
          onClick={onLogout}
        >
          🚪 Chiqish
        </div>
      </div>
    </div>
  );

  // Statistikani ko'rsatish
  const renderStatistics = () => {
    return (
      <div className="statistics-container">
        <h3>Yurist ishlari hisoboti</h3>
        
        {!statistics ? (
          <p>Ma'lumotlar yuklanmoqda...</p>
        ) : (
          <div className="stats-cards">
            <div className="stat-card">
              <h4>Yangi ishlar</h4>
              <div className="stat-value">{statistics.newTasks || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Jarayondagi ishlar</h4>
              <div className="stat-value">{statistics.inProgressTasks || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Yakunlangan ishlar</h4>
              <div className="stat-value">{statistics.completedTasks || 0}</div>
            </div>
            <div className="stat-card">
              <h4>Bu oy yakunlangan</h4>
              <div className="stat-value">{statistics.completedThisMonth || 0}</div>
            </div>
            <div className="stat-card">
              <h4>O'rtacha bajarish vaqti</h4>
              <div className="stat-value">{statistics.averageCompletionTime || '-'}</div>
              <div>kun</div>
            </div>
          </div>
        )}
      </div>
    );
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
      {renderPowerOfAttorneyPreviewModal()} {/* Yangi modal qo'shildi */}
      
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
        
        /* Modal va Hujjatlar ko'rinishi uchun stillar */
        .modal-content {
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 0;
          border-radius: 12px;
        }
        
        .task-header {
          background: #1976D2;
          color: white;
          padding: 20px 24px;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .task-header h3 {
          margin: 0;
          font-size: 20px;
        }
        
        .status-tag {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-to_lawyer {
          background: #E3F2FD;
          color: #1976D2;
        }
        
        .status-lawyer_processing {
          background: #FFF8E1;
          color: #FFA000;
        }
        
        .status-lawyer_completed {
          background: #E8F5E9;
          color: #388E3C;
        }
        
        .task-content-container {
          padding: 24px;
        }
        
        .task-main-info {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-card {
          flex: 1;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .info-card-header {
          padding: 12px 16px;
        }
        
        .client-card .info-card-header {
          background: #2196F3;
          color: white;
        }
        
        .brand-card .info-card-header {
          background: #4CAF50;
          color: white;
        }
        
        .info-card-header h4 {
          margin: 0;
          font-size: 16px;
        }
        
        .info-card-body {
          padding: 16px;
          background: white;
        }
        
        .info-row {
          margin-bottom: 8px;
          display: flex;
        }
        
        .info-label {
          font-weight: 600;
          color: #555;
          width: 120px;
          flex-shrink: 0;
        }
        
        .info-value {
          color: #333;
          flex: 1;
        }
        
        .section-title {
          margin: 30px 0 16px 0;
          font-size: 18px;
          color: #333;
          border-bottom: 1px solid #e1e1e1;
          padding-bottom: 10px;
        }
        
        .documents-container {
          background: #f9f9f9;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .documents-container h5 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #333;
        }
        
        .yuridik-docs {
          border-left: 4px solid #673AB7;
        }
        
        .jismoniy-docs {
          border-left: 4px solid #FF9800;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          background: white;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .info-table-row {
          display: flex;
          border-bottom: 1px solid #e1e1e1;
        }
        
        .info-table-row:last-child {
          border-bottom: none;
        }
        
        .info-table-cell {
          padding: 12px 16px;
          font-size: 14px;
        }
        
        .info-table-cell.header {
          background: #f5f5f5;
          font-weight: 600;
          width: 180px;
          flex-shrink: 0;
        }
        
        .document-images-container {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 20px;
        }
        
        .document-preview {
          text-align: center;
          width: 150px;
        }
        
        .doc-title {
          font-size: 12px;
          color: #666;
          margin: 0 0 8px 0;
        }
        
        .document-thumbnail {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: transform 0.2s;
          border: 1px solid #e1e1e1;
        }
        
        .document-thumbnail:hover {
          transform: scale(1.05);
        }
        
        .view-doc-btn {
          background: #1976D2;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }
        
        .view-doc-btn:hover {
          background: #1565C0;
        }
        
        .power-of-attorney-block, .comments-block {
          background: #f9f9f9;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .power-of-attorney-block h5, .comments-block h5 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #333;
        }
        
        .poa-badge {
          display: inline-block;
          background: #E8F5E9;
          color: #388E3C;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }
        
        .comments-content {
          background: white;
          padding: 16px;
          border-radius: 6px;
          font-size: 14px;
          color: #333;
        }
        
        .processing-steps-container {
          margin: 40px 0;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 10px;
        }
        
        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
        }
        
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e0e0e0;
          color: #666;
          border-radius: 50%;
          font-weight: 600;
        }
        
        .step.active .step-number {
          background: #4CAF50;
          color: white;
        }
        
        .step-name {
          margin-top: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .step.active .step-name {
          color: #333;
          font-weight: 600;
        }
        
        .step-connector {
          flex: 1;
          height: 2px;
          background: #e0e0e0;
          margin: 0 10px;
          position: relative;
          top: -10px;
        }
        
        .process-step-content {
          background: white;
          padding: 20px;
          border-radius: 10px;
        }
        
        .accept-task-container {
          margin-top: 40px;
          text-align: center;
        }
        
        .accept-comment-textarea {
          width: 100%;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          resize: vertical;
          min-height: 120px;
          margin-bottom: 20px;
          font-size: 15px;
        }
        
        .accept-task-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .accept-task-btn:hover {
          background: #388E3C;
          transform: translateY(-2px);
        }
        
        .close-button {
          position: absolute;
          top: 18px;
          right: 18px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          z-index: 10;
        }
        
        .close-button:hover {
          background: rgba(255, 255, 255, 0.5);
        }
        
        /* Ishonchnoma ko'rinishi uchun stillar */
        .poa-document {
          background: white;
          border-radius: 6px;
          padding: 12px 16px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          border: 1px solid #e0e0e0;
        }
        
        .poa-document-label {
          font-weight: 600;
          color: #444;
          margin-right: 10px;
          flex: 1;
        }
        
        .view-poa-btn {
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        
        .view-poa-btn:hover {
          background: #388E3C;
        }
        
        .poa-date {
          font-size: 12px;
          color: #888;
          margin-top: 6px;
          width: 100%;
        }
        
        .power-of-attorney-preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
        }
        
        .power-of-attorney-preview-content {
          position: relative;
          width: 80%;
          height: 80%;
          max-width: 900px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          padding: 20px;
        }
        
        .power-of-attorney-preview-content img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }
        
        .power-of-attorney-html-content {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 20px;
          background: white;
        }
        
        .power-of-attorney-html-content h2 {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .power-of-attorney-html-content p {
          margin-bottom: 15px;
          line-height: 1.5;
        }
        
        /* Qo'shimcha stillar qo'shildi */
        .accept-poa-info {
          background: #e8f5e9;
          border-left: 4px solid #4caf50;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .accept-poa-warning {
          background: #fff8e1;
          border-left: 4px solid #ff9800;
          padding: 12px 16px;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        
        .poa-notice {
          margin: 0;
          font-size: 15px;
          font-weight: 500;
        }
        
        .poa-notice.warning {
          color: #e65100;
        }
      `}</style>
    </div>
  );
}

export default YuristDashboard;