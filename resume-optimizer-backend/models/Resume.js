const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  projects: [{
    name: String,
    date: String,
    description: String
  }],
  skills: [String],
  experience: [{
    position: String,
    company: String,
    period: String,
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