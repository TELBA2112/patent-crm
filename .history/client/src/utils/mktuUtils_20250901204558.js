// MKTU yordamchi funksiyalari olib tashlandi.
export {};
 * @param {string} jobId - The ID of the job to update.
 * @param {number[]} classes - An array of MKTU class numbers.
 * @param {string} token - The authentication token.
 * @returns {Promise<boolean>} - True if successful, false otherwise.
 */
export const saveJobMktuClasses = async (jobId, classes, token) => {
  if (!jobId || !Array.isArray(classes) || !token) {
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
