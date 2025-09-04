import React from 'react';

function HistoryBlock({ history = [] }) {
  if (!Array.isArray(history) || history.length === 0) return null;
  return (
    <div className="history-block">
      {history.map((h, i) => (
        <div key={i} className="history-item">
          <div><strong>Status:</strong> {h.status || '-'}</div>
          {h.comment && <div><strong>Izoh:</strong> {h.comment}</div>}
          {h.reason && <div><strong>Sabab:</strong> {h.reason}</div>}
          <div><strong>Sana:</strong> {h.date ? new Date(h.date).toLocaleString() : '-'}</div>
          {i < history.length - 1 && <hr />}
        </div>
      ))}
    </div>
  );
}

export default HistoryBlock;
