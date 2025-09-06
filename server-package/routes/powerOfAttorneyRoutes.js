const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Client = require('../models/Client'); // Assuming you have a Client model

// Get power of attorney data including JSHSHR
router.get('/:jobId', auth, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId).populate('client');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Get JSHSHR from client if available
    let jshshr = '';
    if (job.client && job.client.jshshr) {
      jshshr = job.client.jshshr;
    }
    
    res.json({
      jobId: job._id,
      clientName: job.clientName,
      clientSurname: job.clientSurname,
      brandName: job.brandName,
      personType: job.personType,
      classes: job.classes,
      jshshr: jshshrs
    });
  } catch (err) {
    console.error('Error fetching power of attorney data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
