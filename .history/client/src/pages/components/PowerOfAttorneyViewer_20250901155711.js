import React, { useState } from 'react';
import './PowerOfAttorneyViewer.css';

const PowerOfAttorneyViewer = ({ job, token }) => {
  const [loading, setLoading] = useState(false);
  
  if (!job || !job.powerOfAttorney || !job.powerOfAttorney.content) {
    return (
      <div className="power-of-attorney-viewer power-of-attorney-missing">
        <p>Bu ish uchun ishonchnoma mavjud emas</p>
      </div>
    );
  }
  
  const downloadPowerOfAttorney = async (format) => {
    try {
      setLoading(true);
      
      let url, filename;
      
      if (format === 'pdf') {
        url = `http://localhost:5000/api/jobs/${job._id}/power-of-attorney-pdf`;
        filename = `ishonchnoma_${job.clientName || 'mijoz'}.pdf`;
      } else {
        // HTML to DOCX conversion (client-side)
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Ishonchnoma</title></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + job.powerOfAttorney.content + postHtml;
        
        // Create a Blob with the content
        const blob = new Blob(['\ufeff', html], {
          type: 'application/msword'
        });
        
        // Create download link
        url = URL.createObjectURL(blob);
        filename = `ishonchnoma_${job.clientName || 'mijoz'}.docx`;
      }
      
      // Download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // If it's a blob URL, revoke it to free memory
      if (format !== 'pdf') {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Ishonchnomani yuklab olishda xatolik:', error);
      alert('Xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="power-of-attorney-viewer">
      <div className="power-of-attorney-header">
        <h3>Ishonchnoma</h3>
        <div className="power-of-attorney-type">
          {job.powerOfAttorney.personType === 'jismoniy' ? 'Jismoniy shaxs uchun' : 'Yuridik shaxs uchun'}
        </div>
      </div>
      
      <div className="power-of-attorney-preview">
        <div dangerouslySetInnerHTML={{ __html: job.powerOfAttorney.content }} />
      </div>
      
      <div className="power-of-attorney-actions">
        <button 
          onClick={() => downloadPowerOfAttorney('docx')} 
          disabled={loading}
          className="download-btn docx-btn"
        >
          <i className="download-icon">📄</i> Word formatida yuklab olish
        </button>
        <button 
          onClick={() => downloadPowerOfAttorney('pdf')} 
          disabled={loading}
          className="download-btn pdf-btn"
        >
          <i className="download-icon">📑</i> PDF formatida yuklab olish
        </button>
      </div>
    </div>
  );
};

export default PowerOfAttorneyViewer;
