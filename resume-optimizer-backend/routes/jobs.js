// routes/jobs.js
const express = require('express');
const router = express.Router();
const { Job } = require('../models');
const auth = require('../middleware/auth');
const axios = require('axios');
const cheerio = require('cheerio');

// Get all jobs for the logged in user
router.get('/', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id })
      .sort({ appliedDate: -1 });
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get job statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalApplications = await Job.countDocuments({ user: req.user.id });
    const interviews = await Job.countDocuments({ 
      user: req.user.id,
      status: 'Interview'
    });
    
    res.json({
      totalApplications,
      interviews
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent job applications
router.get('/recent', auth, async (req, res) => {
  try {
    const recentJobs = await Job.find({ user: req.user.id })
      .sort({ appliedDate: -1 })
      .limit(5);
    
    res.json(recentJobs);
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new job application
router.post('/', auth, async (req, res) => {
  try {
    const newJob = new Job({
      ...req.body,
      user: req.user.id
    });
    
    const job = await newJob.save();
    res.json(job);
  } catch (error) {
    console.error('Error creating job application:', error);
    res.status(500).json({ error: 'Failed to save job application' });
  }
});

// Extract and save job from URL
router.post('/extract', auth, async (req, res) => {
  try {
    const { jobUrl } = req.body;
    
    if (!jobUrl) {
      return res.status(400).json({ error: 'Job URL is required' });
    }
    
    // Check if URL is from a supported job site
    if (!jobUrl.includes('linkedin.com/jobs/') && 
        !jobUrl.includes('indeed.com/viewjob') && 
        !jobUrl.includes('indeed.com/job/')) {
      return res.status(400).json({ 
        error: 'URL must be from LinkedIn or Indeed job posting'
      });
    }
    
    // Extract job details
    const jobData = await extractJobFromUrl(jobUrl);
    
    // Create and save job entry
    const newJob = new Job({
      position: jobData.title || 'Unknown Position',
      company: jobData.company || 'Unknown Company',
      jobPostingUrl: jobUrl,
      status: 'Applied',
      notes: jobData.description,
      user: req.user.id
    });
    
    const savedJob = await newJob.save();
    res.json({
      message: 'Job extracted and saved successfully',
      job: savedJob
    });
    
  } catch (error) {
    console.error('Error extracting job:', error);
    res.status(500).json({ 
      error: 'Failed to extract job information',
      details: error.message
    });
  }
});

// Update a job application
router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!job) {
      return res.status(404).json({ error: 'Job application not found' });
    }
    
    res.json(job);
  } catch (error) {
    console.error('Job update error:', error);
    res.status(500).json({ error: 'Failed to update job application' });
  }
});

// Delete a job application
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job application not found' });
    }
    
    res.json({ message: 'Job application deleted successfully' });
  } catch (error) {
    console.error('Job deletion error:', error);
    res.status(500).json({ error: 'Failed to delete job application' });
  }
});

// Helper function to extract job details from URL
async function extractJobFromUrl(url) {
  try {
    // Set headers to mimic a browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    };
    
    // Fetch the job posting page
    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = cheerio.load(html);
    
    let description = '';
    let title = '';
    let company = '';
    
    // LinkedIn selectors
    if (url.includes('linkedin.com')) {
      description = $('.description__text').text() || 
                   $('.show-more-less-html__markup').text() || 
                   $('section[class*="description"]').text();
                   
      title = $('.top-card-layout__title').text() || 
              $('h1').first().text();
              
      company = $('.topcard__org-name-link').text() || 
                $('.company-name').text();
    }
    // Indeed selectors
    else if (url.includes('indeed.com')) {
      description = $('#jobDescriptionText').text() || 
                   $('.jobsearch-jobDescriptionText').text();
                   
      title = $('.jobsearch-JobInfoHeader-title').text() || 
              $('h1[class*="JobTitle"]').text() || 
              $('h1').first().text();
              
      company = $('[data-testid="inlineCompanyName"]').text() || 
                $('.company_location').find('.companyName').text();
    }
    
    // Clean up text
    description = description.trim();
    title = title.trim();
    company = company.trim();
    
    // If we couldn't extract specific fields, use generic approach
    if (!description) {
      // Look for large blocks of text that might be the description
      $('div, section, article').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 500) { // Assume job descriptions are substantial
          description = text;
          return false; // Break the loop
        }
      });
    }
    
    // Fallback for title - often in page title
    if (!title) {
      title = $('title').text().split('-')[0].trim();
    }
    
    return {
      description,
      title,
      company
    };
  } catch (error) {
    console.error('Error extracting job data:', error);
    throw new Error('Failed to extract job information');
  }
}

module.exports = router;