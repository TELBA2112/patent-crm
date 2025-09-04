import React, { useState, useEffect, useCallback } from 'react';
import './YuristDashboard.css';
import { getStoredMktuClasses, getSharedPowerOfAttorneyDocuments } from '../utils/mktuData';

function YuristDashboard() {
  const [currentSection, setCurrentSection] = useState('tasks');
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [powerOfAttorneyDocuments, setPowerOfAttorneyDocuments] = useState(null);
  const [powerOfAttorneyPreview, setPowerOfAttorneyPreview] = useState(null);
  const [showPowerOfAttorney, setShowPowerOfAttorney] = useState(false);
  const token = localStorage.getItem('token');

  // Load shared power of attorney documents
  useEffect(() => {
    // Initial load
    const sharedDocs = getSharedPowerOfAttorneyDocuments();
    if (sharedDocs) {
      setPowerOfAttorneyDocuments(sharedDocs);
    }
    
    // Listen for updates from checker dashboard
    const handlePowerOfAttorneyUpdated = (event) => {
      setPowerOfAttorneyDocuments(event.detail.documents);
    };
    
    document.addEventListener('powerOfAttorneyUpdated', handlePowerOfAttorneyUpdated);
    
    // Clean up listener
    return () => {
      document.removeEventListener('powerOfAttorneyUpdated', handlePowerOfAttorneyUpdated);
    };
  }, []);

  // Fetch MKTU classes from localStorage when needed
  const getClassesForTask = useCallback((task) => {
    if (task && task.classes && Array.isArray(task.classes) && task.classes.length > 0) {
      return task.classes;
    }
    
    // If not in task, try localStorage
    return getStoredMktuClasses();
  }, []);

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
      console.error('Profile error:', err);
      alert(err.message);
    }
  }, [token]);

  // Ishlarni olish
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=to_lawyer,lawyer_processing,lawyer_completed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Tasks error:', err);
      alert(err.message);
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, [token]);

  // Get tasks when section changes
  useEffect(() => {
    fetchProfile();
    if (currentSection === 'tasks') {
      fetchTasks();
    }
    
    // Check for shared power of attorney documents
    const sharedDocs = getSharedPowerOfAttorneyDocuments();
    if (sharedDocs) {
      setPowerOfAttorneyDocuments(sharedDocs);
    }
  }, [currentSection, fetchProfile, fetchTasks]);

  // Add a function to view power of attorney
  const viewPowerOfAttorney = () => {
    if (!powerOfAttorneyDocuments) {
      alert("Ishonchnoma hujjatlari topilmadi");
      return;
    }
    
    setPowerOfAttorneyPreview(powerOfAttorneyDocuments.content);
    setShowPowerOfAttorney(true);
  };

  // Add power of attorney download function
  const downloadPowerOfAttorney = async () => {
    if (!powerOfAttorneyDocuments) return;
    
    try {
      const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Ishonchnoma</title></head><body>";
      const postHtml = "</body></html>";
      const html = preHtml + powerOfAttorneyDocuments.content + postHtml;
      
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = powerOfAttorneyDocuments.fileName || 'Ishonchnoma.docx';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Ishonchnoma muvaffaqiyatli yuklab olindi!');
    } catch (error) {
      console.error('Ishonchnomani yuklab olishda xatolik:', error);
      alert('Ishonchnomani yuklab olishda xatolik yuz berdi');
    }
  };

  // Add a function to render power of attorney modal
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

  // Render a button to view power of attorney
  const renderPowerOfAttorneyButton = () => {
    if (!powerOfAttorneyDocuments) return null;
    
    return (
      <div className="power-of-attorney-section">
        <h3>Ishonchnoma hujjatlari</h3>
        <p>Tekshiruvchi tomonidan tayyorlangan ishonchnoma mavjud</p>
        <button onClick={viewPowerOfAttorney} className="view-power-btn">
          Ishonchnomani ko'rish
        </button>
      </div>
    );
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setComment('');
  };

  const acceptTask = async () => {
    if (!selectedTask) return;
    
    try {
      setUploading(true);
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/accept-by-lawyer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      alert('Ish qabul qilindi');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Error accepting task:', err);
      alert(`Xatolik: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const completeTask = async () => {
    if (!selectedTask) return;
    
    try {
      setUploading(true);
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/complete-by-lawyer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      alert('Ish yakunlandi');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      alert(`Xatolik: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Sidebar links
  const renderSidebar = () => (
    <div className="yurist-sidebar">
      <h2>Yurist Panel</h2>
      <div className="sidebar-links">
        <div 
          className={`sidebar-link ${currentSection === 'tasks' ? 'active' : ''}`}
          onClick={() => setCurrentSection('tasks')}
        >
          📑 Ishlar
        </div>
        <div 
          className={`sidebar-link ${currentSection === 'completed' ? 'active' : ''}`}
          onClick={() => setCurrentSection('completed')}
        >
          ✅ Bajarilgan ishlar
        </div>
        <div 
          className={`sidebar-link ${currentSection === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentSection('profile')}
        >
          👤 Profil
        </div>
        <div className="sidebar-link" onClick={handleLogout}>
          🚪 Chiqish
        </div>
      </div>
    </div>
  );

  // Modal for task details and actions
  const renderModal = () => {
    if (!showModal || !selectedTask) return null;
    
    return (
      <div className="modal">
        <div className="modal-content">
          <h3>Ish #{selectedTask._id.slice(-5)} ma'lumotlari</h3>
          
          <p><strong>Brend nomi:</strong> {selectedTask.brandName}</p>
          <p><strong>Mijoz:</strong> {selectedTask.clientName} {selectedTask.clientSurname}</p>
          <p><strong>Telefon:</strong> {selectedTask.phone}</p>
          <p><strong>Status:</strong> {selectedTask.status}</p>
          
          {selectedTask.comments && (
            <div className="task-comments">
              <strong>Izohlar:</strong>
              <p>{selectedTask.comments}</p>
            </div>
          )}
          
          <textarea 
            placeholder="Izoh qo'shish..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          
          <div className="modal-buttons">
            {selectedTask.status === 'to_lawyer' && (
              <button onClick={acceptTask} disabled={uploading}>
                {uploading ? 'Kuting...' : 'Ishni qabul qilish'}
              </button>
            )}
            
            {selectedTask.status === 'lawyer_processing' && (
              <button onClick={completeTask} disabled={uploading}>
                {uploading ? 'Kuting...' : 'Ishni yakunlash'}
              </button>
            )}
            
            <button className="close-button" onClick={() => setShowModal(false)}>Yopish</button>
          </div>
        </div>
      </div>
    );
  };

  // Main content rendering
  const renderContent = () => {
    if (currentSection === 'profile') {
      return (
        <div className="yurist-content">
          <div className="yurist-header">
            <h2>👤 Profil</h2>
          </div>
          
          {profile ? (
            <div>
              <p><strong>Ism:</strong> {profile.firstName || 'Ko\'rsatilmagan'}</p>
              <p><strong>Familiya:</strong> {profile.lastName || 'Ko\'rsatilmagan'}</p>
              <p><strong>Login:</strong> {profile.username}</p>
              <p><strong>Rol:</strong> {profile.role}</p>
            </div>
          ) : (
            <p>Profil yuklanmoqda...</p>
          )}
        </div>
      );
    }
    
    // Tasks section (current or completed)
    const filteredTasks = tasks.filter(task => {
      if (currentSection === 'completed') {
        return task.status === 'lawyer_completed';
      } else {
        return ['to_lawyer', 'lawyer_processing'].includes(task.status);
      }
    });
    
    return (
      <div className="yurist-content">
        <div className="yurist-header">
          <h2>{currentSection === 'completed' ? '✅ Bajarilgan ishlar' : '📑 Ishlar'}</h2>
        </div>
        
        {/* Add the power of attorney button */}
        {powerOfAttorneyDocuments && renderPowerOfAttorneyButton()}
        
        {tasksLoading ? (
          <p>Ishlar yuklanmoqda...</p>
        ) : filteredTasks.length === 0 ? (
          <p>Hozircha ishlar yo'q.</p>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map(task => (
              <div 
                key={task._id} 
                className={`task-card ${task.status}`}
                onClick={() => handleTaskClick(task)}
              >
                <h4>{task.brandName || 'Nomsiz brend'}</h4>
                <p>ID: #{task._id.slice(-5)}</p>
                <p>Mijoz: {task.clientName} {task.clientSurname}</p>
                <p className="task-status">
                  Status: {task.status === 'to_lawyer' ? '🆕 Yangi' : 
                           task.status === 'lawyer_processing' ? '🔄 Jarayonda' : 
                           task.status === 'lawyer_completed' ? '✅ Bajarilgan' : task.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="yurist-dashboard">
      {renderSidebar()}
      {renderContent()}
      {renderModal()}
      {renderPowerOfAttorneyModal()}
    </div>
  );
}

export default YuristDashboard;