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

  // Hujjatlarni olish funksiyasi
  const fetchDocumentsForReview = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=documents_submitted', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Hujjatlarni olishda xatolik');
      
      const data = await res.json();
      console.log(`${data.length} ta hujjat topildi`);
      setDocumentsForReview(data);
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

  // Topshirishga tayyor hujjatlarni ko'rsatish
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
                            <img src={doc.yuridikDocs.logo} alt="Logo" width="100" />
                          </div>
                        )}
                        {doc.yuridikDocs.directorPassportImage && (
                          <div className="document-image">
                            <p>Direktor pasporti:</p>
                            <img src={doc.yuridikDocs.directorPassportImage} alt="Direktor pasporti" width="100" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {doc.personType === 'jismoniy' && doc.jismoniyDocs && (
                      <div className="jismoniy-details">
                        <h5>Jismoniy shaxs ma'lumotlari:</h5>
                        <p>Brand nomi: {doc.jismoniyDocs.fullBrandName}</p>
                        <p>Manzil: {doc.jismoniyDocs.fullAddress}</p>
                        {doc.jismoniyDocs.passportImage && (
                          <div className="document-image">
                            <p>Pasport rasmi:</p>
                            <img src={doc.jismoniyDocs.passportImage} alt="Pasport" width="100" />
                          </div>
                        )}
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
      </div>
    </div>
  );
}

export default TekshiruvchiDashboard;