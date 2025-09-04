import React, { useEffect, useState } from 'react';

function Tasks({ token }) {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    clientName: '',
    clientSurname: '',
    phone: '',
    comments: '',
    brandName: '',
    status: 'yangi',
    assignedTo: '',
  });
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({ status: '', assignedTo: '', search: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');

  // Stepper uchun yangi state
  const [step, setStep] = useState(1);
  const [personType, setPersonType] = useState('');

  // Stepper bosqichlari
  const yuridikSteps = [
    { name: 'MCHJ nomi', key: 'mchjNomi' },
    { name: 'MCHJ manzili', key: 'mchjManzili' },
    { name: 'STIR', key: 'stir' },
    { name: 'OKED', key: 'oked' },
    { name: 'X/R', key: 'xr' },
    { name: 'Bank va filial', key: 'bank' },
    { name: 'MFO', key: 'mfo' },
    { name: 'Logo', key: 'logo' },
    { name: 'Patentlanayotgan brand nomi', key: 'brandName' },
    { name: 'Direktor pasport rasmi', key: 'direktorPassport' },
  ];
  const jismoniySteps = [
    { name: 'Pasport rasmi (oldi-orqa)', key: 'passport' },
    { name: 'Brand nomi', key: 'brandName' },
    { name: 'Yashash manzili', key: 'manzil' },
  ];

  // Stepper form uchun alohida state
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    fetchOperators();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      let query = [];
      if (filter.status) query.push(`status=${encodeURIComponent(filter.status)}`);
      if (filter.assignedTo) query.push(`assignedTo=${encodeURIComponent(filter.assignedTo)}`);
      if (filter.search) query.push(`search=${encodeURIComponent(filter.search)}`);
      const queryString = query.length ? `?${query.join('&')}` : '';

      const res = await fetch(`http://localhost:5000/api/jobs${queryString}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} - ${text}`);
      }

      const data = await res.json();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Ishlarni yuklashda xatolik yuz berdi');
      console.error(err);
      setTasks([]);
    }
  };

  const fetchOperators = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/users?role=operator`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Operatorlarni yuklashda xatolik');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  };

  const handleInputChange = setter => e => {
    setter(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.phone) {
      setError('Telefon raqami majburiy');
      return;
    }

    try {
      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask
        ? `http://localhost:5000/api/jobs/${editingTask._id}`
        : `http://localhost:5000/api/jobs`;

      // Faqat kerakli maydonlarni yuborish
      const jobPayload = {
        clientName: form.clientName,
        clientSurname: form.clientSurname,
        phone: form.phone,
        comments: form.comments,
        brandName: form.brandName,
        status: form.status,
      };
      if (form.assignedTo) jobPayload.assignedTo = form.assignedTo;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobPayload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Xatolik yuz berdi');
        return;
      }

      await fetchTasks();
      setForm({
        clientName: '',
        clientSurname: '',
        phone: '',
        comments: '',
        brandName: '',
        status: 'yangi',
        assignedTo: '',
      });
      setEditingTask(null);
      setError('');
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik');
      console.error(err);
    }
  };

  const handleEdit = task => {
    setEditingTask(task);
    setForm({
      clientName: task.clientName || '',
      clientSurname: task.clientSurname || '',
      phone: task.phone,
      comments: task.comments || '',
      brandName: task.brandName || '',
      status: task.status,
      assignedTo: task.assignedTo ? task.assignedTo._id || task.assignedTo : '',
    });
  };

  const handleDelete = async id => {
    if (!window.confirm('Ishni o‘chirishni xohlaysizmi?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'O‘chirishda xatolik yuz berdi');
        return;
      }

      await fetchTasks();
      setError('');
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik');
      console.error(err);
    }
  };

  // Stepper form rendering
  const renderStepper = () => {
    if (!personType) {
      return (
        <div style={{ margin: '20px 0' }}>
          <label>Shaxs turini tanlang: </label>
          <select value={personType} onChange={e => setPersonType(e.target.value)}>
            <option value="">Tanlang</option>
            <option value="yuridik">Yuridik shaxs</option>
            <option value="jismoniy">Jismoniy shaxs</option>
          </select>
        </div>
      );
    }
    const steps = personType === 'yuridik' ? yuridikSteps : jismoniySteps;
    const current = steps[step - 1];
    return (
      <div style={{ margin: '20px 0' }}>
        <h4>{step}. {current.name}</h4>
        <input
          type="text"
          value={stepData[current.key] || ''}
          onChange={e => setStepData({ ...stepData, [current.key]: e.target.value })}
          placeholder={current.name}
        />
        <div style={{ marginTop: 10 }}>
          {step > 1 && <button type="button" onClick={() => setStep(step - 1)}>Orqaga</button>}
          {step < steps.length && <button type="button" onClick={() => setStep(step + 1)}>Keyingi</button>}
          {step === steps.length && (
            <button type="button" onClick={() => setStep(step + 1)}>Umumiy ko‘rib chiqish</button>
          )}
        </div>
      </div>
    );
  };

  // Umumiy ko‘rib chiqish va yuborish
  const renderReview = () => {
    const steps = personType === 'yuridik' ? yuridikSteps : jismoniySteps;
    if (step !== steps.length + 1) return null;
    return (
      <div style={{ margin: '20px 0' }}>
        <h4>Umumiy ko‘rib chiqish</h4>
        <ul>
          {steps.map(s => (
            <li key={s.key}><b>{s.name}:</b> {stepData[s.key]}</li>
          ))}
        </ul>
        <button type="button" onClick={handleStepperSubmit}>Tasdiqlash va yuborish</button>
        <button type="button" onClick={() => setStep(step - 1)}>Orqaga</button>
      </div>
    );
  };

  // Stepper submit
  const handleStepperSubmit = async () => {
    try {
      let payload = {};
      if (personType === 'yuridik') {
        payload = { personType, yuridikDocs: stepData };
      } else {
        payload = { personType, jismoniyDocs: stepData };
      }
      payload.status = 'yangi';
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Xatolik yuz berdi');
        return;
      }
      setStep(1);
      setPersonType('');
      setStepData({});
      setError('');
      await fetchTasks();
    } catch (err) {
      setError('Server bilan bog‘lanishda xatolik');
    }
  };

  return (
    <div className="tasks-container" style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h2>Ishlar ro‘yxati</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Status:
          <select name="status" value={filter.status} onChange={handleInputChange(setFilter)}>
            <option value="">Hammasi</option>
            <option value="yangi">Yangi</option>
            <option value="boglandi">Bog‘landi</option>
            <option value="tekshiruvchi">Tekshiruvchi</option>
            <option value="tugatilgan">Tugatilgan</option>
          </select>
        </label>

        <label style={{ marginLeft: '10px' }}>
          Operator:
          <select name="assignedTo" value={filter.assignedTo} onChange={handleInputChange(setFilter)}>
            <option value="">Hammasi</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
        </label>

        <label style={{ marginLeft: '10px' }}>
          Qidirish:
          <input
            type="text"
            name="search"
            value={filter.search}
            onChange={handleInputChange(setFilter)}
            placeholder="Telefon yoki ID"
          />
        </label>

        <button onClick={fetchTasks} style={{ marginLeft: '10px' }}>
          Qidirish
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>F.I.O</th>
            <th>Telefon</th>
            <th>Brend</th>
            <th>Status</th>
            <th>Operator</th>
            <th>Izoh</th>
            <th>Harakatlar</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                Ish topilmadi
              </td>
            </tr>
          ) : (
            tasks.map(task => (
              <tr key={task._id}>
                <td>{task.clientName} {task.clientSurname}</td>
                <td>{task.phone}</td>
                <td>{task.brandName}</td>
                <td>{task.status}</td>
                <td>{task.assignedTo?.username || '—'}</td>
                <td>{task.comments}</td>
                <td>
                  <button onClick={() => handleEdit(task)}>Tahrirlash</button>{' '}
                  <button onClick={() => handleDelete(task._id)}>O‘chirish</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3 style={{ marginTop: '30px' }}>Yangi ish qo‘shish (stepper)</h3>
      {renderStepper()}
      {renderReview()}
    </div>
  );
}

export default Tasks;
