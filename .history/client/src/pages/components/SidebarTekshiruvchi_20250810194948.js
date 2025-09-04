import React from 'react';
import './SidebarOperator.css';

function SidebarOperator({ current, setCurrent, onLogout }) {
  return (
    <div className="sidebar">
      <h2>📝 Operator Panel</h2>
      <ul>
        {/* ... other list items ... */}
        <li onClick={onLogout}>🚪 Chiqish</li>
      </ul>
    </div>
  );
}

export default SidebarOperator;