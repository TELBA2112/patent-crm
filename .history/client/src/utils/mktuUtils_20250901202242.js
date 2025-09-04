/**
 * This file is kept as a placeholder but MKTU functionality has been removed.
 */

// Placeholder function to prevent import errors
export const saveJobMktuClasses = async () => {
  console.warn('MKTU functionality has been removed');
  return false;
};
    console.error('saveJobMktuClasses: Invalid arguments provided.');
    return false;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/mktu-classes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ classes }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Failed to save MKTU classes:', errorData.message);
      return false;
    }

    console.log('MKTU classes saved successfully for job:', jobId);
    return true;
  } catch (error) {
    console.error('Error in saveJobMktuClasses:', error.message);
    return false;
  }
};
