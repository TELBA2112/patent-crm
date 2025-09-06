// components/UserTable.js
import React from 'react';
import './UserTable.css';

function UserTable({ users, role, onEdit, onDelete, onBalance }) {
  return (
    <div>
      <h2>👥 {role.charAt(0).toUpperCase() + role.slice(1)}lar ro‘yxati</h2>
      <table>
        <thead>
          <tr>
            <th>Login</th>
            <th>Ism</th>
            <th>Familiya</th>
            <th>Balans</th>
            <th>Amallar</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.username}</td>
              <td>{u.firstName || '-'}</td>
              <td>{u.lastName || '-'}</td>
              <td>{u.balance?.toLocaleString() || 0} so‘m</td>
              <td>
                <button onClick={() => onEdit(u)}>✏️</button>
                <button onClick={() => onBalance(u, 10000)}>➕ 10k</button>
                <button onClick={() => onBalance(u, -5000)}>➖ 5k</button>
                <button onClick={() => onDelete(u._id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;
