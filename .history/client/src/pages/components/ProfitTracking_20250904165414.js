import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../utils/api';
import './ProfitTracking.css';

function ProfitTracking() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0], // Today
    type: 'all' // 'income', 'expense', 'all'
  });

  // Fetch profit summary data
  const fetchProfitSummary = useCallback(async () => {
    setLoading(true);
    try {
      // Get the date range from the filter
      const params = new URLSearchParams({
        startDate: filter.startDate,
        endDate: filter.endDate
      });
      
      const res = await apiFetch(`/api/financial/summary?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Moliyaviy ma\'lumotlarni olishda xatolik');
      }
      
      const data = await res.json();
      setSummary(data);
      
      // Also fetch individual transactions
      await fetchTransactions();
    } catch (err) {
      console.error('Moliyaviy ma\'lumotlarni olishda xatolik:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Fetch transactions based on filter
  const fetchTransactions = useCallback(async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        startDate: filter.startDate,
        endDate: filter.endDate
      });
      
      if (filter.type !== 'all') {
        params.append('type', filter.type);
      }
      
      const res = await apiFetch(`/api/financial/transactions?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Tranzaksiyalarni olishda xatolik');
      }
      
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Tranzaksiyalarni olishda xatolik:', err);
      setError(err.message);
    }
  }, [filter]);

  // Load data when filter changes
  useEffect(() => {
    fetchProfitSummary();
  }, [fetchProfitSummary]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filter
  const applyFilter = (e) => {
    e.preventDefault();
    fetchProfitSummary();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', {
      style: 'currency',
      currency: 'UZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate profit margin percentage
  const calculateProfitMargin = () => {
    if (!summary || summary.totalIncome === 0) return 0;
    return ((summary.profit / summary.totalIncome) * 100).toFixed(1);
  };

  return (
    <div className="profit-tracking-container">
      <h2>📊 Moliyaviy hisobot</h2>

      <div className="filter-container">
        <form onSubmit={applyFilter}>
          <div className="filter-controls">
            <div className="filter-field">
              <label>Boshlang'ich sana:</label>
              <input 
                type="date"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-field">
              <label>Tugash sanasi:</label>
              <input 
                type="date"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
                max={new Date().toISOString().split('T')[0]} // Can't select future dates
              />
            </div>
            <div className="filter-field">
              <label>Turi:</label>
              <select name="type" value={filter.type} onChange={handleFilterChange}>
                <option value="all">Hammasi</option>
                <option value="income">Kirim</option>
                <option value="expense">Chiqim</option>
              </select>
            </div>
            <button type="submit" className="apply-filter-btn">Qo'llash</button>
          </div>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Yuklanmoqda...</div>
      ) : (
        <>
          {summary && (
            <div className="summary-cards">
              <div className="summary-card income">
                <h3>Kirimlar</h3>
                <div className="amount">{formatCurrency(summary.totalIncome)}</div>
                <div className="details">
                  {summary.incomeBreakdown.map((item, index) => (
                    <div className="breakdown-item" key={index}>
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-card expenses">
                <h3>Chiqimlar</h3>
                <div className="amount">{formatCurrency(summary.totalExpenses)}</div>
                <div className="details">
                  {summary.expenseBreakdown.map((item, index) => (
                    <div className="breakdown-item" key={index}>
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summary-card profit">
                <h3>Foyda</h3>
                <div className="amount">{formatCurrency(summary.profit)}</div>
                <div className="profit-margin">
                  Rentabellik: {calculateProfitMargin()}%
                </div>
              </div>
            </div>
          )}

          <div className="transactions-section">
            <h3>Tranzaksiyalar</h3>
            
            {transactions.length === 0 ? (
              <p className="no-data">Bu davr uchun tranzaksiyalar mavjud emas</p>
            ) : (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Tavsif</th>
                    <th>Summa</th>
                    <th>Turi</th>
                    <th>Ishga bog'langan</th>
                    <th>Kategoriya</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr 
                      key={transaction._id} 
                      className={transaction.type === 'income' ? 'income-row' : 'expense-row'}
                    >
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.description}</td>
                      <td className="amount-cell">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? 'Kirim' : 'Chiqim'}
                        </span>
                      </td>
                      <td>
                        {transaction.jobId ? (
                          <a href={`#job-${transaction.jobId}`}>#{transaction.jobId}</a>
                        ) : '—'}
                      </td>
                      <td>{transaction.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="chart-section">
            <h3>Grafik ko'rinish</h3>
            <div className="chart-placeholder">
              <p>Bu yerda ma'lumotlar grafigi bo'ladi</p>
              <p>Keyingi yangilanishda qo'shiladi</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfitTracking;
