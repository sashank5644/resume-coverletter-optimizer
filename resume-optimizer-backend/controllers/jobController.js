const mongoose = require('mongoose');
const Job = require('../models/Job');

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id }).sort({ appliedDate: -1 });
    //console.log('Fetched jobs for user:', req.user.id, 'Count:', jobs.length);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    //console.log('Fetched job by ID:', job);
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

exports.createJob = async (req, res) => {
  const { position, company, location, status, appliedDate, jobDescription, notes, resumeUsed, contactInfo, url } = req.body;

  try {
    if (!position || !company || !appliedDate || !url) {
      return res.status(400).json({ error: 'Position, company, applied date, and URL are required' });
    }

    const job = new Job({
      position,
      company,
      location: location || '',
      status: status || 'Applied',
      appliedDate: new Date(appliedDate),
      jobDescription: jobDescription || '',
      notes: notes || '',
      resumeUsed: resumeUsed || null,
      contactInfo: contactInfo || { name: '', email: '' },
      url: url || '',
      user: req.user.id
    });
    await job.save();
    //console.log('Job saved successfully:', job);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job', details: error.message });
  }
};

exports.updateJob = async (req, res) => {
  const { position, company, location, status, appliedDate, jobDescription, notes, resumeUsed, contactInfo, url, interviews } = req.body;

  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    job.position = position || job.position;
    job.company = company || job.company;
    job.location = location || job.location || '';
    job.status = status || job.status;
    job.appliedDate = appliedDate ? new Date(appliedDate) : job.appliedDate;
    job.jobDescription = jobDescription || job.jobDescription || '';
    job.notes = notes || job.notes || '';
    job.resumeUsed = resumeUsed || job.resumeUsed || null;
    job.contactInfo = contactInfo || job.contactInfo || { name: '', email: '' };
    job.url = url || job.url || '';
    job.interviews = interviews || job.interviews || []; // Update interviews array

    await job.save();
    //console.log('Job updated successfully:', job);
    res.json(job);
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job', details: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Job.findByIdAndDelete(req.params.id);
    console.log('Job deleted:', req.params.id);
    res.json({ msg: 'Job deleted' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};

exports.getJobStats = async (req, res) => {
  try {
    const totalApplications = await Job.countDocuments({ user: req.user.id });
    const jobsWithInterviews = await Job.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $unwind: { path: '$interviews', preserveNullAndEmptyArrays: true } }, // Handle empty arrays
      { $match: { 'interviews': { $exists: true } } },
      { $group: { _id: null, totalInterviews: { $sum: 1 } } }
    ]);
    const interviews = jobsWithInterviews.length > 0 ? jobsWithInterviews[0].totalInterviews || 0 : 0;
    //console.log('Job stats for user:', req.user.id, { totalApplications, interviews });
    res.json({ totalApplications, interviews });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: 'Failed to fetch job stats' });
  }
};

exports.getRecentJobs = async (req, res) => {
  try {
    //console.log('Fetching recent jobs for user:', req.user.id);
    const recentJobs = await Job.find({ user: new mongoose.Types.ObjectId(req.user.id) })
      .sort({ appliedDate: -1 })
      .limit(5);
    //console.log('Recent jobs fetched:', recentJobs);
    res.json(recentJobs);
  } catch (error) {
    console.error('Error fetching recent jobs:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch recent jobs' });
  }
};