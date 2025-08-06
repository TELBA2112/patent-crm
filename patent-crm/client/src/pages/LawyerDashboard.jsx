import { useEffect, useState } from 'react';
import axios from 'axios';

export default function LawyerDashboard() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [invoiceScreenshotUrl, setInvoiceScreenshotUrl] = useState('');
  const [finalDocumentUrl, setFinalDocumentUrl] = useState('');
  const [lawyerNote, setLawyerNote] = useState('');
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    const res = await axios.get('http://localhost:5000/api/brands/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const filtered = res.data.filter(r => r.status === 'sent_to_lawyer');
    setRequests(filtered);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendInvoiceRequest = async () => {
    await axios.post(`http://localhost:5000/api/brands/lawyer-action/${selected._id}`, {
      action: 'ask_invoice',
      invoiceScreenshotUrl,
      lawyerNote
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Invoys so‘raldi');
    setSelected(null);
    fetchData();
  };

  const completeCase = async () => {
    await axios.post(`http://localhost:5000/api/brands/lawyer-action/${selected._id}`, {
      action: 'complete',
      finalDocumentUrl
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('Ariza yakunlandi');
    setSelected(null);
    fetchData();
  };

  return (
    <div>
      <h2>⚖️ Yurist Paneli</h2>
      {requests.map(req => (
        <div key={req._id} style={{ borderBottom: '1px solid #ccc', marginBottom: '15px' }}>
          <b>{req.brandName}</b> — Operator: {req.operator?.username}
          <button onClick={() => setSelected(req)}>Ko‘rish</button>
        </div>
      ))}

      {selected && (
        <div>
          <h3>{selected.brandName} — Hujjatlar</h3>
          <pre>{JSON.stringify(selected.documents, null, 2)}</pre>

          <hr />
          <h4>Invoys talab qilish</h4>
          <input
            type="text"
            placeholder="Invoys uchun fayl URL"
            value={invoiceScreenshotUrl}
            onChange={(e) => setInvoiceScreenshotUrl(e.target.value)}
          />
          <textarea
            placeholder="Izoh"
            rows={2}
            value={lawyerNote}
            onChange={(e) => setLawyerNote(e.target.value)}
          />
          <button onClick={sendInvoiceRequest}>📩 Invoys so‘rash</button>

          <hr />
          <h4>Yakuniy hujjat (PDF yoki rasm) yuklash</h4>
          <input
            type="text"
            placeholder="Yakuniy hujjat URL"
            value={finalDocumentUrl}
            onChange={(e) => setFinalDocumentUrl(e.target.value)}
          />
          <button onClick={completeCase}>✅ Yakunlash</button>
        </div>
      )}
    </div>
  );
}
