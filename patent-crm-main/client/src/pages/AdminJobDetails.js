import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../utils/api';
import './AdminJobDetails.css';

const AdminJobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [payoutCalculation, setPayoutCalculation] = useState({
    operator: 0,
    tekshiruvchi: 0,
    yurist: 0,
    total: 0
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error('Ishni olishda xatolik');
        }
        
        const data = await res.json();
        setJob(data);

        // Initialize payout calculation with existing values if available
        if (data.payouts) {
          setPayoutCalculation({
            operator: data.payouts.operator?.amount || 0,
            tekshiruvchi: data.payouts.tekshiruvchi?.amount || 0,
            yurist: data.payouts.yurist?.amount || 0,
            total: data.payouts.total || 0
          });
        }
      } catch (err) {
        console.error('Ishni olishda xatolik:', err);
        setError(err.message || 'Ishni olishda xatolik');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [id, token]);

  // Function to handle payout calculation and saving
  const handleSavePayouts = async () => {
    try {
      const totalAmount = 
        parseInt(payoutCalculation.operator) + 
        parseInt(payoutCalculation.tekshiruvchi) + 
        parseInt(payoutCalculation.yurist);
      
      // Update total amount
      setPayoutCalculation(prev => ({
        ...prev,
        total: totalAmount
      }));
      
      const payoutsData = {
        operator: { amount: parseInt(payoutCalculation.operator), approved: false },
        tekshiruvchi: { amount: parseInt(payoutCalculation.tekshiruvchi), approved: false },
        yurist: { amount: parseInt(payoutCalculation.yurist), approved: false },
        total: totalAmount,
        currency: 'UZS',
        note: `Calculated by admin on ${new Date().toLocaleDateString()}`,
        calculatedAt: new Date()
      };
      
      const res = await fetch(`${API_BASE}/api/job-actions/${id}/set-payouts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ payouts: payoutsData })
      });
      
      if (!res.ok) {
        throw new Error('To\'lov ma\'lumotlarini saqlashda xatolik');
      }
      
      alert('To\'lov ma\'lumotlari muvaffaqiyatli saqlandi');
      
      // Refresh job data to get updated payouts
      const updatedJobRes = await fetch(`${API_BASE}/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedJobData = await updatedJobRes.json();
      setJob(updatedJobData);
      
    } catch (err) {
      console.error('To\'lov ma\'lumotlarini saqlashda xatolik:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  // Image preview handler
  const openImagePreview = (url) => {
    setSelectedImage(url);
  };

  // Close image preview
  const closeImagePreview = () => {
    setSelectedImage(null);
  };

  // Handle input change for payout calculations
  const handlePayoutChange = (e) => {
    const { name, value } = e.target;
    setPayoutCalculation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div className="loading-indicator">Yuklanmoqda...</div>;
  if (error) return <div className="error-message">Xatolik: {error}</div>;
  if (!job) return <div className="empty-state">Ma'lumot topilmadi</div>;

  return (
    <div className="admin-job-details">
      <div className="job-header">
        <h2>{job.brandName || 'Nomi ko\'rsatilmagan ish'}</h2>
        <span className={`status-badge status-${job.status}`}>
          {job.status || 'Status mavjud emas'}
        </span>
      </div>
      
      <div className="job-sections">
        {/* Basic Job Info Section */}
        <div className="job-section">
          <h3>Asosiy ma'lumotlar</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span className="info-value">{job._id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Mijoz:</span>
              <span className="info-value">{job.clientName} {job.clientSurname}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Telefon:</span>
              <span className="info-value">{job.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Brand nomi:</span>
              <span className="info-value">{job.brandName || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Shaxs turi:</span>
              <span className="info-value">{job.personType === 'yuridik' ? 'Yuridik shaxs' : job.personType === 'jismoniy' ? 'Jismoniy shaxs' : '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">MKTU sinflari:</span>
              <span className="info-value">{job.classes && job.classes.length ? job.classes.join(', ') : '-'}</span>
            </div>
          </div>
        </div>
        
        {/* Client Documents Section - Yuridik */}
        {job.personType === 'yuridik' && job.yuridikDocs && (
          <div className="job-section">
            <h3>Yuridik shaxs hujjatlari</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Kompaniya nomi:</span>
                <span className="info-value">{job.yuridikDocs.companyName || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">STIR:</span>
                <span className="info-value">{job.yuridikDocs.stir || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Manzil:</span>
                <span className="info-value">{job.yuridikDocs.companyAddress || job.yuridikDocs.permanentAddress || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Direktor:</span>
                <span className="info-value">{job.yuridikDocs.directorName || '-'}</span>
              </div>
            </div>
            
            <div className="documents-grid">
              {job.yuridikDocs.directorPassportImage && (
                <div className="document-preview" onClick={() => openImagePreview(job.yuridikDocs.directorPassportImage)}>
                  <div className="document-thumbnail">
                    <img src={job.yuridikDocs.directorPassportImage} alt="Direktor pasporti" />
                  </div>
                  <span className="document-label">Direktor pasporti</span>
                </div>
              )}
              
              {job.yuridikDocs.companyDocImage && (
                <div className="document-preview" onClick={() => openImagePreview(job.yuridikDocs.companyDocImage)}>
                  <div className="document-thumbnail">
                    <img src={job.yuridikDocs.companyDocImage} alt="Kompaniya hujjati" />
                  </div>
                  <span className="document-label">Kompaniya hujjati</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Client Documents Section - Jismoniy */}
        {job.personType === 'jismoniy' && job.jismoniyDocs && (
          <div className="job-section">
            <h3>Jismoniy shaxs hujjatlari</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">F.I.O.:</span>
                <span className="info-value">{job.jismoniyDocs.fullName || job.clientName + ' ' + job.clientSurname}</span>
              </div>
              <div className="info-item">
                <span className="info-label">JSHSHIR:</span>
                <span className="info-value">{job.jismoniyDocs.jshshir || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Manzil:</span>
                <span className="info-value">{job.jismoniyDocs.permanentAddress || '-'}</span>
              </div>
            </div>
            
            <div className="documents-grid">
              {job.jismoniyDocs.passportFrontImage && (
                <div className="document-preview" onClick={() => openImagePreview(job.jismoniyDocs.passportFrontImage)}>
                  <div className="document-thumbnail">
                    <img src={job.jismoniyDocs.passportFrontImage} alt="Pasport old qismi" />
                  </div>
                  <span className="document-label">Pasport old qismi</span>
                </div>
              )}
              
              {job.jismoniyDocs.passportBackImage && (
                <div className="document-preview" onClick={() => openImagePreview(job.jismoniyDocs.passportBackImage)}>
                  <div className="document-thumbnail">
                    <img src={job.jismoniyDocs.passportBackImage} alt="Pasport orqa qismi" />
                  </div>
                  <span className="document-label">Pasport orqa qismi</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* All Documents Section */}
        {job.documents && job.documents.length > 0 && (
          <div className="job-section">
            <h3>Barcha hujjatlar</h3>
            <div className="documents-list">
              {job.documents.map((doc, idx) => (
                <div className="document-item" key={idx}>
                  <div className="document-type">{doc.type || 'Nomi mavjud emas'}</div>
                  <div className="document-meta">
                    <span>Yuklangan: {new Date(doc.uploadedAt).toLocaleString()}</span>
                  </div>
                  <div className="document-actions">
                    {doc.path && (
                      <a href={doc.path} target="_blank" rel="noopener noreferrer" className="view-doc-btn">
                        Ko'rish
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Invoices Section */}
        {job.invoices && job.invoices.length > 0 && (
          <div className="job-section">
            <h3>To'lov hisoblari</h3>
            <div className="invoices-list">
              {job.invoices.map((invoice, idx) => (
                <div className="invoice-item" key={idx}>
                  <div className="invoice-amount">{invoice.amount ? `${invoice.amount.toLocaleString()} so'm` : 'Summa ko\'rsatilmagan'}</div>
                  <div className="invoice-meta">
                    <span>Status: {invoice.status}</span>
                    <span>Yaratilgan: {new Date(invoice.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="invoice-actions">
                    {invoice.filePath && (
                      <a href={invoice.filePath} target="_blank" rel="noopener noreferrer" className="view-invoice-btn">
                        Hisobni ko'rish
                      </a>
                    )}
                    {invoice.receiptPath && (
                      <a href={invoice.receiptPath} target="_blank" rel="noopener noreferrer" className="view-receipt-btn">
                        Chekni ko'rish
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Payouts Calculation Section */}
        <div className="job-section">
          <h3>Xodimlar uchun to'lov hisoblash</h3>
          <div className="payouts-form">
            <div className="payout-input-group">
              <label>Operator:</label>
              <input 
                type="number" 
                name="operator" 
                value={payoutCalculation.operator} 
                onChange={handlePayoutChange}
                min="0"
                className="payout-input"
              />
              <span className="currency">so'm</span>
            </div>
            
            <div className="payout-input-group">
              <label>Tekshiruvchi:</label>
              <input 
                type="number" 
                name="tekshiruvchi" 
                value={payoutCalculation.tekshiruvchi} 
                onChange={handlePayoutChange}
                min="0"
                className="payout-input"
              />
              <span className="currency">so'm</span>
            </div>
            
            <div className="payout-input-group">
              <label>Yurist:</label>
              <input 
                type="number" 
                name="yurist" 
                value={payoutCalculation.yurist} 
                onChange={handlePayoutChange}
                min="0"
                className="payout-input"
              />
              <span className="currency">so'm</span>
            </div>
            
            <div className="payout-total">
              <strong>Jami:</strong> {(parseInt(payoutCalculation.operator) + parseInt(payoutCalculation.tekshiruvchi) + parseInt(payoutCalculation.yurist)).toLocaleString()} so'm
            </div>
            
            <button onClick={handleSavePayouts} className="save-payouts-btn">
              To'lovlarni saqlash
            </button>
          </div>
        </div>
        
        {/* History Section */}
        <div className="job-section">
          <h3>Harakatlar tarixi</h3>
          <div className="history-list">
            {job.history && job.history.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Izoh</th>
                    <th>Sana</th>
                  </tr>
                </thead>
                <tbody>
                  {job.history.map((entry, index) => (
                    <tr key={index}>
                      <td><span className={`status-badge status-${entry.status}`}>{entry.status}</span></td>
                      <td>{entry.comment || '-'}</td>
                      <td>{new Date(entry.date).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-history">Tarix mavjud emas</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="image-preview-modal" onClick={closeImagePreview}>
          <div className="image-preview-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage} alt="Preview" />
            <button className="close-preview-btn" onClick={closeImagePreview}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminJobDetails;