import React, { useEffect, useState, useCallback } from 'react';
import SidebarTekshiruvchi from './components/SidebarTekshiruvchi';
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
  const openImagePreview = (imageUrl, e) => {
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
  const openInvoicePreview = (invoiceUrl, e) => {
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

  // Topshirishga tayyor hujjatlarni ko'rsatish - kengaytirilgan
  const renderDocumentsForReview = () => {
    return (
      <div className="dashboard-content">
        <h3>📝 Topshirishga tayyor hujjatlar</h3>
        {docsLoading ? (
          <p>Yuklanmoqda...</p>
        ) : documentsForReview.length === 0 ? (
          <p>Tekshirish uchun hujjatlar mavjud emas.</p>
        ) : (
          <div className="documents-list">
            {documentsForReview.map(doc => (
              <div key={doc._id} className="document-item">
                <div className="document-details">
                  <h4>{doc.brandName || 'Brend nomi mavjud emas'}</h4>
                  <p>Mijoz: {doc.clientName} {doc.clientSurname}</p>
                  <p>ID: {doc.jobId || doc._id.slice(-5)}</p>
                  <p>Shaxs turi: {doc.personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}</p>
                  
                  {/* Ishonchnoma borligi indikatori */}
                  {doc.hasPowerOfAttorney && (
                    <div className="document-badge">
                      <span className="badge success">✓ Ishonchnoma mavjud</span>
                    </div>
                  )}
                  
                  {doc.classes && Array.isArray(doc.classes) && doc.classes.length > 0 && (
                    <div className="classes-info">
                      <p>MKTU sinflari: {doc.classes.join(', ')}</p>
                    </div>
                  )}
                  
                  <div className="document-content">
                    {doc.personType === 'yuridik' && doc.yuridikDocs && (
                      <div className="yuridik-details">
                        <h5>Yuridik shaxs ma'lumotlari:</h5>
                        <p>MCHJ nomi: {doc.yuridikDocs.companyName}</p>
                        <p>Manzil: {doc.yuridikDocs.companyAddress}</p>
                        <p>STIR: {doc.yuridikDocs.stir}</p>
                        <p>OKED: {doc.yuridikDocs.oked}</p>
                        <p>Hisob raqami: {doc.yuridikDocs.accountNumber}</p>
                        <p>Bank ma'lumotlari: {doc.yuridikDocs.bankInfo}</p>
                        <p>MFO: {doc.yuridikDocs.mfo}</p>
                        <p>Brand nomi: {doc.yuridikDocs.patentBrandName}</p>
                        {doc.yuridikDocs.logo && (
                          <div className="document-image">
                            <p>Logo:</p>
                            <img 
                              src={doc.yuridikDocs.logo} 
                              alt="Logo" 
                              width="100" 
                              onClick={(e) => openImagePreview(doc.yuridikDocs.logo, e)}
                              className="clickable-image"
                            />
                          </div>
                        )}
                        {doc.yuridikDocs.directorPassportImage && (
                          <div className="document-image">
                            <p>Direktor pasporti:</p>
                            <img 
                              src={doc.yuridikDocs.directorPassportImage} 
                              alt="Direktor pasporti" 
                              width="100"
                              onClick={(e) => openImagePreview(doc.yuridikDocs.directorPassportImage, e)}
                              className="clickable-image"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {doc.personType === 'jismoniy' && doc.jismoniyDocs && (
                      <div className="jismoniy-details">
                        <h5>Jismoniy shaxs ma'lumotlari:</h5>
                        <p>Brand nomi: {doc.jismoniyDocs.fullBrandName}</p>
                        <p>Manzil: {doc.jismoniyDocs.fullAddress}</p>
                        
                        {doc.jismoniyDocs.passportImageFront && (
                          <div className="document-image">
                            <p>Pasport old qismi:</p>
                            <img 
                              src={doc.jismoniyDocs.passportImageFront} 
                              alt="Pasport old qismi" 
                              width="100"
                              onClick={(e) => openImagePreview(doc.jismoniyDocs.passportImageFront, e)}
                              className="clickable-image"
                            />
                          </div>
                        )}
                        
                        {doc.jismoniyDocs.passportImageBack && (
                          <div className="document-image">
                            <p>Pasport orqa qismi:</p>
                            <img 
                              src={doc.jismoniyDocs.passportImageBack} 
                              alt="Pasport orqa qismi" 
                              width="100"
                              onClick={(e) => openImagePreview(doc.jismoniyDocs.passportImageBack, e)}
                              className="clickable-image"
                            />
                          </div>
                        )}
                        
                        {/* For backwards compatibility */}
                        {doc.jismoniyDocs.passportImage && !doc.jismoniyDocs.passportImageFront && (
                          <div className="document-image">
                            <p>Pasport rasmi (eski format):</p>
                            <img 
                              src={doc.jismoniyDocs.passportImage} 
                              alt="Pasport" 
                              width="100"
                              onClick={(e) => openImagePreview(doc.jismoniyDocs.passportImage, e)}
                              className="clickable-image"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* To'lov invois ma'lumotlarini ko'rsatish */}
                    {doc.invoice && (
                      <div className="invoice-details">
                        <h5>To'lov ma'lumotlari:</h5>
                        <p>Summa: {doc.invoice.amount.toLocaleString()} so'm</p>
                        {doc.invoice.comment && <p>Izoh: {doc.invoice.comment}</p>}
                        {doc.invoice.fileUrl && (
                          <div className="document-image">
                            <p>To'lov hisobi:</p>
                            <button 
                              onClick={(e) => openInvoicePreview(doc.invoice.fileUrl, e)}
                              className="view-invoice-btn"
                            >
                              📄 To'lov hisobini ko'rish
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* To'lov cheki ma'lumotlarini ko'rsatish */}
                    {doc.payment && doc.payment.receiptUrl && (
                      <div className="payment-details">
                        <h5>To'lov cheki:</h5>
                        <div className="document-image">
                          <button 
                            onClick={(e) => openInvoicePreview(doc.payment.receiptUrl, e)}
                            className="view-invoice-btn"
                          >
                            🧾 To'lov chekini ko'rish
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="document-actions">
                  <textarea
                    placeholder="Izoh yoki qaydlar kiriting..."
                    value={doc._id === selectedTask?._id ? feedbackComment : ''}
                    onChange={(e) => {
                      if (doc._id === selectedTask?._id) {
                        setFeedbackComment(e.target.value);
                      } else {
                        setSelectedTask(doc);
                        setFeedbackComment(e.target.value);
                      }
                    }}
                  ></textarea>
                  
                  <div className="action-buttons">
                    <button 
                      className="approve-btn"
                      onClick={() => approveDocumentsAndSendToLawyer(doc._id, feedbackComment)}
                    >
                      ✅ Tasdiqlash va yuristga yuborish
                    </button>
                    <button 
                      className="return-btn"
                      onClick={() => returnDocumentsToOperator(doc._id, feedbackComment)}
                    >
                      ⬅️ Operatorga qaytarish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
                    <button onClick={() => handleReview(task)}>Tekshirish</button>
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
      `}</style>
    </div>
  );
}

export default TekshiruvchiDashboard;