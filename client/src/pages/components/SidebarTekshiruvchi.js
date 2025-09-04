import React from 'react';
import './SidebarTekshiruvchi.css';

function SidebarTekshiruvchi({ current, setCurrent, onLogout }) {
  return (
    <div className="sidebar">
      <h2>🕵️‍♂️ Tekshiruvchi Panel</h2>
      <ul>
        <li className={current === 'profil' ? 'active' : ''} onClick={() => setCurrent('profil')}>
          👤 Profil
        </li>
        <li className={current === 'brend' ? 'active' : ''} onClick={() => setCurrent('brend')}>
          📄 Brend tekshirish
        </li>
        <li className={current === 'korib_chiqilgan' ? 'active' : ''} onClick={() => setCurrent('korib_chiqilgan')}>
          ✅ Ko'rib chiqilgan ishlar
        </li>
        <li className={current === 'hujjatlar' ? 'active' : ''} onClick={() => setCurrent('hujjatlar')}>
          📝 Topshirishga tayyor hujjatlar
        </li>
        <li className={current === 'tugallangan' ? 'active' : ''} onClick={() => setCurrent('tugallangan')}>
          🏁 Tugallangan ishlar
        </li>
        <li className={current === 'tolovlar' ? 'active' : ''} onClick={() => setCurrent('tolovlar')}>
          💳 To'lovlar
        </li>
        <li className={current === 'tolov_sorovi' ? 'active' : ''} onClick={() => setCurrent('tolov_sorovi')}>
          💰 To'lov so'rovi
        </li>
        <li onClick={onLogout}>
          🚪 Chiqish
        </li>
      </ul>
    </div>
  );
}

export default SidebarTekshiruvchi;
