import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const AdminJobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setJob(data);
      } catch (err) {
        alert('Ishni olishda xatolik');
      }
    };
    fetchJob();
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
          {job.history.map((entry, index) => (
            <tr key={index}>
              <td>{entry.action}</td>
              <td>{entry.status}</td>
              <td>{entry.reason || '-'}</td>
              <td>{entry.updatedBy?.username || '-'}</td>
              <td>{new Date(entry.date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminJobDetails;