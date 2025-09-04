import React from 'react';
import './SidebarTekshiruvchi.css';

const SidebarTekshiruvchi = ({ current, setCurrent, onLogout }) => {
  return (
    <div className="sidebar-tekshiruvchi">
      <div className="sidebar-header">
        <h3>Tekshiruvchi</h3>
      </div>
      <div className="sidebar-nav">
        <button
          className={current === 'profil' ? 'active' : ''}
          onClick={() => setCurrent('profil')}
        >
          👤 Profil
        </button>
        <button
          className={current === 'brend' ? 'active' : ''}
          onClick={() => setCurrent('brend')}
        >
          📄 Brend tekshirish
        </button>
        <button
          className={current === 'hujjatlar' ? 'active' : ''}
          onClick={() => setCurrent('hujjatlar')}
        >
          📝 Topshirishga tayyor hujjatlar
        </button>
        <button
          className={current === 'yurist' ? 'active' : ''}
          onClick={() => setCurrent('yurist')}
        >
          ⚖️ Yurist
        </button>
      </div>
      <div className="sidebar-footer">
        {/* Chiqish tugmasi shu yerda joylashgan va onLogout funksiyasini ishga tushiradi */}
        <button onClick={onLogout}>🚪 Chiqish</button>
      </div>
    </div>
  );
};

export default SidebarTekshiruvchi;