const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getResumes, getResumeById, createResume, updateResume, deleteResume, getResumeCount } = require('../controllers/resumeController');

// Specific routes before wildcards
router.get('/count', auth, (req, res) => {
  //console.log('GET /api/resumes/count'); // Debug log
  getResumeCount(req, res);
});

router.get('/', auth, (req, res) => {
  //console.log('GET /api/resumes'); // Debug log
  getResumes(req, res);
});

// Wildcard route last
router.get('/:id', auth, (req, res) => {
  //console.log('GET /api/resumes/:id', req.params.id); // Debug log
  getResumeById(req, res);
});

router.post('/', auth, (req, res) => {
  //console.log('POST /api/resumes'); // Debug log
  createResume(req, res);
});

router.put('/:id', auth, (req, res) => {
  //console.log('PUT /api/resumes/:id', req.params.id); // Debug log
  updateResume(req, res);
});

router.delete('/:id', auth, (req, res) => {
  //console.log('DELETE /api/resumes/:id', req.params.id); // Debug log
  deleteResume(req, res);
});

module.exports = router;