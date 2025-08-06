import { useEffect, useState } from 'react';
import axios from 'axios';

export default function OperatorDashboard() {
  const [brandName, setBrandName] = useState('');
  const [hasLogo, setHasLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [myRequests, setMyRequests] = useState([]);

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/brands/create', {
        brandName,
        hasLogo,
        logoUrl: hasLogo ? logoUrl : null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBrandName('');
      setHasLogo(false);
      setLogoUrl('');
      fetchMyRequests();
    } catch (err) {
      alert('Error submitting brand');
    }
  };

  const fetchMyRequests = async () => {
    const res = await axios.get('http://localhost:5000/api/brands/my', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setMyRequests(res.data);
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  return (
    <div>
      <h2>Operator Panel</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Brend nomi" value={brandName}
               onChange={(e) => setBrandName(e.target.value)} required />

        <label>
          <input type="checkbox" checked={hasLogo} onChange={() => setHasLogo(!hasLogo)} />
          Logotip bor
        </label>

        {hasLogo && (
          <input type="text" placeholder="Logotip URL (hozircha matn ko‘rinishida)"
                 value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} required />
        )}

        <button type="submit">Yuborish</button>
      </form>

      <h3>Mening so‘rovlarim</h3>
      <ul>
        {myRequests.map((req) => (
          <li key={req._id}>
            <b>{req.brandName}</b> | Status: {req.status} {req.hasLogo && ` | Logo: ✅`}
          </li>
        ))}
      </ul>
    </div>
  );
}
{myRequests.filter(r => r.status === 'checked' && r.documentReview?.comment).map((req) => (
  <li key={req._id}>
    ⚠️ {req.brandName} — Xatolik: {req.documentReview.comment}
    {req.documentReview.fileUrl && (
      <div><a href={req.documentReview.fileUrl} target="_blank">Screenshot</a></div>
    )}
    <a href={`/submit-docs/${req._id}`}>Qayta topshirish</a>
  </li>
))}

