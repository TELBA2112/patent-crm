import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const AdminJobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await apiFetch(`/api/jobs/${id}`);
        if (!res.ok) throw new Error('Ish topilmadi');
        const data = await res.json();
        setJob(data);
      } catch (err) {
        console.error(err);
        alert('Ishni olishda xatolik');
      }
    };
    if (id) fetchJob();
  }, [id, token]);

  if (!job) return <div>Yuklanmoqda...</div>;

  return (
    <div>
      <h2>{job.brandName || 'Ish Detallari'}</h2>
      <p>Oxirgi status: {job.status}</p>
      <h3>Harakatlar tarixi</h3>
  <table>
        <thead>
          <tr>
            <th>Harakat</th>
            <th>Status</th>
            <th>Sabab</th>
            <th>Kimga</th>
            <th>Sana</th>
          </tr>
        </thead>
        <tbody>
      {(job.history || []).map((entry, index) => (
            <tr key={index}>
        <td>{entry.action || '-'}</td>
              <td>{entry.status}</td>
        <td>{entry.reason || entry.comment || '-'}</td>
        <td>{entry.updatedBy?.username || entry.updatedBy || '-'}</td>
              <td>{new Date(entry.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminJobDetails;