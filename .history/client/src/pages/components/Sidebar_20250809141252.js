// components/Sidebar.js
import React from 'react';
import './Sidebar.css';

// menuItems: [{ key, icon, label }]
function Sidebar({ current, setCurrent, onLogout, menuItems, title }) {
  // Himoya: agar menuItems undefined bo‘lsa, bo‘sh massiv ishlat
  const items = menuItems || [];
  return (
    <div className="sidebar">
      <h2>{title || 'Panel'}</h2>
      <ul>
        {items.map(item => (
          <li
            key={item.key}
            className={current === item.key ? 'active' : ''}
            onClick={() => item.key === 'logout' ? onLogout() : setCurrent(item.key)}
          >
            <span role="img" aria-label={item.key}>{item.icon}</span> {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
