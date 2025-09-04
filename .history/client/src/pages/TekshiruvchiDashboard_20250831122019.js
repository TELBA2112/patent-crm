import React, { useEffect, useState, useCallback } from 'react';
import SidebarTekshiruvchi from './components/SidebarTekshiruvchi';
import { getStoredMktuClasses, sharePowerOfAttorneyDocuments } from '../utils/mktuData';
import './TekshiruvchiDashboard.css';

function TekshiruvchiDashboard() {
  const [profile, setProfile] = useState(null);
  const [currentSection, setCurrentSection] = useState('brend');
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [brandStatus, setBrandStatus] = useState('');
  const [reason, setReason] = useState('');
  const [documentsForReview, setDocumentsForReview] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [showPowerOfAttorney, setShowPowerOfAttorney] = useState(false);
  const [powerOfAttorneyData, setPowerOfAttorneyData] = useState(null);
  const [powerOfAttorneyPreview, setPowerOfAttorneyPreview] = useState(null);
  const [jshshrInput, setJshshrInput] = useState('');
  const [selectedClasses, setSelectedClasses] = useState([]); // Add selectedClasses state
  const token = localStorage.getItem('token');

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

  // Fetch stored MKTU classes on init and when needed
  useEffect(() => {
    const storedClasses = getStoredMktuClasses();
    if (storedClasses && storedClasses.length > 0) {
      console.log("TekshiruvchiDashboard: Setting stored MKTU classes:", storedClasses);
      setSelectedClasses(storedClasses);
    }
    
    // Listen for MKTU class updates from other components
    const handleMktuClassesUpdated = (event) => {
      console.log("TekshiruvchiDashboard: MKTU classes updated event received:", event.detail.classes);
      setSelectedClasses(event.detail.classes);
    };
    
    document.addEventListener('mktuClassesUpdated', handleMktuClassesUpdated);
    
    return () => {
      document.removeEventListener('mktuClassesUpdated', handleMktuClassesUpdated);
    };
  }, []);

  // Ishlarni olish - yangilangan ishlar filtri bilan
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      // Bo'limga qarab filter qo'llash
      let status = '';
      if (currentSection === 'brend') {
        // Faqat tekshirishga yuborilgan ishlar
        status = 'brand_in_review';
      } else if (currentSection === 'korib_chiqilgan') {
        // Tekshiruvchi ko'rib chiqqan (tasdiqlangan yoki rad etilgan) ishlar
        status = 'approved,rejected,documents_pending,returned_to_operator';
      }

      console.log(`Tekshiruvchi dashboardi: ${currentSection} bo'limi uchun ishlar so'ralmoqda, status=${status}`);
      
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      
      const data = await res.json();
      console.log(`${data.length} ta ish topildi`);
      
      // Ishlarni qo'shimcha ma'lumotlar bilan boyitish
      const enrichedTasks = data.map(task => {
        const enrichedTask = {...task};
        
        // Rad etilgan ishlarni alohida belgilash
        if (task.status === 'rejected' || task.status === 'returned_to_operator') {
          enrichedTask.isRejected = true;
        }
        
        // Tasdiqlangan ishlarni alohida belgilash
        if (task.status === 'approved' || task.status === 'documents_pending') {
          enrichedTask.isApproved = true;
        }
        
        return enrichedTask;
      });
      
      setTasks(enrichedTasks);
      
      // Ensure selected classes are updated from stored values
      const storedClasses = getStoredMktuClasses();
      if (storedClasses && storedClasses.length > 0) {
        setSelectedClasses(storedClasses);
      }
    } catch (err) {
      console.error('Ishlarni olishda xatolik:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [token, currentSection]);

  // Hujjatlarni olish funksiyasi - kengaytirilgan
  const fetchDocumentsForReview = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=documents_submitted', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Hujjatlarni olishda xatolik');
      
      const data = await res.json();
      console.log(`${data.length} ta hujjat topildi`);
      
      // Hujjatlarni boyitish - ishonchnoma ma'lumotlari bilan
      const enrichedDocs = data.map(doc => {
        // Har bir hujjat uchun ishonchnomalar borligi tekshiriladi
        const hasPowerOfAttorney = doc.documents?.some(d => d.type === 'power-of-attorney');
        
        return {
          ...doc,
          hasPowerOfAttorney
        };
      });
      
      setDocumentsForReview(enrichedDocs);
    } catch (err) {
      console.error('Hujjatlarni olishda xatolik:', err);
    } finally {
      setDocsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
    
    // Bo'lim o'zgarishiga qarab tegishli ma'lumotlarni yuklash
    if (currentSection === 'brend') {
      fetchTasks();
    } else if (currentSection === 'korib_chiqilgan') {
      fetchTasks();
    } else if (currentSection === 'hujjatlar') {
      fetchDocumentsForReview();
    }
  }, [token, currentSection, fetchTasks, fetchProfile, fetchDocumentsForReview]);

  const handleReview = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    if (!brandStatus) return alert("Iltimos, brend holatini tanlang.");
    if (brandStatus === 'rejected' && !reason) return alert("Rad etish sababini kiriting.");
  
    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/review-brand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: brandStatus === 'approved' ? 'approved' : 'rejected',
          reason: brandStatus === 'rejected' ? reason : '',
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Server javobi:', errorText);
        throw new Error(`Statusni yangilashda xatolik: ${res.status} - ${errorText}`);
      }
  
      alert('Ish muvaffaqiyatli yangilandi!');
      
      // Modal oynani yopish va ma'lumotlarni tozalash
      setShowModal(false);
      setSelectedTask(null);
      setBrandStatus('');
      setReason('');
      
      // Tasklari yangilash - tekshirilgan ish endi ro'yxatda bo'lmaydi
      fetchTasks();
    } catch (err) {
      console.error('Xatolik yuz berdi:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  // Hujjatlarni tasdiqlash va yuristga yuborish
  const approveDocumentsAndSendToLawyer = async (taskId, comment) => {
    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${taskId}/send-to-lawyer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment: comment || 'Hujjatlar tekshirildi va tasdiqlandi' })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Yuristga yuborishda xatolik: ${errorText}`);
      }
      
      alert('Hujjatlar tasdiqlandi va yuristga yuborildi');
      fetchDocumentsForReview();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  // Hujjatlarni operatorga qaytarish
  const returnDocumentsToOperator = async (taskId, comment) => {
    if (!comment) {
      return alert('Iltimos, qaytarish sababini kiriting');
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${taskId}/return-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: comment })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Operatorga qaytarishda xatolik: ${errorText}`);
      }
      
      alert('Hujjatlar operatorga qaytarildi');
      fetchDocumentsForReview();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  const onLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Modal dialog ko'rsatish
  const renderModal = () => {
    if (!showModal || !selectedTask) return null;
    return (
      <div className="modal">
        <div className="modal-content">
          <h3>"{selectedTask.brandName}" brendini tekshirish</h3>
          <p>Mijoz: {selectedTask.clientName} {selectedTask.clientSurname}</p>
          <p>Telefon: {selectedTask.phone}</p>
          <div className="modal-actions">
            <button
              onClick={() => setBrandStatus('approved')}
              className={brandStatus === 'approved' ? 'active' : ''}
            >
              Ma'qullash
            </button>
            <button
              onClick={() => setBrandStatus('rejected')}
              className={brandStatus === 'rejected' ? 'active' : ''}
            >
              Rad etish
            </button>
          </div>
          {brandStatus === 'rejected' && (
            <textarea
              placeholder="Rad etish sababini kiriting..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          )}
          <div className="modal-footer">
            <button onClick={handleModalSubmit} disabled={!brandStatus || (brandStatus === 'rejected' && !reason)}>
              Saqlash
            </button>
            <button onClick={() => setShowModal(false)} className="cancel"> 
              Bekor qilish
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Rasmni katta ko'rinishda ochish
  const handleImagePreview = (imageUrl, e) => {
    e.preventDefault();
    e.stopPropagation();
    setImagePreview(imageUrl);
  };

  // Rasm prevyu modalni yopish
  const closeImagePreview = () => {
    setImagePreview(null);
  };

  // Rasm prevyu modalni ko'rsatish
  const renderImagePreviewModal = () => {
    if (!imagePreview) return null;
    
    return (
      <div className="image-preview-modal" onClick={closeImagePreview}>
        <div className="image-preview-content">
          <button className="close-preview-btn" onClick={closeImagePreview}>×</button>
          <img src={imagePreview} alt="Katta ko'rinish" />
        </div>
      </div>
    );
  };

  // Invoice/chekni ko'rish
  const handleInvoicePreview = (invoiceUrl, e) => {
    e.preventDefault();
    e.stopPropagation();
    setInvoicePreview(invoiceUrl);
  };

  // Invoice modalni yopish
  const closeInvoicePreview = () => {
    setInvoicePreview(null);
  };

  // To'lov cheki yoki invoice'ni ko'rsatish uchun modal
  const renderInvoicePreviewModal = () => {
    if (!invoicePreview) return null;
    
    // PDF formatdagi fayllar uchun
    if (invoicePreview.endsWith('.pdf')) {
      return (
        <div className="invoice-preview-modal" onClick={closeInvoicePreview}>
          <div className="invoice-preview-content">
            <button className="close-preview-btn" onClick={closeInvoicePreview}>×</button>
            <iframe src={invoicePreview} width="100%" height="100%" title="PDF viewer"></iframe>
          </div>
        </div>
      );
    }
    
    // Rasm formatidagi fayllar uchun
    return (
      <div className="invoice-preview-modal" onClick={closeInvoicePreview}>
        <div className="invoice-preview-content">
          <button className="close-preview-btn" onClick={closeInvoicePreview}>×</button>
          <img src={invoicePreview} alt="To'lov cheki" />
        </div>
      </div>
    );
  };

  // Ishonchnoma yaratish funksiyasi - avtomatik to'ldirish bilan - yangilangan
  const generatePowerOfAttorney = (task, type) => {
    if (!task) return;
    
    const now = new Date();
    const formattedDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
    
    // Debug the task object to see what's actually coming in
    console.log('Task object in generatePowerOfAttorney:', task);
    
    // Extract class numbers properly - ensuring we're getting just the numbers
    let classNumbers = [];
    
    if (task.classes && Array.isArray(task.classes)) {
      // Make sure we're only getting the numbers, not objects
      classNumbers = task.classes.map(item => {
        // Handle both number and string formats
        if (typeof item === 'object' && item.classNumber) {
          return item.classNumber;
        }
        return Number(item) || item; // Convert to number if possible
      });
    } else {
      // Try to get classes from localStorage if not in task
      const storedClasses = getStoredMktuClasses();
      if (storedClasses && storedClasses.length > 0) {
        classNumbers = storedClasses;
      }
    }
    
    console.log('Extracted class numbers:', classNumbers);
    
    // Format the class numbers as a string for display
    const classesString = classNumbers.length > 0 ? 
      classNumbers.join(', ') : '[Sinf tanlanmagan]';
    
    console.log('Final classesString for display:', classesString);
    
    let powerOfAttorneyContent = '';
    let fileName = '';
    
    if (type === 'jismoniy') {
      // Jismoniy shaxs uchun ishonchnoma
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
      // Yuridik shaxs uchun ishonchnoma
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
    
    // Store the actual class numbers in the data structure
    const powerOfAttorneyData = {
      content: powerOfAttorneyContent,
      fileName: fileName,
      classes: classNumbers
    };
    
    setPowerOfAttorneyData(powerOfAttorneyData);
    setPowerOfAttorneyPreview(powerOfAttorneyContent);
    setShowPowerOfAttorney(true);
    
    // Share the power of attorney document with other dashboards
    sharePowerOfAttorneyDocuments(powerOfAttorneyData);
  };

  // Ishonchnomani Word formatida yuklab olish va serverga saqlash - yangilangan
  const downloadPowerOfAttorney = async () => {
    if (!powerOfAttorneyData || !selectedTask) return;
    
    try {
      // HTML to DOCX conversion (client-side)
      const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Ishonchnoma</title></head><body>";
      const postHtml = "</body></html>";
      const html = preHtml + powerOfAttorneyData.content + postHtml;
      
      // Save the power of attorney to the server with proper classes
      // Extract class numbers from the task or from our stored data
      const classNumbers = powerOfAttorneyData.classes || 
                         (selectedTask.classes && Array.isArray(selectedTask.classes) ? 
                          selectedTask.classes.map(c => typeof c === 'object' ? c.classNumber : Number(c) || c) : 
                          []);
      
      console.log('Class numbers to be saved with power of attorney:', classNumbers);
      
      // Serverga ishonchnomani saqlash
      const poa_res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/save-power-of-attorney`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: powerOfAttorneyData.content,
          personType: selectedTask.personType || 'jismoniy',
          classes: classNumbers // Send just the array of class numbers
        })
      });

      if (!poa_res.ok) {
        const errorData = await poa_res.json().catch(() => ({}));
        console.error('Power of attorney save error:', errorData);
        throw new Error('Ishonchnomani serverga saqlashda xatolik');
      }
      
      const saveResponse = await poa_res.json();
      console.log('Power of attorney saved successfully:', saveResponse);
      
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
      
      alert('Ishonchnoma muvaffaqiyatli yaratildi va saqlandi!');
    } catch (error) {
      console.error('Ishonchnomani yuklab olishda xatolik:', error);
      alert('Ishonchnomani yuklab olishda xatolik yuz berdi');
    }
  };

  // Ishonchnoma modal oynasi
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
            <button onClick={downloadPowerOfAttorney} className="download-btn">
              <i className="download-icon">📥</i> Word formatida yuklab olish
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Task ishlarni ko'rsatish qismiga ishonchnoma tugmasi qo'shish - bu endi kerak emas brend tekshirish bo'limida
  const renderTaskActions = (task) => {
    return (
      <div className="task-actions">
        <button onClick={() => handleReview(task)}>Tekshirish</button>
        {/* Ishonchnoma yaratish tugmalarini olib tashlaymiz */}
      </div>
    );
  };

  // Hujjatlarni ko'rib chiqish uchun kontent - Chiroyli va tushunarliroq formatlangan
  const renderDocumentsForReview = () => {
    return (
      <div className="dashboard-content">
        <h3>📄 Hujjatlar ko'rib chiqish</h3>
        {docsLoading ? (
          <p>Yuklanmoqda...</p>
        ) : documentsForReview.length === 0 ? (
          <p>Ko'rib chiqish uchun hujjatlar mavjud emas.</p>
        ) : (
          <div className="documents-list">
            {documentsForReview.map(doc => (
              <div key={doc._id} className="document-item">
                <div className="document-info">
                  <h4>{doc.brandName || 'Brand nomi mavjud emas'}</h4>
                  
                  <div className="client-info-card">
                    <div className="client-info-header">
                      <h5>👤 Mijoz ma'lumotlari</h5>
                    </div>
                    <div className="client-info-body">
                      <div className="info-row">
                        <span className="info-label">Mijoz:</span>
                        <span className="info-value">{doc.clientName} {doc.clientSurname}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Telefon:</span>
                        <span className="info-value">{doc.phone}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">ID:</span>
                        <span className="info-value">{doc.jobId || doc._id.slice(-5)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Shaxs turi:</span>
                        <span className="info-value">{doc.personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {doc.personType === 'yuridik' && doc.yuridikDocs && (
                    <div className="detailed-info-card yuridik-card">
                      <div className="detailed-info-header">
                        <h5>🏢 Yuridik shaxs ma'lumotlari</h5>
                      </div>
                      <div className="detailed-info-body">
                        <div className="info-row">
                          <span className="info-label">Kompaniya:</span>
                          <span className="info-value">{doc.yuridikDocs.companyName}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">STIR:</span>
                          <span className="info-value">{doc.yuridikDocs.stir}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Manzil:</span>
                          <span className="info-value">{doc.yuridikDocs.companyAddress}</span>
                        </div>
                        {doc.yuridikDocs.directorPassportImage && (
                          <div className="document-image-container">
                            <p className="image-title">Direktor pasporti:</p>
                            <img 
                              src={doc.yuridikDocs.directorPassportImage} 
                              alt="Direktor pasporti" 
                              onClick={(e) => handleImagePreview(doc.yuridikDocs.directorPassportImage, e)}
                              className="document-thumbnail" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {doc.personType === 'jismoniy' && doc.jismoniyDocs && (
                    <div className="detailed-info-card jismoniy-card">
                      <div className="detailed-info-header">
                        <h5>👤 Jismoniy shaxs ma'lumotlari</h5>
                      </div>
                      <div className="detailed-info-body">
                        <div className="info-row">
                          <span className="info-label">Brand nomi:</span>
                          <span className="info-value">{doc.jismoniyDocs.fullBrandName}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Manzil:</span>
                          <span className="info-value">{doc.jismoniyDocs.fullAddress}</span>
                        </div>
                        <div className="document-images">
                          <div className="document-image-container">
                            <p className="image-title">Pasport old qismi:</p>
                            {doc.jismoniyDocs.passportImageFront && (
                              <img 
                                src={doc.jismoniyDocs.passportImageFront} 
                                alt="Pasport old qismi" 
                                onClick={(e) => handleImagePreview(doc.jismoniyDocs.passportImageFront, e)}
                                className="document-thumbnail" 
                              />
                            )}
                          </div>
                          <div className="document-image-container">
                            <p className="image-title">Pasport orqa qismi:</p>
                            {doc.jismoniyDocs.passportImageBack && (
                              <img 
                                src={doc.jismoniyDocs.passportImageBack} 
                                alt="Pasport orqa qismi" 
                                onClick={(e) => handleImagePreview(doc.jismoniyDocs.passportImageBack, e)}
                                className="document-thumbnail" 
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="brand-info-card">
                    <div className="brand-info-header">
                      <h5>🔖 Brand ma'lumotlari</h5>
                    </div>
                    <div className="brand-info-body">
                      <div className="info-row">
                        <span className="info-label">Brand nomi:</span>
                        <span className="info-value">{doc.brandName}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">MKTU sinflari:</span>
                        <span className="info-value">{doc.classes ? doc.classes.join(', ') : 'Kiritilmagan'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ishonchnoma belgisi */}
                  {doc.hasPowerOfAttorney && (
                    <div className="document-badge">
                      <span className="badge success">Ishonchnoma mavjud</span>
                    </div>
                  )}
                  
                  {/* Chekni ko'rish tugmasi */}
                  {doc.invoice && (
                    <button 
                      onClick={(e) => handleInvoicePreview(doc.invoice, e)}
                      className="view-invoice-btn"
                    >
                      To'lov chekini ko'rish
                    </button>
                  )}
                  
                  {/* Ishonchnoma tugmalarini bu yerga ko'chiramiz */}
                  <div className="power-of-attorney-section">
                    <h5>📝 Ishonchnoma yaratish</h5>
                    <div className="power-of-attorney-buttons">
                      {doc.personType === 'jismoniy' && (
                        <div className="jshshr-input-container">
                          <input 
                            type="text" 
                            placeholder="JSHSHR raqamini kiriting..."
                            value={jshshrInput}
                            onChange={(e) => setJshshrInput(e.target.value)}
                            className="jshshr-input"
                          />
                          <button 
                            onClick={() => {
                              if (!jshshrInput) {
                                alert('JSHSHR raqamini kiriting');
                                return;
                            }
                            generatePowerOfAttorney(doc, 'jismoniy');
                          }}
                          className="btn-power-jismoniy"
                          disabled={!jshshrInput}
                        >
                          📄 Jismoniy ishonchnoma yaratish
                        </button>
                        </div>
                      )}
                      {doc.personType === 'yuridik' && (
                        <button 
                          onClick={() => generatePowerOfAttorney(doc, 'yuridik')} 
                          className="btn-power-yuridik"
                        >
                          📄 Yuridik ishonchnoma yaratish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="document-actions">
                  <h5>✏️ Qaror va izohlar</h5>
                  <textarea 
                    placeholder="Izoh yoki qayd..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="feedback-input"
                  ></textarea>
                  <div className="action-buttons">
                    <button 
                      onClick={() => approveDocumentsAndSendToLawyer(doc._id, feedbackComment)}
                      className="approve-btn"
                    >
                      ✅ Tasdiqlash va yuristga yuborish
                    </button>
                    <button 
                      onClick={() => returnDocumentsToOperator(doc._id, feedbackComment)}
                      className="return-btn"
                    >
                      ⬅️ Operatorga qaytarish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <style jsx>{`
          /* Yangi dizayn stillar */
          .documents-list {
            display: flex;
            flex-direction: column;
            gap: 30px;
          }
          
          .document-item {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            padding: 24px;
            transition: transform 0.2s;
            border-left: 4px solid #4CAF50;
          }
          
          .document-item h4 {
            font-size: 22px;
            color: #2196F3;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e1e1e1;
          }
          
          .client-info-card, .detailed-info-card, .brand-info-card {
            background: #f9f9f9;
            border-radius: 8px;
            padding: 0;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            overflow: hidden;
          }
          
          .client-info-header, .detailed-info-header, .brand-info-header {
            background: #2196F3;
            color: white;
            padding: 12px 16px;
          }
          
          .client-info-header h5, .detailed-info-header h5, .brand-info-header h5 {
            margin: 0;
            font-size: 16px;
          }
          
          .client-info-body, .detailed-info-body, .brand-info-body {
            padding: 16px;
          }
          
          .yuridik-card .detailed-info-header {
            background: #673AB7;
          }
          
          .jismoniy-card .detailed-info-header {
            background: #FF9800;
          }
          
          .brand-info-header {
            background: #4CAF50;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: center;
          }
          
          .info-label {
            flex: 0 0 120px;
            font-weight: 600;
            color: #555;
          }
          
          .info-value {
            flex: 1;
            color: #333;
          }
          
          .document-images {
            display: flex;
            gap: 15px;
            margin-top: 15px;
            flex-wrap: wrap;
          }
          
          .document-image-container {
            text-align: center;
            margin-top: 12px;
          }
          
          .image-title {
            font-size: 14px;
            color: #555;
            margin-bottom: 8px;
          }
          
          .document-thumbnail {
            max-width: 150px;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
          }
          
          .document-thumbnail:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          
          .power-of-attorney-section {
            margin: 20px 0;
            padding: 16px;
            background: #f0f8ff;
            border-radius: 8px;
            border: 1px solid #c7dcff;
          }
          
          .power-of-attorney-section h5 {
            margin: 0 0 12px 0;
            color: #1976D2;
          }
          
          .jshshr-input-container {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .jshshr-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          
          .document-actions {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e1e1e1;
          }
          
          .document-actions h5 {
            margin: 0 0 10px 0;
            color: #333;
          }
          
          .feedback-input {
            width: 100%;
            height: 100px;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 6px;
            margin-bottom: 16px;
            resize: vertical;
          }
          
          .action-buttons {
            display: flex;
            gap: 15px;
          }
          
          .approve-btn, .return-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
          }
          
          .approve-btn {
            background-color: #4CAF50;
            color: white;
          }
          
          .return-btn {
            background-color: #FF5722;
            color: white;
          }
          
          .approve-btn:hover {
            background-color: #388E3C;
            transform: translateY(-2px);
          }
          
          .return-btn:hover {
            background-color: #E64A19;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    );
  };

  // Kontent renderini hozirgi bo'limga qarab yaratish
  const renderContent = () => {
    switch (currentSection) {
      case 'profil':
        return (
          <div className="dashboard-content">
            <h3>👤 Profil ma'lumotlari</h3>
            {profile ? (
              <div className="profile-details">
                <p><strong>Ism:</strong> {profile.firstName} {profile.lastName}</p>
                <p><strong>Login:</strong> {profile.username}</p>
                <p><strong>Lavozim:</strong> Tekshiruvchi</p>
              </div>
            ) : (
              <p>Profil yuklanmoqda...</p>
            )}
          </div>
        );
      case 'brend':
        return (
          <div className="dashboard-content">
            <h3>📄 Brend tekshirish</h3>
            {tasksLoading ? (
              <p>Yuklanmoqda...</p>
            ) : tasks.length === 0 ? (
              <p>Tekshirish uchun ishlar mavjud emas.</p>
            ) : (
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task._id} className="task-item">
                    <div className="task-details">
                      <h4>{task.brandName || 'Brend nomi mavjud emas'}</h4>
                      <p>Mijoz: {task.clientName} {task.clientSurname}</p>
                      <p>Telefon: {task.phone}</p>
                      <p>ID: {task.jobId || task._id.slice(-5)}</p>
                    </div>
                    {renderTaskActions(task)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'korib_chiqilgan':
        return (
          <div className="dashboard-content">
            <h3>📝 Ko'rib chiqilgan brendlar</h3>
            {tasksLoading ? (
              <p>Yuklanmoqda...</p>
            ) : tasks.length === 0 ? (
              <p>Ko'rib chiqilgan ishlar mavjud emas.</p>
            ) : (
              <div className="task-list">
                {tasks.map(task => (
                  <div key={task._id} 
                       className={`task-item ${task.isRejected ? 'rejected-item' : ''} ${task.isApproved ? 'approved-item' : ''}`}>
                    <div className="task-details">
                      <h4>{task.brandName || 'Brend nomi mavjud emas'}</h4>
                      <p>Mijoz: {task.clientName} {task.clientSurname}</p>
                      <p>Status: 
                        <span className={`status-${task.status}`}>
                          {task.status === 'approved' ? 'Tasdiqlandi' : 
                           task.status === 'rejected' ? 'Rad etildi' : 
                           task.status === 'documents_pending' ? 'Hujjatlar kutilmoqda' :
                           task.status === 'returned_to_operator' ? 'Operatorga qaytarildi' :
                           task.status}
                        </span>
                      </p>
                      <p>ID: {task.jobId || task._id.slice(-5)}</p>
                      {task.comments && <p>Izoh: {task.comments}</p>}
                      <p>Sana: {new Date(task.history[task.history.length - 1]?.date || task.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'hujjatlar':
        return renderDocumentsForReview();
        
      default:
        return null;
    }
  };

  // Asosiy render
  return (
    <div className="tekshiruvchi-wrapper">
      <SidebarTekshiruvchi 
        current={currentSection} 
        setCurrent={setCurrentSection} 
        onLogout={onLogout} 
      />
      <div className="tekshiruvchi-main">
        {renderContent()}
        {renderModal()}
        {renderImagePreviewModal()}
        {renderInvoicePreviewModal()}
        {renderPowerOfAttorneyModal()}
      </div>
      
      <style jsx>{`
        /* Existing styles */
        
        .document-badge {
          margin: 5px 0;
        }
        
        .badge {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .badge.success {
          background-color: #e6f7e6;
          color: #4CAF50;
          border: 1px solid #4CAF50;
        }
        
        .view-invoice-btn {
          padding: 5px 10px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 5px;
        }
        
        .view-invoice-btn:hover {
          background-color: #0b7dda;
        }
        
        .invoice-preview-modal {
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
        
        .invoice-preview-content {
          position: relative;
          width: 80%;
          height: 80%;
          background: white;
          padding: 20px;
          border-radius: 8px;
        }
        
        .invoice-preview-content img, 
        .invoice-preview-content iframe {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border: none;
        }
        
        .invoice-details, .payment-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        
        .power-of-attorney-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .power-of-attorney-content {
          position: relative;
          width: 80%;
          height: 80%;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .power-of-attorney-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #f0f0f0;
          border-bottom: 1px solid #ddd;
        }
        
        .power-of-attorney-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #555;
        }
        
        .power-of-attorney-preview {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: #fff;
        }
        
        .power-of-attorney-actions {
          padding: 15px 20px;
          background-color: #f9f9f9;
          border-top: 1px solid #ddd;
          text-align: right;
        }
        
        .download-btn {
          padding: 10px 15px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .download-btn:hover {
          background-color: #45a049;
        }
        
        .download-icon {
          font-style: normal;
        }
        
        .power-of-attorney-buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }
        
        .btn-power-jismoniy, .btn-power-yuridik {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-power-jismoniy {
          background-color: #9c27b0;
          color: white;
        }
        
        .btn-power-yuridik {
          background-color: #2196F3;
          color: white;
        }
        
        .btn-power-jismoniy:hover {
          background-color: #7B1FA2;
        }
        
        .btn-power-yuridik:hover {
          background-color: #1976D2;
        }
        
        .task-actions {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}

export default TekshiruvchiDashboard;