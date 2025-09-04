import React, { useState } from 'react';
import './ExcelImport.css';

function ExcelImport({ token, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Faqat .xlsx va .xls fayllarini qabul qilish
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls'].includes(fileExt)) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Faqat Excel (.xlsx, .xls) fayllariga ruxsat berilgan!');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Iltimos, Excel faylini tanlang');
      return;
    }

    setLoading(true);
    setResults(null);
    setError('');

    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const res = await fetch('http://localhost:5000/api/jobs/import-excel', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Excel faylini yuklashda xatolik yuz berdi');
      }

      setResults(data.results);
      if (onImportComplete) {
        onImportComplete(data.results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="excel-import-container">
      <h3>📥 Excel orqali ishlarni yuklash</h3>
      
      <form onSubmit={handleSubmit} className="excel-import-form">
        <div className="file-input-wrapper">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            id="excel-file"
            disabled={loading}
          />
          <label htmlFor="excel-file" className="file-input-label">
            {file ? file.name : 'Excel faylini tanlang'}
          </label>
        </div>
        
        <button type="submit" disabled={!file || loading} className="upload-button">
          {loading ? 'Yuklanmoqda...' : 'Yuklash'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}
      
      {results && (
        <div className="import-results">
          <h4>Import natijalari:</h4>
          <p><strong>Umumiy:</strong> {results.total}</p>
          <p><strong>Muvaffaqiyatli:</strong> {results.success}</p>
          <p><strong>Muvaffaqiyatsiz:</strong> {results.failed}</p>
          
          {results.errors && results.errors.length > 0 && (
            <div className="import-errors">
              <h5>Xatoliklar:</h5>
              <ul>
                {results.errors.map((err, index) => (
                  <li key={index}>{err.row}: {err.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="excel-template">
        <h4>Excel fayl formati:</h4>
        <p>Excel faylingiz quyidagi ustunlarga ega bo'lishi kerak:</p>
        <table className="template-table">
          <thead>
            <tr>
              <th>clientName</th>
              <th>clientSurname</th>
              <th>phone</th>
              <th>brandName</th>
              <th>personType</th>
              <th>assignedTo</th>
              <th>status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Akmal</td>
              <td>Akmalov</td>
              <td>+998901234567</td>
              <td>Example Brand</td>
              <td>yuridik</td>
              <td>operator1</td>
              <td>yangi</td>
            </tr>
          </tbody>
        </table>
        <p><small>* assignedTo - operatorning username'i</small></p>
        <p><small>* personType - "yuridik" yoki "jismoniy" bo'lishi kerak</small></p>
        <p><small>* status - majburiy emas, kiritilmasa "yangi" bo'ladi</small></p>
        <a href="#" className="download-template">Namuna faylni yuklab olish</a>
      </div>
    </div>
  );
}

export default ExcelImport;
