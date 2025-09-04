import React, { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '../../utils/api';
import './NotificationsList.css';

const NotificationsList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/notifications');
      if (!res.ok) {
        throw new Error('Bildirishnomalarni yuklashda xatolik');
      }
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error('Bildirishnomalarni olishda xatolik:', err);
      setError('Bildirishnomalarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };
  
  const markAsRead = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      
      if (!res.ok) {
        throw new Error('Bildirishnomani o\'qilgan deb belgilashda xatolik');
      }
      
      // Update local state to reflect the change
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, read: true } : notification
      ));
    } catch (err) {
      console.error('Bildirishnomani yangilashda xatolik:', err);
    }
  };
  
  const downloadAttachment = (notificationId, attachmentIndex, fileName) => {
    // Create a download link and trigger it
    const downloadUrl = `${API_BASE}/api/notifications/${notificationId}/attachment/${attachmentIndex}`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || 'bildirishnoma-ilova';
    
    // Add auth token to the download request
    a.setAttribute('data-token', localStorage.getItem('token'));
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };
  
  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    
    if (fileType.includes('image')) {
      return '🖼️';
    } else if (fileType.includes('pdf')) {
      return '📕';
    } else if (fileType.includes('word')) {
      return '📝';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return '📊';
    } else {
      return '📄';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Format: DD.MM.YYYY HH:MM
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', '');
  };
  
  const filteredNotifications = showUnreadOnly
    ? notifications.filter(notification => !notification.read)
    : notifications;
  
  if (loading) {
    return <div className="notifications-loading">Bildirishnomalar yuklanmoqda...</div>;
  }
  
  if (error) {
    return <div className="notifications-error">{error}</div>;
  }
  
  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h3>📬 Bildirishnomalar</h3>
        <div className="notifications-filter">
          <label>
            <input 
              type="checkbox" 
              checked={showUnreadOnly} 
              onChange={() => setShowUnreadOnly(!showUnreadOnly)} 
            />
            Faqat o'qilmaganlarni ko'rsatish
          </label>
          <button onClick={fetchNotifications} className="refresh-btn">
            🔄 Yangilash
          </button>
        </div>
      </div>
      
      {filteredNotifications.length === 0 ? (
        <div className="no-notifications">
          Bildirishnomalar yo'q
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map(notification => (
            <div 
              key={notification._id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => !notification.read && markAsRead(notification._id)}
            >
              <div className="notification-content">
                <div className="notification-title">
                  {!notification.read && <span className="unread-marker">•</span>}
                  {notification.title}
                </div>
                <div className="notification-message">{notification.message}</div>
                
                {notification.link && (
                  <a 
                    href={notification.link}
                    className="notification-link"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 Havolani ochish
                  </a>
                )}
                
                {notification.attachments && notification.attachments.length > 0 && (
                  <div className="notification-attachments">
                    <div className="attachments-header">Ilovalar:</div>
                    <div className="attachments-list">
                      {notification.attachments.map((attachment, index) => (
                        <div 
                          key={index} 
                          className="attachment-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadAttachment(notification._id, index, attachment.fileName);
                          }}
                        >
                          <div className="attachment-icon">
                            {getFileIcon(attachment.fileType)}
                          </div>
                          <div className="attachment-info">
                            <div className="attachment-name">{attachment.fileName}</div>
                            <div className="attachment-details">
                              {formatFileSize(attachment.fileSize)} • {formatDate(attachment.uploadedAt)}
                            </div>
                          </div>
                          <button className="download-btn">⬇️</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="notification-date">{formatDate(notification.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
