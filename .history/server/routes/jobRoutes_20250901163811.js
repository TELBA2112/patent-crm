const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');

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

// Get MKTU classes for a job
router.get('/:id/mktu-classes', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Return the MKTU classes
    res.json({ classes: job.classes || [] });
  } catch (err) {
    console.error('Error getting MKTU classes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update MKTU classes for a job
router.post('/:id/mktu-classes', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Update the MKTU classes
    if (req.body.classes && Array.isArray(req.body.classes)) {
      job.classes = req.body.classes;
      
      // Add to history
      job.history.push({
        status: 'mktu_classes_updated',
        date: new Date(),
        userId: req.user.id
      });
      
      await job.save();
      
      return res.json({ 
        success: true, 
        message: 'MKTU classes updated successfully',
        classes: job.classes
      });
    } else {
      return res.status(400).json({ message: 'Invalid classes data' });
    }
  } catch (err) {
    console.error('Error updating MKTU classes:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
