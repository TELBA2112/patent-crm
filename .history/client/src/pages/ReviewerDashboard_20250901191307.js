import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const ReviewerDashboard = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [token, setToken] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [reviewDecision, setReviewDecision] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [mktuInput, setMktuInput] = useState('');
  
  useEffect(() => {
    // Tokenni olish va dekodlash
    const fetchToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const decoded = jwtDecode(storedToken);
        console.log('Foydalanuvchi ma\'lumotlari:', decoded);
        
        // Faqat admin yoki tekshiruvchi bo'lsa, ishni yuklash
        if (decoded.role === 'admin' || decoded.role === 'reviewer') {
          loadJobDetails(id);
        } else {
          alert('Sizda ushbu sahifani ko\'rish uchun ruxsat yo\'q');
        }
      }
    };
    
    fetchToken();
  }, [id]);
  
  // Ish ma'lumotlarini yuklash
  const loadJobDetails = async (jobId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Ish ma\'lumotlarini yuklashda xatolik');
      
      const data = await res.json();
      setJob(data);
      console.log('Ish ma\'lumotlari yuklandi:', data);
    } catch (err) {
      console.error('Ishni yuklashda xatolik:', err);
      alert('Ish ma\'lumotlarini yuklashda xatolik: ' + err.message);
    }
  };
  
  // Brend tekshiruvi modal oynasi
  const renderBrandReviewModal = () => {
    if (!selectedBrand) return null;

    return (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={() => setSelectedBrand(null)}>&times;</span>
          <h2>Brend tekshiruvi</h2>
          
          <div className="brand-details">
            <p><strong>Brend nomi:</strong> {selectedBrand.brandName}</p>
            <p><strong>Mijoz:</strong> {selectedBrand.clientName} {selectedBrand.clientSurname}</p>
            <p><strong>Telefon:</strong> {selectedBrand.phone}</p>
            <p><strong>Status:</strong> <span className={`status-${selectedBrand.status}`}>{getBrandStatusText(selectedBrand.status)}</span></p>
            
            {/* Operator tomonidan kiritilgan faoliyat turi haqida ma'lumot */}
            <div className="activity-notes-section">
              <h3>Mijoz faoliyati haqida ma'lumot:</h3>
              <div className="activity-notes-display">
                {selectedBrand.activityNotes ? (
                  <p>{selectedBrand.activityNotes}</p>
                ) : (
                  <p className="no-data">Operator tomonidan ma'lumot kiritilmagan</p>
                )}
              </div>
            </div>
            
            {/* MKTU sinflarini qo'lda kiritish */}
            <div className="mktu-classes-section">
              <h3>MKTU sinflarini kiriting:</h3>
              <p className="reviewer-note">Mijoz faoliyatiga mos MKTU sinflarini qo'lda kiriting. Raqamlarni vergul bilan ajrating.</p>
              
              <div className="mktu-input-container">
                <input
                  type="text"
                  value={mktuInput}
                  onChange={(e) => setMktuInput(e.target.value)}
                  placeholder="Masalan: 3, 5, 35, 42"
                  className="mktu-input"
                />
                <button 
                  className="add-mktu-btn"
                  onClick={handleAddMktuClasses}
                >
                  MKTU sinflarini qo'shish
                </button>
              </div>
              
              {/* Kiritilgan MKTU sinflarini ko'rsatish */}
              {selectedBrand.classes && selectedBrand.classes.length > 0 ? (
                <div className="selected-classes">
                  <h4>Kiritilgan MKTU sinflari:</h4>
                  <div className="classes-tags">
                    {selectedBrand.classes.sort((a, b) => a - b).map(classNum => (
                      <span key={classNum} className="class-tag">{classNum}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-classes">Hali MKTU sinflari kiritilmagan</p>
              )}
            </div>
            
            <div className="review-decision">
              <h3>Tekshiruv natijasi:</h3>
              <div className="decision-buttons">
                <button 
                  className={`approve-btn ${reviewDecision === 'approve' ? 'active' : ''}`}
                  onClick={() => setReviewDecision('approve')}
                >
                  ✅ Tasdiqlash
                </button>
                <button 
                  className={`reject-btn ${reviewDecision === 'reject' ? 'active' : ''}`}
                  onClick={() => setReviewDecision('reject')}
                >
                  ❌ Rad etish
                </button>
              </div>
              
              {reviewDecision === 'reject' && (
                <textarea
                  placeholder="Rad etish sababini kiriting..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="reject-reason"
                ></textarea>
              )}
              
              <button 
                className="submit-review-btn"
                onClick={submitReviewDecision}
                disabled={
                  (!reviewDecision) || 
                  (reviewDecision === 'reject' && !rejectReason) || 
                  (reviewDecision === 'approve' && (!selectedBrand.classes || selectedBrand.classes.length === 0))
                }
              >
                Saqlash
              </button>
              {reviewDecision === 'approve' && (!selectedBrand.classes || selectedBrand.classes.length === 0) && (
                <p className="validation-error">Tasdiqlash uchun kamida bitta MKTU sinfini kiriting!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // MKTU sinflarini qo'shish uchun funksiya
  const handleAddMktuClasses = () => {
    // Vergul bilan ajratilgan raqamlarni array'ga aylantirish
    const inputClasses = mktuInput
      .split(',')
      .map(str => parseInt(str.trim()))
      .filter(num => !isNaN(num) && num > 0 && num <= 45); // Faqat 1 dan 45 gacha bo'lgan sonlar
      
    if (inputClasses.length === 0) {
      alert('Iltimos, to\'g\'ri format kiriting. Masalan: 3, 5, 35');
      return;
    }
    
    // Duplikatlarni olib tashlash va serverga saqlash
    const uniqueClasses = [...new Set(inputClasses)];
    
    saveSelectedClasses(uniqueClasses);
  };
  
  // MKTU sinflarini serverga saqlash
  const saveSelectedClasses = async (classes) => {
    if (!selectedBrand || !selectedBrand._id) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${selectedBrand._id}/mktu-classes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ classes })
      });
      
      if (!res.ok) throw new Error('MKTU sinflarini saqlashda xatolik');
      
      const data = await res.json();
      
      // Tanlangan brandni yangilash
      setSelectedBrand({
        ...selectedBrand,
        classes: data.classes
      });
      
      setMktuInput(''); // Input maydonini tozalash
      alert('MKTU sinflari muvaffaqiyatli saqlandi');
      
    } catch (err) {
      console.error('MKTU sinflarini saqlashda xatolik:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  // Tekshiruv natijasini yuborish
  const submitReviewDecision = async () => {
    if (!selectedBrand || !reviewDecision) return;
    
    // Tasdiqlash uchun MKTU sinflarni tekshirish
    if (reviewDecision === 'approve' && (!selectedBrand.classes || selectedBrand.classes.length === 0)) {
      alert('Tasdiqlash uchun kamida bitta MKTU sinfini kiriting!');
      return;
    }
    
    // Rad etish uchun sababni tekshirish
    if (reviewDecision === 'reject' && !rejectReason) {
      alert('Rad etish sababini kiriting!');
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/job-actions/${selectedBrand._id}/review-brand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          approved: reviewDecision === 'approve',
          reason: reviewDecision === 'reject' ? rejectReason : null,
          classes: selectedBrand.classes || []
        })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Statusni yangilashda xatolik: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      alert(`Brend "${selectedBrand.brandName}" ${reviewDecision === 'approve' ? 'tasdiqlandi' : 'rad etildi'}`);
      
      setSelectedBrand(null);
      setReviewDecision(null);
      setRejectReason('');
      setMktuInput('');
      loadJobs(); // Yangi ma'lumotlarni yuklash
      
    } catch (err) {
      console.error('Tekshiruv natijasini yuborishda xatolik:', err);
      alert('Xatolik: ' + err.message);
    }
  };

  // Brend statusini matnga aylantirish
  const getBrandStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'Yangi';
      case 'in_review':
        return 'Tekshirilmoqda';
      case 'approved':
        return 'Tasdiqlangan';
      case 'rejected':
        return 'Rad etilgan';
      default:
        return 'Noma\'lum';
    }
  };

  return (
    <div className="reviewer-dashboard">
      <h1>Reviewer Dashboard</h1>
      
      {/* Ish ma'lumotlari */}
      {job && (
        <div className="job-details">
          <h2>Ish ID: {job._id}</h2>
          <p><strong>Mijoz:</strong> {job.clientName} {job.clientSurname}</p>
          <p><strong>Telefon:</strong> {job.phone}</p>
          <p><strong>Brend nomi:</strong> {job.brandName}</p>
          <p><strong>Status:</strong> <span className={`status-${job.status}`}>{getBrandStatusText(job.status)}</span></p>
          
          {/* Faoliyat turi haqida ma'lumot */}
          <div className="activity-notes-section">
            <h3>Mijoz faoliyati haqida ma'lumot:</h3>
            <div className="activity-notes-display">
              {job.activityNotes ? (
                <p>{job.activityNotes}</p>
              ) : (
                <p className="no-data">Operator tomonidan ma'lumot kiritilmagan</p>
              )}
            </div>
          </div>
          
          {/* MKTU sinflari */}
          <div className="mktu-classes-section">
            <h3>MKTU sinflari:</h3>
            {job.classes && job.classes.length > 0 ? (
              <div className="classes-tags">
                {job.classes.sort((a, b) => a - b).map(classNum => (
                  <span key={classNum} className="class-tag">{classNum}</span>
                ))}
              </div>
            ) : (
              <p className="no-classes">Hali MKTU sinflari kiritilmagan</p>
            )}
          </div>
          
          {/* Tekshiruv natijasi */}
          <div className="review-decision">
            <h3>Tekshiruv natijasi:</h3>
            <div className="decision-buttons">
              <button 
                className={`approve-btn ${reviewDecision === 'approve' ? 'active' : ''}`}
                onClick={() => setReviewDecision('approve')}
              >
                ✅ Tasdiqlash
              </button>
              <button 
                className={`reject-btn ${reviewDecision === 'reject' ? 'active' : ''}`}
                onClick={() => setReviewDecision('reject')}
              >
                ❌ Rad etish
              </button>
            </div>
            
            {reviewDecision === 'reject' && (
              <textarea
                placeholder="Rad etish sababini kiriting..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="reject-reason"
              ></textarea>
            )}
            
            <button 
              className="submit-review-btn"
              onClick={submitReviewDecision}
              disabled={
                (!reviewDecision) || 
                (reviewDecision === 'reject' && !rejectReason) || 
                (reviewDecision === 'approve' && (!job.classes || job.classes.length === 0))
              }
            >
              Saqlash
            </button>
            {reviewDecision === 'approve' && (!job.classes || job.classes.length === 0) && (
              <p className="validation-error">Tasdiqlash uchun kamida bitta MKTU sinfini kiriting!</p>
            )}
          </div>
        </div>
      )}
      
      {/* Brend tekshiruvi tugmasi */}
      <div className="action-buttons">
        <button 
          className="review-brand-btn"
          onClick={() => setSelectedBrand(job)}
        >
          Brendni tekshirish
        </button>
      </div>
      
      {/* Brend tekshiruvi modal oynasi */}
      {renderBrandReviewModal()}
      
      <style jsx>{`
        .reviewer-dashboard {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        h1 {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .job-details {
          margin-bottom: 30px;
        }
        
        .job-details h2 {
          margin-bottom: 15px;
          font-size: 22px;
          color: #333;
        }
        
        .job-details p {
          margin: 8px 0;
          font-size: 16px;
          color: #555;
        }
        
        .status-new { color: #007bff; }
        .status-in_review { color: #ffc107; }
        .status-approved { color: #28a745; }
        .status-rejected { color: #dc3545; }
        
        .activity-notes-section {
          background-color: #f5f9ff;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border: 1px solid #cfe8ff;
        }
        
        .activity-notes-display {
          background: white;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          max-height: 120px;
          overflow-y: auto;
        }
        
        .no-data {
          color: #999;
          font-style: italic;
        }
        
        .mktu-classes-section {
          margin: 20px 0;
          background-color: #f0fff4;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #c8e6c9;
        }
        
        .reviewer-note {
          font-style: italic;
          color: #555;
          margin-bottom: 15px;
        }
        
        .mktu-input-container {
          display: flex;
          margin-bottom: 15px;
        }
        
        .mktu-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px 0 0 4px;
          font-size: 16px;
        }
        
        .add-mktu-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 0 15px;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          font-weight: bold;
        }
        
        .add-mktu-btn:hover {
          background: #388E3C;
        }
        
        .selected-classes {
          margin-top: 15px;
        }
        
        .classes-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .class-tag {
          background: #4CAF50;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: bold;
        }
        
        .no-classes {
          color: #f44336;
          font-style: italic;
        }
        
        .validation-error {
          color: #f44336;
          font-weight: bold;
          margin-top: 10px;
        }
        
        .action-buttons {
          text-align: center;
          margin-top: 20px;
        }
        
        .review-brand-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }
        
        .review-brand-btn:hover {
          background: #0056b3;
        }
        
        .modal {
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgb(0,0,0);
          background-color: rgba(0,0,0,0.4);
          padding-top: 60px;
        }
        
        .modal-content {
          background-color: #fefefe;
          margin: 5% auto;
          padding: 20px;
          border: 1px solid #888;
          width: 80%;
          max-width: 600px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
        }
        
        .close:hover,
        .close:focus {
          color: black;
          text-decoration: none;
          cursor: pointer;
        }
        
        @media (max-width: 600px) {
          .modal-content {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewerDashboard;