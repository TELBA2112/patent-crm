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
 * MKTU sinflarini serverga saqlash - with robust endpoint handling
 * @param {string} jobId - Job ID
 * @param {Array} classes - MKTU sinflari massivi
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Muvaffaqiyatli saqlangan yoki yo'q
 */
export const saveJobMktuClasses = async (jobId, classes, token) => {
  if (!jobId || !token) {
    console.error('Required parameters missing');
    return false;
  }

  try {
    // Normalize classes to integers
    const normalizedClasses = classes
      .map(cls => parseInt(cls))
      .filter(cls => !isNaN(cls) && cls >= 1 && cls <= 45);
    
    if (normalizedClasses.length === 0) {
      console.error('No valid MKTU classes provided');
      return false;
    }
    
    // First try with job-actions endpoint
    try {
      console.log(`Trying job-actions endpoint to save MKTU classes for job ${jobId}`);
      const res = await fetch(`http://localhost:5000/api/job-actions/${jobId}/update-mktu-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ classes: normalizedClasses })
      });
      
      if (res.ok) {
        console.log('Successfully saved MKTU classes via job-actions endpoint');
        return true;
      }
      
      console.warn('job-actions endpoint failed, trying fallback...');
    } catch (error) {
      console.warn('Error with job-actions endpoint, trying fallback...', error);
    }
    
    // Try with jobs endpoint as fallback
    console.log(`Trying jobs endpoint as fallback to save MKTU classes for job ${jobId}`);
    const fallbackRes = await fetch(`http://localhost:5000/api/jobs/${jobId}/update-mktu-classes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ classes: normalizedClasses })
    });
    
    if (fallbackRes.ok) {
      console.log('Successfully saved MKTU classes via jobs endpoint');
      return true;
    }
    
    const errorText = await fallbackRes.text();
    throw new Error(`Failed to save MKTU classes: ${errorText}`);
  } catch (error) {
    console.error('Error saving MKTU classes:', error);
    return false;
  }
};
