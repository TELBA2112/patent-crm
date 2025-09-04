import React from 'react';
import './SidebarOperator.css';

function SidebarOperator({ current, setCurrent, onLogout }) {
  return (
    <div className="sidebar-admin">
      <h2 className="sidebar-title">📝 Operator Panel</h2>
      <ul className="sidebar-list">
        <li className={current === 'profil' ? 'active' : ''} onClick={() => setCurrent('profil')}>
          <span role="img" aria-label="profil">👤</span> Profil
        </li>
        <li className={current === 'yangi' ? 'active' : ''} onClick={() => setCurrent('yangi')}>
          <span role="img" aria-label="yangi">🟦</span> Yangi mijozlar
        </li>
        <li className={current === 'jarayonda' ? 'active' : ''} onClick={() => setCurrent('jarayonda')}>
          <span role="img" aria-label="jarayonda">🟨</span> Jarayonda
        </li>
        <li className={current === 'tugatilgan' ? 'active' : ''} onClick={() => setCurrent('tugatilgan')}>
          <span role="img" aria-label="tugatilgan">✅</span> Tugatilgan
        </li>
        <li onClick={onLogout}>
          <span role="img" aria-label="chiqish">🚪</span> Chiqish
        </li>
      </ul>
    </div>
  );
}

export default SidebarOperator;
