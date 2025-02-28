// routes/resumes.js
const express = require('express');
const router = express.Router();
const { Resume } = require('../models');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ lastUpdated: -1 });  // Sort by most recently updated
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    res.status(500).json({ error: 'Failed to load resumes' });
  }
});

router.get('/count', auth, async (req, res) => {
  try {
    const count = await Resume.countDocuments({ user: req.user.id });
    console.log('Count for user:', req.user.id, 'is:', count); // Add this for debugging
    res.json(count);
  } catch (error) {
    console.error('Error getting resume count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },  // Ensure user owns this resume
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    res.json(resume);
  } catch (error) {
    console.error('Resume update error:', error);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const newResume = new Resume({
      user: req.user.id,
      ...req.body
    });
    const resume = await newResume.save();
    res.json(resume);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    
    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Resume deletion error:', error);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

module.exports = router;