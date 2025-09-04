import React, { useEffect, useState, useCallback } from 'react';
import SidebarYurist from './components/SidebarYurist';
import { getStoredMktuClasses } from '../utils/mktuData';
import PowerOfAttorneyViewer from './components/PowerOfAttorneyViewer';
import './YuristDashboard.css';

function YuristDashboard() {
  const [profile, setProfile] = useState(null);
  const [currentSection, setCurrentSection] = useState('yangi');
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [processingNote, setProcessingNote] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    paymentDate: '',
    invoiceNumber: '',
    paymentMethod: 'cash'
  });
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState('');
  
  const token = localStorage.getItem('token');
  // eslint-disable-next-line no-unused-vars
  const [selectedClasses, setSelectedClasses] = useState([]);

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

  // Add useEffect to initialize selectedClasses from storage
  useEffect(() => {
    const storedClasses = getStoredMktuClasses();
    if (storedClasses && storedClasses.length > 0) {
      console.log("YuristDashboard: Setting stored MKTU classes:", storedClasses);
      setSelectedClasses(storedClasses);
    }
    
    // Listen for MKTU class updates from other components
    const handleMktuClassesUpdated = (event) => {
      console.log("YuristDashboard: MKTU classes updated event received:", event.detail.classes);
      setSelectedClasses(event.detail.classes);
    };
    
    document.addEventListener('mktuClassesUpdated', handleMktuClassesUpdated);
    
    return () => {
      document.removeEventListener('mktuClassesUpdated', handleMktuClassesUpdated);
    };
  }, []);

  // Fetch tasks based on current section
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      let status = '';
      
      if (currentSection === 'yangi') {
        // Yangi kelgan ishlar (yuristga yuborilgan)
        status = 'to_lawyer';
      } else if (currentSection === 'jarayonda') {
        // Yurist tomonidan ishlanayotgan ishlar
        status = 'lawyer_processing';
      } else if (currentSection === 'tugatilgan') {
        // Yurist tomonidan tugatilgan ishlar
        status = 'lawyer_completed,finished';
      }
      
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      
      setTasks(data);
    } catch (err) {
      console.error('Ishlarni olishda xatolik:', err);
      alert('Ishlarni yuklashda xatolik yuz berdi');
    } finally {
      setTasksLoading(false);
    }
  }, [currentSection, token]);

  // Initial data load
  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, [fetchProfile, fetchTasks, currentSection]);

  // Handle task click
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    
    // Reset form states when opening modal
    setNewStatus('');
    setProcessingNote('');
    setPaymentDetails({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      paymentMethod: 'cash'
    });
    setShowPaymentDetails(false);
    setUploadedInvoice(null);
    setInvoicePreview('');
  };

  // Handle image click
  const handleImageClick = (imageUrl) => {
    setCurrentImage(imageUrl);
    setShowImageModal(true);
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!newStatus) {
      return alert('Iltimos, holat tanlang');
    }
    
    if (newStatus === 'lawyer_processing' && !processingNote) {
      return alert('Iltimos, qayta ishlash uchun qayd kiriting');
    }
    
    if (newStatus === 'lawyer_completed') {
      if (!showPaymentDetails) {
        setShowPaymentDetails(true);
        return;
      }
      
      // To'lov ma'lumotlarini tekshirish
      if (!paymentDetails.amount) {
        return alert('Iltimos, to\'lov summasini kiriting');
      }
      if (!paymentDetails.paymentDate) {
        return alert('Iltimos, to\'lov sanasini kiriting');
      }
      if (!paymentDetails.invoiceNumber) {
        return alert('Iltimos, hisob-faktura raqamini kiriting');
      }
      if (!uploadedInvoice) {
        return alert('Iltimos, to\'lov chekini yuklang');
      }
    }
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('status', newStatus);
      formData.append('note', processingNote);
      
      if (newStatus === 'lawyer_completed') {
        formData.append('paymentAmount', paymentDetails.amount);
        formData.append('paymentDate', paymentDetails.paymentDate);
        formData.append('invoiceNumber', paymentDetails.invoiceNumber);
        formData.append('paymentMethod', paymentDetails.paymentMethod);
        if (uploadedInvoice) {
          formData.append('invoice', uploadedInvoice);
        }
      }
      
      // Send request
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/lawyer-process`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Statusni yangilashda xatolik: ${errorText}`);
      }
      
      alert('Status muvaffaqiyatli yangilandi');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Xatolik:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  // Handle invoice file upload
  const handleInvoiceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
      alert('Faqat .jpg, .jpeg, .png va .pdf formatidagi fayllar qabul qilinadi');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Fayl hajmi 5MB dan oshmasligi kerak');
      return;
    }
    
    setUploadedInvoice(file);
    
    // Create preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setInvoicePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF files, just set a placeholder
      setInvoicePreview('pdf');
    }
  };

  // Handle logout
  const onLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Render profile section
  const renderProfile = () => (
    <div className="dashboard-content">
      <h2>Profil</h2>
      {profile ? (
        <div className="profile-info">
          <p><strong>Foydalanuvchi:</strong> {profile.username}</p>
          <p><strong>Ism:</strong> {profile.firstName} {profile.lastName}</p>
          <p><strong>Rol:</strong> {profile.role}</p>
        </div>
      ) : (
        <p>Yuklanmoqda...</p>
      )}
    </div>
  );

  // Render tasks list
  const renderTasks = () => (
    <div className="dashboard-content">
      <h2>
        {currentSection === 'yangi' ? 'Yangi ishlar' :
         currentSection === 'jarayonda' ? 'Jarayondagi ishlar' :
         'Tugatilgan ishlar'}
      </h2>
      
      {tasksLoading ? (
        <p>Yuklanmoqda...</p>
      ) : tasks.length === 0 ? (
        <p>Ishlar topilmadi</p>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => (
            <div 
              key={task._id} 
              className={`task-item ${task.status === 'to_lawyer' ? 'new-task' : ''}`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="task-header">
                <h3>{task.brandName || 'Nomsiz brend'}</h3>
                <span className={`status-badge status-${task.status}`}>
                  {task.status === 'to_lawyer' ? 'Yangi' :
                   task.status === 'lawyer_processing' ? 'Jarayonda' :
                   task.status === 'lawyer_completed' ? 'Tugatilgan' :
                   task.status === 'finished' ? 'Arxivlangan' : 
                   task.status}
                </span>
              </div>
              
              <div className="task-info">
                <p><strong>Mijoz:</strong> {task.clientName} {task.clientSurname}</p>
                <p><strong>Telefon:</strong> {task.phone}</p>
                <p><strong>ID:</strong> {task.jobId || task._id.slice(-5)}</p>
                <p><strong>Shaxs turi:</strong> {task.personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}</p>
                
                {/* Display MKTU classes if available */}
                {task.classes && task.classes.length > 0 && (
                  <p><strong>MKTU sinflari:</strong> {Array.isArray(task.classes) ? task.classes.join(', ') : task.classes}</p>
                )}
                
                {/* Show if power of attorney exists */}
                {task.powerOfAttorney && (
                  <div className="badge-container">
                    <span className="poa-badge">Ishonchnoma mavjud</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render task detail modal
  const renderModal = () => {
    if (!showModal || !selectedTask) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <h3>{selectedTask.brandName || 'Nomsiz brend'}</h3>
            <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="modal-section">
              <h4>Mijoz ma'lumotlari</h4>
              <p><strong>Ism:</strong> {selectedTask.clientName} {selectedTask.clientSurname}</p>
              <p><strong>Telefon:</strong> {selectedTask.phone}</p>
              <p><strong>ID:</strong> {selectedTask.jobId || selectedTask._id.slice(-5)}</p>
              <p><strong>Shaxs turi:</strong> {selectedTask.personType === 'yuridik' ? 'Yuridik shaxs' : 'Jismoniy shaxs'}</p>
            </div>
            
            {selectedTask.personType === 'yuridik' && selectedTask.yuridikDocs && (
              <div className="modal-section">
                <h4>Yuridik shaxs ma'lumotlari</h4>
                <div className="docs-grid">
                  <div>
                    <p><strong>Kompaniya:</strong> {selectedTask.yuridikDocs.companyName}</p>
                    <p><strong>STIR:</strong> {selectedTask.yuridikDocs.stir}</p>
                    <p><strong>Manzil:</strong> {selectedTask.yuridikDocs.companyAddress}</p>
                  </div>
                  
                  {/* Display logo if available */}
                  {selectedTask.yuridikDocs.logo && (
                    <div className="doc-image-container">
                      <h5>Logo</h5>
                      <img 
                        src={selectedTask.yuridikDocs.logo} 
                        alt="Logo" 
                        className="doc-thumbnail"
                        onClick={() => handleImageClick(selectedTask.yuridikDocs.logo)}
                      />
                    </div>
                  )}
                  
                  {/* Display director passport if available */}
                  {selectedTask.yuridikDocs.directorPassportImage && (
                    <div className="doc-image-container">
                      <h5>Direktor pasporti</h5>
                      <img 
                        src={selectedTask.yuridikDocs.directorPassportImage} 
                        alt="Direktor pasporti" 
                        className="doc-thumbnail"
                        onClick={() => handleImageClick(selectedTask.yuridikDocs.directorPassportImage)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedTask.personType === 'jismoniy' && selectedTask.jismoniyDocs && (
              <div className="modal-section">
                <h4>Jismoniy shaxs ma'lumotlari</h4>
                <p><strong>Brand nomi:</strong> {selectedTask.jismoniyDocs.fullBrandName}</p>
                <p><strong>Manzil:</strong> {selectedTask.jismoniyDocs.fullAddress}</p>
                
                <div className="docs-grid">
                  {/* Display passport front if available */}
                  {selectedTask.jismoniyDocs.passportImageFront && (
                    <div className="doc-image-container">
                      <h5>Pasport old qismi</h5>
                      <img 
                        src={selectedTask.jismoniyDocs.passportImageFront} 
                        alt="Pasport old qismi" 
                        className="doc-thumbnail"
                        onClick={() => handleImageClick(selectedTask.jismoniyDocs.passportImageFront)}
                      />
                    </div>
                  )}
                  
                  {/* Display passport back if available */}
                  {selectedTask.jismoniyDocs.passportImageBack && (
                    <div className="doc-image-container">
                      <h5>Pasport orqa qismi</h5>
                      <img 
                        src={selectedTask.jismoniyDocs.passportImageBack} 
                        alt="Pasport orqa qismi" 
                        className="doc-thumbnail"
                        onClick={() => handleImageClick(selectedTask.jismoniyDocs.passportImageBack)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Display MKTU classes */}
            <div className="modal-section">
              <h4>MKTU sinflari</h4>
              {selectedTask.classes && selectedTask.classes.length > 0 ? (
                <div className="mktu-classes-display">
                  {Array.isArray(selectedTask.classes) ? 
                    selectedTask.classes.map((classItem, index) => (
                      <span key={index} className="mktu-class-item">
                        {typeof classItem === 'object' ? classItem.classNumber : classItem}
                      </span>
                    )) : 
                    <p>{selectedTask.classes}</p>
                  }
                </div>
              ) : (
                <p>MKTU sinflari kiritilmagan</p>
              )}
            </div>
            
            {/* Power of Attorney Viewer */}
            {selectedTask.powerOfAttorney && (
              <div className="modal-section">
                <h4>Ishonchnoma</h4>
                <PowerOfAttorneyViewer job={selectedTask} token={token} />
              </div>
            )}
            
            {/* Status update section */}
            <div className="modal-section status-update-section">
              <h4>Holat yangilash</h4>
              
              <div className="status-options">
                <label>
                  <input 
                    type="radio" 
                    name="status" 
                    value="lawyer_processing" 
                    checked={newStatus === 'lawyer_processing'} 
                    onChange={() => setNewStatus('lawyer_processing')}
                  />
                  Jarayonda
                </label>
                
                <label>
                  <input 
                    type="radio" 
                    name="status" 
                    value="lawyer_completed" 
                    checked={newStatus === 'lawyer_completed'} 
                    onChange={() => setNewStatus('lawyer_completed')}
                  />
                  Tugatilgan
                </label>
              </div>
              
              {newStatus === 'lawyer_processing' && (
                <div className="processing-note">
                  <label>Qayta ishlash uchun qayd:</label>
                  <textarea 
                    value={processingNote} 
       