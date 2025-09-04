import { apiFetch } from './api';
// MKTU yordamchi funksiyalari olib tashlandi.
export {};

export const saveJobMktuClasses = async (jobId, classes, token) => {
  if (!jobId || !Array.isArray(classes) || !token) {
    console.error('saveJobMktuClasses: Invalid arguments provided.');
    return false;
  }

  try {
    const res = await apiFetch(`/api/jobs/${jobId}/mktu-classes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
