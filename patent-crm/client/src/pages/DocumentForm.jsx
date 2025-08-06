import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function DocumentForm() {
  const { id } = useParams(); // brandRequest ID
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState('yuridik');
  const [data, setData] = useState({});
  const token = localStorage.getItem('token');

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  const handleChange = (key, value) => {
    setData({ ...data, [key]: value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`http://localhost:5000/api/brands/submit-docs/${id}`, {
        docType,
        documents: data
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Hujjatlar yuborildi!");
      navigate('/operator');
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <div>
          <h3>1. Shaxs turini tanlang</h3>
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="yuridik">Yuridik shaxs</option>
            <option value="jismoniy">Jismoniy shaxs</option>
          </select>
          <button onClick={next}>Keyingi</button>
        </div>
      );
    }

    // Yuridik hujjat bosqichlari
    if (docType === 'yuridik') {
      const steps = [
        'MCHJ nomi',
        'MCHJ manzili',
        'STIR',
        'OKED',
        'X/R',
        'Bank va filial nomi',
        'MFO',
        'Logo URL',
        'Patentlanayotgan brand nomi',
        'Direktor pasport rasmi (URL)'
      ];

      if (step <= 10) {
        return (
          <div>
            <h3>{step}. {steps[step - 2]}</h3>
            <input
              type="text"
              placeholder={steps[step - 2]}
              value={data[`step${step}`] || ''}
              onChange={(e) => handleChange(`step${step}`, e.target.value)}
            />
            <div>
              {step > 2 && <button onClick={prev}>Orqaga</button>}
              <button onClick={next}>Keyingi</button>
            </div>
          </div>
        );
      }
    }

    // Jismoniy hujjat bosqichlari
    if (docType === 'jismoniy') {
      const steps = [
        'Pasport rasmi (oldi-orqa)',
        'To‘liq brand nomi',
        'Yashash manzili'
      ];

      if (step <= 4) {
        return (
          <div>
            <h3>{step}. {steps[step - 2]}</h3>
            <input
              type="text"
              placeholder={steps[step - 2]}
              value={data[`step${step}`] || ''}
              onChange={(e) => handleChange(`step${step}`, e.target.value)}
            />
            <div>
              {step > 2 && <button onClick={prev}>Orqaga</button>}
              <button onClick={next}>Keyingi</button>
            </div>
          </div>
        );
      }
    }

    return (
      <div>
        <h3>Ko‘rib chiqish</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <button onClick={prev}>Orqaga</button>
        <button onClick={handleSubmit}>Tasdiqlash va yuborish</button>
      </div>
    );
  };

  return (
    <div>
      <h2>Hujjat To‘ldirish Bosqichi</h2>
      {renderStep()}
    </div>
  );
}
