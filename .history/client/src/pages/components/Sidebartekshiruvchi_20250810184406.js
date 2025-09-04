import React from 'react';
import './Sidebartekshiruvchi.css';

function Sidebartekshiruvchi({ current, setCurrent, onLogout }) {
  return (
    <div className="sidebar">
      <h2>📝 Operator Panel</h2>
      <ul>
        <li className={current === 'profil' ? 'active' : ''} onClick={() => setCurrent('profil')}>👤 Profil</li>
        <li className={current === 'yangi' ? 'active' : ''} onClick={() => setCurrent('yangi')}>🟦 Yangi mijozlar</li>
        <li className={current === 'jarayonda' ? 'active' : ''} onClick={() => setCurrent('jarayonda')}>🟨 Jarayonda</li>
        <li className={current === 'tugatilgan' ? 'active' : ''} onClick={() => setCurrent('tugatilgan')}>✅ Tugatilgan</li>
        <li onClick={onLogout}>🚪 Chiqish</li>
      </ul>
    </div>
  );
}

export default Sidebartekshiruvchi;
