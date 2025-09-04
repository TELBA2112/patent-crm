const sendForReview = async (id) => {
  const brandName = (brandById[id] || '').trim();
  if (!brandName) {
    alert('Brend nomini kiriting');
    return;
  }

  try {
    await api(`/api/jobs/${id}/send-for-review`, {
      method: 'POST',
      body: JSON.stringify({ brandName })
    });
    alert('Brend tekshiruvchiga yuborildi');
    setBrandById(prev => ({ ...prev, [id]: '' }));
    fetchJobs();
  } catch (e) {
    alert('Xato: ' + e.message);
  }
};
