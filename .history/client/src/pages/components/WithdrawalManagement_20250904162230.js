import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/api';
import './WithdrawalManagement.css';

const WithdrawalManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [expandedRequestId, setExpandedRequestId] = useState(null);

  // Fetch withdrawal requests
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/payouts/requests?status=${filterStatus}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch withdrawal requests');
        }
        
        const data = await response.json();
        setRequests(data);
      } catch (err) {
        setError('Error loading withdrawal requests: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filterStatus]);

  // Handle approving a request
  const handleApproveRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal request?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/payouts/requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve request');
      }

      // Update request status in the list
      setRequests(requests.map(req => 
        req._id === requestId ? { ...req, status: 'approved', processedAt: new Date().toISOString() } : req
      ));
    } catch (err) {
      setError('Error approving request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting a request
  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Rad etish sababini kiriting:');
    if (reason === null) return; // User cancelled

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/payouts/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject request');
      }

      // Update request status in the list
      setRequests(requests.map(req => 
        req._id === requestId ? { 
          ...req, 
          status: 'rejected', 
          rejectionReason: reason,
          processedAt: new Date().toISOString() 
        } : req
      ));
    } catch (err) {
      setError('Error rejecting request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render mood emoji based on mood value
  const renderMoodEmoji = (mood) => {
    switch (mood) {
      case 'happy': return '😃';
      case 'neutral': return '😐';
      case 'sad': return '😔';
      default: return '';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', { 
      style: 'currency', 
      currency: 'UZS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="withdrawal-management-container">
      <h2>To'lov so'rovlarini boshqarish</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filter-controls">
        <button 
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Kutilayotgan
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
          onClick={() => setFilterStatus('approved')}
        >
          Tasdiqlangan
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilterStatus('rejected')}
        >
          Rad etilgan
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Barchasi
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Yuklanmoqda...</div>
      ) : requests.length === 0 ? (
        <div className="no-requests">So'rovlar topilmadi</div>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div 
              key={request._id} 
              className={`request-item ${request.status}`}
            >
              <div 
                className="request-header" 
                onClick={() => setExpandedRequestId(
                  expandedRequestId === request._id ? null : request._id
                )}
              >
                <div className="request-summary">
                  <div className="request-mood">{renderMoodEmoji(request.mood)}</div>
                  <div className="request-user">{request.user?.fullName || 'Unknown user'}</div>
                  <div className="request-amount">{formatCurrency(request.amount)}</div>
                  <div className="request-date">{formatDate(request.createdAt)}</div>
                  <div className="request-status-badge">{request.status}</div>
                </div>
                <div className="expand-icon">
                  {expandedRequestId === request._id ? '▼' : '▶'}
                </div>
              </div>
              
              {expandedRequestId === request._id && (
                <div className="request-details">
                  <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{request._id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Xodim:</span>
                    <span className="detail-value">
                      {request.user?.fullName} ({request.user?.role})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Summa:</span>
                    <span className="detail-value">{formatCurrency(request.amount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Kayfiyat:</span>
                    <span className="detail-value">
                      {renderMoodEmoji(request.mood)} {request.mood === 'happy' ? 'Juda yaxshi' : request.mood === 'neutral' ? 'Normal' : 'Yomon'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Karta:</span>
                    <div className="card-info">
                      <div>{request.card?.cardNumber}</div>
                      <div>{request.card?.cardHolder}</div>
                      <div>{request.card?.bankName}</div>
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">So'rov sanasi:</span>
                    <span className="detail-value">{formatDate(request.createdAt)}</span>
                  </div>
                  
                  {request.processedAt && (
                    <div className="detail-row">
                      <span className="detail-label">Qayta ishlangan sana:</span>
                      <span className="detail-value">{formatDate(request.processedAt)}</span>
                    </div>
                  )}
                  
                  {request.rejectionReason && (
                    <div className="detail-row">
                      <span className="detail-label">Rad etish sababi:</span>
                      <span className="detail-value rejection-reason">{request.rejectionReason}</span>
                    </div>
                  )}
                  
                  {request.status === 'pending' && (
                    <div className="action-buttons">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveRequest(request._id)}
                        disabled={loading}
                      >
                        ✓ Tasdiqlash
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleRejectRequest(request._id)}
                        disabled={loading}
                      >
                        ✗ Rad etish
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
