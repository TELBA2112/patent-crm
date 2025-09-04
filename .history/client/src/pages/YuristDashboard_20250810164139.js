import React, { useState } from 'react';

function YuristDashboard() {
  const [tasks, setTasks] = useState([]);
  // Fetch jobs with status 'to_lawyer'

  const handleUploadCertificates = (jobId, file) => {
    const formData = new FormData();
    formData.append('certificates', file);
    fetch(`/api/jobs/${jobId}/upload-certificates`, {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
  };

  return (
    <div>
      <h2>Yurist Panel</h2>
      {tasks.map(task => (
        <div key={task._id}>
          <input type="file" accept=".rar" onChange={(e) => handleUploadCertificates(task._id, e.target.files[0])} />
        </div>
      ))}
    </div>
  );
}

export default YuristDashboard;