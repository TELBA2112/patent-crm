import React from 'react';
import './SidebarTekshiruvchi.css'; // TekshiruvchiDashboard.css faylini chaqiramiz

const SidebarTekshiruvchi = ({ current, setCurrent, onLogout }) => {
  return (
    <div className="sidebar-tekshiruvchi">
      <div className="sidebar-header">
        <h3>Tekshiruvchi</h3>
      </div>
      <ul className="sidebar-nav">
        <li
          className={current === 'profil' ? 'active' : ''}
          onClick={() => setCurrent('profil')}
        >
          👤 Profil
        </li>
        <li
          className={current === 'brend' ? 'active' : ''}
          onClick={() => setCurrent('brend')}
        >
          📄 Brend tekshirish
        </li>
        <li
          className={current === 'hujjatlar' ? 'active' : ''}
          onClick={() => setCurrent('hujjatlar')}
        >
          📝 Topshirishga tayyor hujjatlar
        </li>
        <li
          className={current === 'yurist' ? 'active' : ''}
          onClick={() => setCurrent('yurist')}
        >
          ⚖️ Yurist
        </li>
        <li onClick={onLogout} className="logout-button">
          🚪 Chiqish
        </li>
      </ul>
    </div>
  );
};

export default SidebarTekshiruvchi;