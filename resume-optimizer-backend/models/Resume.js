// models/Resume.js
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: String,
  content: {
    type: String,
    required: true
  },
  skills: [String],
  experience: [{
    position: String,  // Changed from title to position
    company: String,
    period: String,    // Changed from duration to period
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resume', resumeSchema);