const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getJobs, getJobById, createJob, updateJob, deleteJob, getJobStats, getRecentJobs } = require('../controllers/jobController');

router.get('/stats', auth, (req, res) => {
  console.log('GET /api/jobs/stats'); // Debug log
  getJobStats(req, res);
});

router.get('/recent', auth, (req, res) => {
  console.log('GET /api/jobs/recent'); // Debug log
  getRecentJobs(req, res);
});

router.get('/', auth, (req, res) => {
  console.log('GET /api/jobs'); // Debug log
  getJobs(req, res);
});

router.get('/:id', auth, (req, res) => {
  console.log('GET /api/jobs/:id', req.params.id); // Debug log
  getJobById(req, res);
});

router.post('/', auth, (req, res) => {
  console.log('POST /api/jobs'); // Debug log
  createJob(req, res);
});

router.put('/:id', auth, (req, res) => {
  console.log('PUT /api/jobs/:id', req.params.id); // Debug log
  updateJob(req, res);
});

router.delete('/:id', auth, (req, res) => {
  console.log('DELETE /api/jobs/:id', req.params.id); // Debug log
  deleteJob(req, res);
});

module.exports = router;