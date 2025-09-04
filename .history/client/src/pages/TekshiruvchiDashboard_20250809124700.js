import React, { useEffect, useState } from 'react';
import './TekshiruvchiDashboard.css';

function TekshiruvchiDashboard() {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [brandStatus, setBrandStatus] = useState('');
  const [comment, setComment] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/jobs?status=tekshiruvchi', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ishlarni olishda xatolik');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setTasks([]);
    }
    setTasksLoading(false);
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setStep(1);
    setBrandStatus('');
    setComment('');
    setScreenshot(null);
  };

  const handleBrandStatus = (status) => {
    setBrandStatus(status);
    if (status === 'band') setStep(2);
    else setStep(3);
  };

  const handleSave = () => {
    // TODO: API orqali natijani saqlash
    setShowModal(false);
    fetchTasks();
  };

  // Yangi ishlar ro'yxati
  const renderTasks = () => (
    <div className="tasks-list">
      <h3>🟦 Tekshirishga yuborilgan ishlar</h3>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards">
          {tasks.map(task => (
            <div className="task-card" key={task._id}>
              <div>
                <b>ID:</b> {task._id.slice(-5).toUpperCase()}<br />
                <b>Ism:</b> {task.clientName} {task.clientSurname}<br />
                <b>Brend:</b> {task.brandName}
              </div>
              <button onClick={() => openTaskModal(task)}>Ko‘rish</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step-by-step modal
  const renderModal = () => selectedTask && (
    <div className="modal">
      <div className="modal-content">
        <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
        {step === 1 && (
          <div>
            <h4>Brendni tekshirish</h4>
            <p><b>Brend:</b> {selectedTask.brandName}</p>
            <button onClick={() => handleBrandStatus('ok')}>✅ Bo'ladi</button>
            <button onClick={() => handleBrandStatus('band')}>🚫 Band</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h4>Band — Screenshot va izoh</h4>
            <input type="file" accept="image/*" onChange={e => setScreenshot(e.target.files[0])} />
            <textarea placeholder="Izoh" value={comment} onChange={e => setComment(e.target.value)} style={{width:'100%',margin:'10px 0'}} />
            <button onClick={handleSave} disabled={!screenshot || !comment}>Yuborish</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h4>Natija saqlandi</h4>
            <button onClick={() => setShowModal(false)}>Yopish</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="tekshiruvchi-dashboard">
      <main className="main-content">
        {renderTasks()}
      </main>
      {showModal && renderModal()}
    </div>
  );
}

export default TekshiruvchiDashboard;
