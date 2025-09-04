/**
 * This is a simplified version of jobActions.js with only the essential functionality
 * Use this if the main file has issues
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Simplified JobActions router is working!' });
});

// POST /api/job-actions/:id/update-mktu-classes
router.post('/:id/update-mktu-classes', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { classes } = req.body;
    const userId = req.user.id;
    
    console.log('Updating MKTU classes:', { id, classes, userId });
    
    // Find the job
    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Update classes
    if (Array.isArray(classes)) {
      job.classes = classes.map(c => parseInt(c)).filter(c => !isNaN(c));
      await job.save();
      
      return res.json({
        success: true,
        message: 'MKTU classes updated successfully',
        classes: job.classes
      });
    }
    
    res.status(400).json({ message: 'Classes must be an array' });
  } catch (err) {
    console.error('Error updating MKTU classes:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;
