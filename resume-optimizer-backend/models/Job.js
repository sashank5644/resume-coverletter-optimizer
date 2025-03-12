const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  position: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  status: {
    type: String,
    enum: ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
    default: 'Applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  jobDescription: {
    type: String
  },
  url: {
    type: String
  },
  resumeUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  },
  contactInfo: {
    name: String,
    email: String
  },
  interviews: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['Phone', 'Video', 'In-person']
    },
    notes: String
  }]
});

module.exports = mongoose.model('Job', jobSchema);