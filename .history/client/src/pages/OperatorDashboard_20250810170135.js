import React, { useEffect, useState, useReducer } from 'react';
import { useForm } from 'react-hook-form'; // Qo'shilgan
import './OperatorDashboard.css';
import SidebarOperator from './components/SidebarOperator';

const stepReducer = (state, action) => {
  switch (action.type) {
    case 'NEXT_STEP': return { ...state, step: state.step + 1 };
    case 'PREV_STEP': return { ...state, step: state.step - 1 > 0 ? state.step - 1 : 1 };
    case 'SET_DATA': return { ...state, data: { ...state.data, ...action.payload } };
    case 'RESET': return { step: 1, data: {} };
    default: return state;
  }
};

function OperatorDashboard({ onLogout }) {
  const [selectedSection, setSelectedSection] = useState('yangi');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [showPhone, setShowPhone] = useState(false);
  const [phoneTimer, setPhoneTimer] = useState(10); // 10 sekund
  const [callResult, setCallResult] = useState('');
  const [clientIntent, setClientIntent] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandStatus, setBrandStatus] = useState(''); // tekshiruvchidan natija
  const [personType, setPersonType] = useState('');
  const token = localStorage.getItem('token');

  // Yangi: Wizard state (multi-step)
  const [wizardState, dispatch] = useReducer(stepReducer, { step: 1, data: { contact: {}, interest: {}, documents: {}, personType: '' } });
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Profilni olish (eski)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Profilni olishda xatolik');
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        alert(err.message);
      }
    };
    fetchProfile();
  }, [token]);

  // Ishlarni olish (eski)
  useEffect(() => {
    if (['yangi', 'jarayonda', 'tugatilgan'].includes(selectedSection)) {
      fetchTasks(selectedSection);
    }
  }, [selectedSection]);

  const fetchTasks = async (status) => {
    setTasksLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/jobs?status=${status}`, {
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

  // Yangi: Ishni tekshiruvchiga yuborish (brend uchun)
  const handleAssign = async (jobId, brandData) => {
    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...brandData, status: 'brand_sent' })
      });
      alert('Brend tekshiruvchiga yuborildi');
      fetchTasks(selectedSection);
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
  };

  // Yangi: Hujjatlar upload (fayl, link emas)
  const handleDocumentUpload = async (jobId, docs, type) => {
    const formData = new FormData();
    docs.forEach((file, index) => formData.append(`doc${index}`, file));
    formData.append('personType', type);
    try {
      await fetch(`http://localhost:5000/api/jobs/${jobId}/upload-documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      alert('Hujjatlar yuborildi');
    } catch (err) {
      alert('Upload xatolik');
    }
  };

  // Avatar upload funksiyasi (eski)

  // Step-by-step modal logikasi (eski, lekin wizard ga o'tkazildi)

  const startFlow = (task) => {
    setSelectedTask(task);
    setShowModal(true);
    dispatch({ type: 'RESET' });
    setShowPhone(false);
    setPhoneTimer(10);
  };

  // 1-etap: Aloqa
  const handleContact = (pickedUp, reason) => {
    dispatch({ type: 'SET_DATA', payload: { contact: { pickedUp, reason } } });
    if (pickedUp) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      // Saqlash va finish
      fetch(`/api/jobs/${selectedTask._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected', comments: reason }),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
    }
  };

  // 2-etap: Qiziqish
  const handleInterest = (intent, date, comment, brand) => {
    dispatch({ type: 'SET_DATA', payload: { interest: { intent, date, comment, brand } } });
    if (intent === 'do') {
      handleAssign(selectedTask._id, { brandName: brand });
      // Polling for checker response
      const interval = setInterval(async () => {
        const res = await fetch(`/api/jobs/${selectedTask._id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setBrandStatus(data.status);
        if (data.status === 'approved') {
          dispatch({ type: 'NEXT_STEP' });
          clearInterval(interval);
        } else if (data.status === 'rejected') {
          alert('Brend rad etildi: ' + data.history[data.history.length - 1].reason);
          setShowModal(false);
          clearInterval(interval);
        }
      }, 5000);
    } else if (intent === 'later') {
      // Save date/comment
      fetch(`/api/jobs/${selectedTask._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'kutilmoqda', futureDate: date, comments: comment }),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
    } else {
      // No interest
      fetch(`/api/jobs/${selectedTask._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected', comments: comment }),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
    }
  };

  // 3-etap: Hujjatlar (step-by-step)
  const onDocumentSubmit = (formData) => {
    const docs = Object.values(formData); // Fayllar array
    handleDocumentUpload(selectedTask._id, docs, wizardState.data.personType);
    dispatch({ type: 'NEXT_STEP' });
  };

  // 4-etap: Tasdiqlash
  const handleFinish = () => {
    fetch(`/api/jobs/${selectedTask._id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'finished' }),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    setShowModal(false);
    fetchTasks(selectedSection);
  };

  // Render wizard modal
  const renderWizard = () => {
    const { step, data } = wizardState;
    if (step === 1) return (
      <div className="step-box">
        <h3>1. Aloqaga chiqish</h3>
        <button onClick={handleShowPhone}>Nomerni ko'rish</button>
        {showPhone && <p>Telefon: {selectedTask.phone} ( {phoneTimer} sek )</p>}
        <button onClick={() => handleContact(true)}>Ko'tardi</button>
        <button onClick={() => handleContact(false, prompt('Sabab?'))}>Ko'tarmadi</button>
      </div>
    );
    if (step === 2) return (
      <div className="step-box">
        <h3>2. Mijoz xohishi</h3>
        <button onClick={() => handleInterest('no', null, prompt('Sabab?'))}>Qildirmas ekan</button>
        <button onClick={() => handleInterest('later', prompt('Sana?'), prompt('Izoh?'))}>Keyinroq</button>
        <button onClick={() => handleInterest('do', null, null, prompt('Brend nomi?'))}>Qildirmoqchi</button>
      </div>
    );
    if (step === 3) return (
      <form onSubmit={handleSubmit(onDocumentSubmit)} className="step-box">
        <h3>3. Hujjatlar ( {data.personType || 'Turi tanlang'} )</h3>
        <select onChange={(e) => dispatch({ type: 'SET_DATA', payload: { personType: e.target.value } })}>
          <option value="">Turi</option>
          <option value="yuridik">Yuridik</option>
          <option value="jismoniy">Jismoniy</option>
        </select>
        {data.personType === 'yuridik' && (
          <>
            <input type="file" {...register('mchjNomi', { required: true })} placeholder="MCHJ nomi (rasm)" />
            <input type="file" {...register('mchjManzili')} placeholder="Manzil" />
            {/* Boshqa 8 ta field, fayl input */}
            {/* Oxirida */}
            <button type="submit">Yuborish</button>
            <button type="button" onClick={() => dispatch({ type: 'PREV_STEP' })}>Orqaga</button>
          </>
        )}
        {data.personType === 'jismoniy' && (
          <>
            <input type="file" {...register('passport')} placeholder="Pasport (oldi-orqa)" />
            <input type="file" {...register('brandName')} placeholder="Brend nomi" />
            <input type="file" {...register('manzil')} placeholder="Manzil" />
            <button type="submit">Yuborish</button>
            <button type="button" onClick={() => dispatch({ type: 'PREV_STEP' })}>Orqaga</button>
          </>
        )}
      </form>
    );
    if (step === 4) return (
      <div className="step-box">
        <h3>4. Tayyorlikni tasdiqlash</h3>
        <button onClick={handleFinish}>Yakunlash</button>
      </div>
    );
  };

  // Yangi: Ishlar ro'yxati (jarayonga kirish tugmasi bilan)
  const renderTasks = () => (
    <div className="tasks-list-modern">
      <h2>🟦 Yangi ishlar</h2>
      {tasksLoading ? <p>Yuklanmoqda...</p> : tasks.length === 0 ? <p>Ishlar topilmadi</p> : (
        <div className="task-cards-modern">
          {tasks.map(task => (
            <div key={task._id} className="task-card-modern">
              <h3>ID: {task._id.slice(-5)}</h3>
              <p>Ism: {task.clientName} Familiya: {task.clientSurname}</p>
              <p>Izoh: {task.comments}</p>
              <p>Brend: {task.brandName || '-'}</p>
              <p>Status: {task.status}</p>
              <button onClick={() => startFlow(task)}>Jarayonga kirish</button>
              {task.status === 'rejected' && <p>Sabab: {task.history[task.history.length - 1]?.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Eski renderStepByStep va boshqalar saqlangan...

  return (
    <div className="operator-admin-wrapper">
      <SidebarOperator current={selectedSection} setCurrent={setSelectedSection} onLogout={onLogout} />
      <div className="operator-admin-main">
        <h2>Operator Panel</h2>
        {renderSection()}
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            {renderWizard()}
            <button onClick={() => setShowModal(false)}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorDashboard;