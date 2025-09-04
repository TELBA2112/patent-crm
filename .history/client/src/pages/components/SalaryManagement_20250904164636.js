import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../utils/api';
import './SalaryManagement.css';

function SalaryManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryForm, setSalaryForm] = useState({
    userId: '',
    baseSalary: '',
    bonus: '0',
    deduction: '0',
    comment: ''
  });
  const [editingSalary, setEditingSalary] = useState(null);

  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const roles = ['operator', 'tekshiruvchi', 'yurist'];
      let allUsers = [];
      
      for (const role of roles) {
        const res = await apiFetch(`/api/users?role=${role}`);
        if (res.ok) {
          const users = await res.json();
          allUsers = [...allUsers, ...users];
        }
      }
      
      // Fetch salary information for the selected month and year
      const salariesRes = await apiFetch(`/api/salaries?month=${selectedMonth + 1}&year=${selectedYear}`);
      const salaryData = salariesRes.ok ? await salariesRes.json() : [];
      
      // Combine user data with salary data
      const enrichedUsers = allUsers.map(user => {
        const userSalary = salaryData.find(s => s.userId === user._id);
        return {
          ...user,
          salary: userSalary || null
        };
      });
      
      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Xodimlar ma\'lumotlarini olishda xatolik:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSalaryChange = (e) => {
    const { name, value } = e.target;
    setSalaryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitSalary = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        userId: salaryForm.userId,
        month: selectedMonth + 1,
        year: selectedYear,
        baseSalary: parseFloat(salaryForm.baseSalary),
        bonus: parseFloat(salaryForm.bonus) || 0,
        deduction: parseFloat(salaryForm.deduction) || 0,
        comment: salaryForm.comment
      };
      
      const url = editingSalary ? `/api/salaries/${editingSalary._id}` : '/api/salaries';
      const method = editingSalary ? 'PUT' : 'POST';
      
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error('Oylik ma\'lumotlarini saqlashda xatolik');
      }
      
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Oylik ma\'lumotlarini saqlashda xatolik:', error);
      alert('Oylik ma\'lumotlarini saqlashda xatolik: ' + error.message);
    }
  };

  const handleEditSalary = (user) => {
    setEditingSalary(user.salary);
    setSalaryForm({
      userId: user._id,
      baseSalary: user.salary?.baseSalary || '',
      bonus: user.salary?.bonus || '0',
      deduction: user.salary?.deduction || '0',
      comment: user.salary?.comment || ''
    });
  };

  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm('Oylik ma\'lumotlarini o\'chirishga ishonchingiz komilmi?')) return;
    
    try {
      const res = await apiFetch(`/api/salaries/${salaryId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Oylik ma\'lumotlarini o\'chirishda xatolik');
      }
      
      fetchUsers();
    } catch (error) {
      console.error('Oylik ma\'lumotlarini o\'chirishda xatolik:', error);
      alert('Oylik ma\'lumotlarini o\'chirishda xatolik: ' + error.message);
    }
  };

  const resetForm = () => {
    setEditingSalary(null);
    setSalaryForm({
      userId: '',
      baseSalary: '',
      bonus: '0',
      deduction: '0',
      comment: ''
    });
  };

  const calculateTotalSalary = (user) => {
    if (!user.salary) return 0;
    
    const baseSalary = parseFloat(user.salary.baseSalary) || 0;
    const bonus = parseFloat(user.salary.bonus) || 0;
    const deduction = parseFloat(user.salary.deduction) || 0;
    
    return baseSalary + bonus - deduction;
  };

  return (
    <div className="salary-management-container">
      <h2>💵 Xodimlar oylik boshqaruvi</h2>
      
      <div className="date-selector">
        <div className="date-filter">
          <label>Oy:</label>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          
          <label>Yil:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      <form onSubmit={handleSubmitSalary} className="salary-form">
        <h3>{editingSalary ? '🔄 Oylik ma\'lumotini tahrirlash' : '➕ Yangi oylik ma\'lumoti qo\'shish'}</h3>
        
        <div className="form-group">
          <label>Xodim:</label>
          <select 
            name="userId" 
            value={salaryForm.userId}
            onChange={handleSalaryChange}
            required
          >
            <option value="">Xodimni tanlang</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.username}) - {user.role === 'operator' ? 'Operator' : 
                  user.role === 'tekshiruvchi' ? 'Tekshiruvchi' : 
                  user.role === 'yurist' ? 'Yurist' : user.role}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Asosiy oylik (so'm):</label>
          <input 
            type="number"
            name="baseSalary"
            value={salaryForm.baseSalary}
            onChange={handleSalaryChange}
            required
            placeholder="Miqdorni kiriting"
          />
        </div>
        
        <div className="form-group">
          <label>Bonus (so'm):</label>
          <input 
            type="number"
            name="bonus"
            value={salaryForm.bonus}
            onChange={handleSalaryChange}
            placeholder="0"
          />
        </div>
        
        <div className="form-group">
          <label>Ushlab qolish (so'm):</label>
          <input 
            type="number"
            name="deduction"
            value={salaryForm.deduction}
            onChange={handleSalaryChange}
            placeholder="0"
          />
        </div>
        
        <div className="form-group">
          <label>Izoh:</label>
          <textarea 
            name="comment"
            value={salaryForm.comment}
            onChange={handleSalaryChange}
            placeholder="Izoh kiriting (ixtiyoriy)"
          ></textarea>
        </div>
        
        <div className="form-actions">
          <button type="submit">{editingSalary ? 'Saqlash' : 'Qo\'shish'}</button>
          {editingSalary && (
            <button type="button" onClick={resetForm} className="cancel-button">
              Bekor qilish
            </button>
          )}
        </div>
      </form>
      
      <div className="salary-table-container">
        <h3>Xodimlar oyliklari - {monthNames[selectedMonth]} {selectedYear}</h3>
        
        {loading ? (
          <p>Yuklanmoqda...</p>
        ) : users.length === 0 ? (
          <p>Xodimlar topilmadi.</p>
        ) : (
          <table className="salary-table">
            <thead>
              <tr>
                <th>Xodim</th>
                <th>Lavozim</th>
                <th>Asosiy oylik</th>
                <th>Bonus</th>
                <th>Ushlab qolish</th>
                <th>Jami</th>
                <th>Izoh</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>
                    {user.role === 'operator' ? 'Operator' : 
                     user.role === 'tekshiruvchi' ? 'Tekshiruvchi' : 
                     user.role === 'yurist' ? 'Yurist' : user.role}
                  </td>
                  <td>{user.salary?.baseSalary ? `${user.salary.baseSalary} so'm` : '-'}</td>
                  <td>{user.salary?.bonus ? `${user.salary.bonus} so'm` : '-'}</td>
                  <td>{user.salary?.deduction ? `${user.salary.deduction} so'm` : '-'}</td>
                  <td className="total-salary">
                    {user.salary ? `${calculateTotalSalary(user)} so'm` : '-'}
                  </td>
                  <td className="comment-cell">{user.salary?.comment || '-'}</td>
                  <td>
                    {user.salary ? (
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEditSalary(user)}
                          className="edit-button"
                        >
                          ✏️ Tahrirlash
                        </button>
                        <button 
                          onClick={() => handleDeleteSalary(user.salary._id)}
                          className="delete-button"
                        >
                          🗑️ O'chirish
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setSalaryForm(prev => ({ ...prev, userId: user._id }));
                        }}
                        className="add-button"
                      >
                        ➕ Qo'shish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default SalaryManagement;
