// components/Sidebar.js
import React from 'react';
import './Sidebar.css';

function Sidebar({ current, setCurrent, onLogout }) {
  return (
    <div className="sidebar">
      <h2>📋 Admin Panel</h2>
      <ul>
        <li className={current === 'profil' ? 'active' : ''} onClick={() => setCurrent('profil')}>👤 Profil</li>
        <li className={current === 'operator' ? 'active' : ''} onClick={() => setCurrent('operator')}>👷 Operatorlar</li>
        <li className={current === 'tekshiruvchi' ? 'active' : ''} onClick={() => setCurrent('tekshiruvchi')}>🔍 Tekshiruvchilar</li>
        <li className={current === 'yurist' ? 'active' : ''} onClick={() => setCurrent('yurist')}>⚖️ Yuristlar</li>
        <li className={current === 'ishlar' ? 'active' : ''} onClick={() => setCurrent('ishlar')}>📦 Ishlar</li>
        <li className={current === 'tolovlar' ? 'active' : ''} onClick={() => setCurrent('tolovlar')}>💰 To'lovlar</li>
        <li className={current === 'oyliklar' ? 'active' : ''} onClick={() => setCurrent('oyliklar')}>💵 Oyliklar</li>
        <li onClick={onLogout}>🚪 Chiqish</li>
      </ul>
    </div>
  );
}

export default Sidebar;
