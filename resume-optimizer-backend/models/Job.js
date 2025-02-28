// models/Job.js
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
    enum: ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
    default: 'Applied'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  jobPostingUrl: {
    type: String
  },
  resume: {
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
  interviews: [{
    date: Date,
    type: {
      type: String,
      enum: ['Phone', 'Video', 'In-person']
    },
    notes: String
  }]
});

module.exports = mongoose.model('Job', jobSchema);