import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CheckerDocReview() {
  const [docsToReview, setDocsToReview] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const token = localStorage.getItem('token');

  const fetchDocs = async () => {
    const res = await axios.get('http://localhost:5000/api/brands/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const filtered = res.data.filter(r => r.status === 'docs_submitted');
    setDocsToReview(filtered);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleReview = async (action) => {
    try {
      await axios.post(`http://localhost:5000/api/brands/review-docs/${selected._id}`, {
        action,
        comment,
        fileUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Yuborildi');
      setComment('');
      setFileUrl('');
      setSelected(null);
      fetchDocs();
    } catch (err) {
      alert('Xatolik yuz berdi');
    }
  };

  return (
    <div>
      <h2>📄 Hujjatlarni Tekshirish</h2>

      {docsToReview.map(req => (
        <div key={req._id} style={{ borderBottom: '1px solid #ccc', marginBottom: '15px' }}>
          <b>{req.brandName}</b> | Operator: {req.operator?.username}
          <br />
          <button onClick={() => setSelected(req)}>Ko‘rish</button>
        </div>
      ))}

      {selected && (
        <div style={{ marginTop: '20px' }}>
          <h3>🔍 {selected.brandName} — Hujjatlar</h3>
          <pre>{JSON.stringify(selected.documents, null, 2)}</pre>

          <hr />

          <h4>Natija:</h4>
          <textarea
            placeholder="Agar xato bo‘lsa — izoh yozing"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <input
            type="text"
            placeholder="Screenshot yoki fayl URL (agar bor bo‘lsa)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />

          <div style={{ marginTop: '10px' }}>
            <button onClick={() => handleReview('reject')}>❌ Rad etish</button>
            <button onClick={() => handleReview('approve')}>✅ Yuristga yuborish</button>
          </div>
        </div>
      )}
    </div>
  );
}
