const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { optimizeResume, generateCoverLetter } = require('../controllers/aiController');

router.post('/optimize-resume', auth, optimizeResume);
router.post('/generate-cover-letter', auth, generateCoverLetter);

module.exports = router;