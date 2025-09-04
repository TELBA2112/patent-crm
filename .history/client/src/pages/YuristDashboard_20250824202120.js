import React, { useEffect, useState, useCallback } from 'react';
import './YuristDashboard.css';

function YuristDashboard({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedSection, setSelectedSection] = useState('yangi');
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

  // Ishlarni olish
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

      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
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
  }, [token, selectedSection]);

  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, [token, fetchTasks, fetchProfile, selectedSection]);

  // Ishni tanlash va modalka ochish
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setComment('');
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

  // Ishni jarayonga qo'shish
  const handleAcceptTask = async () => {
    if (!selectedTask) return;
    
    try {
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

  // Ishni yakunlash
  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    if (!comment.trim()) return alert("Izoh kiritishingiz kerak!");
    
    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedTask._id}/complete-by-lawyer`, {
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

      alert('Ish muvaffaqiyatli yakunlandi!');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      alert('Xatolik: ' + err.message);
    }
  };

  // Modal oyna
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
          
          {selectedTask.comments && (
            <div className="task-comments">
              <p><strong>Izohlar:</strong> {selectedTask.comments}</p>
            </div>
          )}
          
          <textarea
            placeholder="Izoh yoki qaydlar kiriting..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
          ></textarea>
          
          <div className="modal-buttons">
            {selectedTask.status === 'to_lawyer' && (
              <button onClick={handleAcceptTask}>Ishni qabul qilish</button>
            )}
            
            {selectedTask.status === 'lawyer_processing' && (
              <button onClick={handleCompleteTask}>Ishni yakunlash</button>
            )}
            
            <button className="close-button" onClick={() => setShowModal(false)}>Yopish</button>
          </div>
        </div>
      </div>
    );
  };

  // Sidebar
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
          className="sidebar-link" 
          onClick={onLogout}
        >
          🚪 Chiqish
        </div>
      </div>
    </div>
  );

  return (
    <div className="yurist-dashboard">
      {renderSidebar()}
      
      <div className="yurist-content">
        <div className="yurist-header">
          <h2>{
            selectedSection === 'yangi' ? 'Yangi ishlar' : 
            selectedSection === 'jarayonda' ? 'Jarayondagi ishlar' : 
            'Tugatilgan ishlar'
          }</h2>
          {profile && <p>Xush kelibsiz, {profile.firstName} {profile.lastName}</p>}
        </div>

        {error && <div className="error-message">{error}</div>}
        
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
      </div>
      
      {renderModal()}
    </div>
  );
}

export default YuristDashboard;