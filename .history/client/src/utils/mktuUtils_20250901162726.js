/**
 * MKTU sinflarini boshqarish uchun funksiyalar
 */

import { getStoredMktuClasses } from './mktuData';

/**
 * Serverdan job uchun MKTU sinflarini olish
 * @param {string} jobId - Job ID
 * @param {string} token - JWT token
 * @returns {Promise<number[]>} - MKTU sinflari massivi
 */
export const fetchJobMktuClasses = async (jobId, token) => {
  try {
    const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/mktu-classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch MKTU classes');
    }
    
    const data = await res.json();
    console.log('Fetched MKTU classes from server:', data);
    
    if (data.classes && Array.isArray(data.classes)) {
      // Normalize classes to integers
      return data.classes.map(cls => parseInt(cls)).filter(cls => !isNaN(cls));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching MKTU classes:', error);
    // Fall back to local storage
    return getStoredMktuClasses();
  }
};

/**
 * MKTU sinflarini serverga saqlash
 * @param {string} jobId - Job ID
 * @param {Array} classes - MKTU sinflari massivi
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Muvaffaqiyatli saqlangan yoki yo'q
 */
export const saveJobMktuClasses = async (jobId, classes, token) => {
  try {
    // Normalize classes to integers
    const normalizedClasses = classes
      .map(cls => parseInt(cls))
      .filter(cls => !isNaN(cls));
    
    if (normalizedClasses.length === 0) {
      throw new Error('No valid MKTU classes provided');
    }
    
    const res = await fetch(`http://localhost:5000/api/job-actions/${jobId}/update-mktu-classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ classes: normalizedClasses })
    });
    
    if (!res.ok) {
      throw new Error('Failed to save MKTU classes');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving MKTU classes:', error);
    return false;
  }
};
