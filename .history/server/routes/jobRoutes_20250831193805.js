// Add this route to your existing job routes

// Save power of attorney
router.post('/:id/power-of-attorney', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Save power of attorney data
    job.powerOfAttorney = {
      content: req.body.content,
      personType: req.body.personType,
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    // Update classes if provided
    if (req.body.classes && Array.isArray(req.body.classes)) {
      job.classes = req.body.classes;
    }
    
    // Add to history
    job.history.push({
      status: 'power_of_attorney_created',
      date: new Date(),
      userId: req.user.id
    });
    
    await job.save();
    
    res.json({ success: true, message: 'Power of attorney saved successfully' });
  } catch (err) {
    console.error('Error saving power of attorney:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
