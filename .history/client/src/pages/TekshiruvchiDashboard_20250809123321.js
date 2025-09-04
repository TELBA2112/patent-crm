import React, { useEffect, useState } from 'react';
import './OperatorDashboard.css';

function TekshiruvchiDashboard() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [showPhone, setShowPhone] = useState(false);

  // Profil va ishlarni olish
  // ...fetchProfile, fetchTasks...

  // Step-by-step modal
  const handleShowTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    setStep(1);
    setShowPhone(false);
  };

  const handleShowPhone = () => {
    setShowPhone(true);
    setTimeout(() => setStep(2), 30000); // 30 sekunddan keyin keyingi step
  };

  // ...step-by-step form logikasi...

  return (
    <div className="dashboard-container">
      {/* Profil kartasi */}
      <div className="profile-card">
        <img src={profile?.avatar ? `http://localhost:5000/${profile.avatar}` : "/avatar.png"} alt="Avatar" />
        <h2>{profile?.firstName} {profile?.lastName}</h2>
        <p>Balans: <b>{profile?.balance?.toLocaleString() || 0} so‘m</b></p>
      </div>

      {/* Yangi ishlar ro‘yxati */}
      <div className="tasks-list">
        <h3>🟦 Yangi ishlar</h3>
        {tasks.map(task => (
          <div className="task-card" key={task._id}>
            <div>
              <b>ID:</b> {task._id.slice(-5).toUpperCase()} {/* qisqa id */}
              <b>Ism:</b> {task.clientName} {task.clientSurname}
              <b>Status:</b> {task.status}
            </div>
            <button onClick={() => handleShowTask(task)}>Ko‘rish</button>
          </div>
        ))}
      </div>

      {/* Modal/drawer step-by-step */}
      {showModal && selectedTask && (
        <div className="modal">
          {step === 1 && (
            <div>
              <h4>1. Mijoz ma'lumotlari</h4>
              <p><b>Ism:</b> {selectedTask.clientName}</p>
              <p><b>Familiya:</b> {selectedTask.clientSurname}</p>
              <p><b>Izoh:</b> {selectedTask.comments}</p>
              <p><b>Brend:</b> {selectedTask.brandName}</p>
              <button onClick={handleShowPhone}>Telefonni ko‘rish</button>
              {showPhone && <p style={{color:'red'}}>{selectedTask.phone}</p>}
            </div>
          )}
          {step === 2 && (
            <div>
              <h4>2. Bog‘lanish natijasi</h4>
              <button>📞 Oldi</button>
              <button>❌ Olmadi</button>
              {/* ... */}
            </div>
          )}
          {/* ...step 3 va 4... */}
          <button onClick={() => setShowModal(false)}>Yopish</button>
        </div>
      )}
    </div>
  );
}

export default TekshiruvchiDashboard;
