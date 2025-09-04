import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../utils/api';
import './WithdrawalRequest.css';

const WithdrawalRequest = ({ userId, onRequestSubmitted }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardHolder: '',
    bankName: ''
  });
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  // Fetch user's cards
  useEffect(() => {
    const fetchCards = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/payouts/cards/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch cards');
        }
        
        const data = await response.json();
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId(data[0]._id);
        }
      } catch (err) {
        setError('Error loading cards: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [userId]);

  // Handle withdrawal request submission
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!amount || !selectedCardId || amount <= 0) {
      setError('Please enter a valid amount and select a card');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/payouts/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          cardId: selectedCardId,
          amount: parseFloat(amount),
          mood
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }

      // Reset form
      setAmount('');
      setMood('neutral');
      
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err) {
      setError('Error submitting request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new card
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.cardNumber || !newCard.cardHolder || !newCard.bankName) {
      setError('Please fill all card fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/payouts/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          cardNumber: newCard.cardNumber,
          cardHolder: newCard.cardHolder,
          bankName: newCard.bankName
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add card');
      }

      const addedCard = await response.json();
      
      // Update cards list and select the new card
      setCards([...cards, addedCard]);
      setSelectedCardId(addedCard._id);
      
      // Reset form
      setNewCard({
        cardNumber: '',
        cardHolder: '',
        bankName: ''
      });
      setShowAddCardForm(false);
    } catch (err) {
      setError('Error adding card: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a card
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/payouts/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      // Update cards list
      setCards(cards.filter(card => card._id !== cardId));
      
      // If the deleted card was selected, select another one if available
      if (selectedCardId === cardId) {
        const remainingCards = cards.filter(card => card._id !== cardId);
        if (remainingCards.length > 0) {
          setSelectedCardId(remainingCards[0]._id);
        } else {
          setSelectedCardId('');
        }
      }
    } catch (err) {
      setError('Error deleting card: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdrawal-request-container">
      <h3>To'lov so'rovini yuborish</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="mood-selector">
        <p>Kayfiyatingizni tanlang:</p>
        <div className="mood-options">
          <button 
            type="button" 
            className={`mood-button ${mood === 'happy' ? 'selected' : ''}`}
            onClick={() => setMood('happy')}
          >
            😃 Juda yaxshi
          </button>
          <button 
            type="button" 
            className={`mood-button ${mood === 'neutral' ? 'selected' : ''}`}
            onClick={() => setMood('neutral')}
          >
            😐 Normal
          </button>
          <button 
            type="button" 
            className={`mood-button ${mood === 'sad' ? 'selected' : ''}`}
            onClick={() => setMood('sad')}
          >
            😔 Yomon
          </button>
        </div>
      </div>

      {cards.length > 0 ? (
        <div className="cards-container">
          <h4>Kartangizni tanlang:</h4>
          <div className="cards-list">
            {cards.map(card => (
              <div 
                key={card._id} 
                className={`card-item ${selectedCardId === card._id ? 'selected' : ''}`}
                onClick={() => setSelectedCardId(card._id)}
              >
                <div className="card-details">
                  <p className="card-number">{card.cardNumber}</p>
                  <p className="card-holder">{card.cardHolder}</p>
                  <p className="bank-name">{card.bankName}</p>
                </div>
                <button 
                  type="button" 
                  className="delete-card-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(card._id);
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : !loading && (
        <p>Kartalar topilmadi. Yangi karta qo'shing.</p>
      )}

      {!showAddCardForm ? (
        <button 
          type="button" 
          className="add-card-btn"
          onClick={() => setShowAddCardForm(true)}
        >
          + Yangi karta qo'shish
        </button>
      ) : (
        <form className="add-card-form" onSubmit={handleAddCard}>
          <div className="form-group">
            <label>Karta raqami:</label>
            <input 
              type="text" 
              value={newCard.cardNumber}
              onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
              placeholder="8600 1234 5678 9012"
              required
            />
          </div>
          <div className="form-group">
            <label>Karta egasi:</label>
            <input 
              type="text" 
              value={newCard.cardHolder}
              onChange={(e) => setNewCard({...newCard, cardHolder: e.target.value})}
              placeholder="IVANOV IVAN"
              required
            />
          </div>
          <div className="form-group">
            <label>Bank nomi:</label>
            <input 
              type="text" 
              value={newCard.bankName}
              onChange={(e) => setNewCard({...newCard, bankName: e.target.value})}
              placeholder="UzCard/Humo"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Yuklanmoqda...' : 'Saqlash'}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setShowAddCardForm(false)}
            >
              Bekor qilish
            </button>
          </div>
        </form>
      )}

      {cards.length > 0 && (
        <form className="withdrawal-form" onSubmit={handleSubmitRequest}>
          <div className="form-group">
            <label>Summa (UZS):</label>
            <input 
              type="number"
              min="1"
              step="1000" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
              required
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading || !selectedCardId}>
            {loading ? 'Yuklanmoqda...' : 'So\'rov yuborish'}
          </button>
        </form>
      )}
    </div>
  );
};

export default WithdrawalRequest;
