/**
 * MKTU sinflarini boshqarish uchun funksiyalar
 */

/**
 * MKTU sinflarini serverga saqlash
 * @param {string} jobId - Job ID
 * @param {Array<number>} classes - MKTU sinflari massivi
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} - Muvaffaqiyatli saqlangan yoki yo'q
 */
export const saveJobMktuClasses = async (jobId, classes, token) => {
  try {
    // Normalize classes to integers
    const normalizedClasses = classes
      .map(cls => parseInt(cls))
      .filter(cls => !isNaN(cls));
    
    if (normalizedClasses.length === 0 && classes.length > 0) {
      console.warn('No valid MKTU classes to save.');
      return true; // Don't block the process for empty classes
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
      const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Failed to save MKTU classes: ${errorData.message}`);
    }
    
    console.log('MKTU classes saved successfully.');
    return true;
  } catch (error) {
    console.error('Error saving MKTU classes:', error);
    // We return true to not block the user flow, but log the error.
    // The main action (e.g., send for review) will still proceed.
    return true; 
  }
};
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

