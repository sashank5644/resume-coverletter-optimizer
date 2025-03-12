const Resume = require('../models/Resume');

exports.getResumes = async (req, res) => {
  try {
    console.log('Fetching resumes for user:', req.user.id); // Debug log
    const resumes = await Resume.find({ user: req.user.id });
    console.log('Resumes fetched:', resumes); // Debug log
    res.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error.message, error.stack); // Detailed error log
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
};

exports.getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
};

exports.createResume = async (req, res) => {
  const { title, content, skills, education, experience } = req.body;

  try {
    const resume = new Resume({
      title,
      content,
      skills,
      education,
      experience,
      user: req.user.id
    });
    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    console.error('Error creating resume:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create resume' });
  }
};

exports.updateResume = async (req, res) => {
  const { title, content, skills, education, experience } = req.body;

  try {
    let resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    resume = await Resume.findByIdAndUpdate(
      req.params.id,
      { title, content, skills, education, experience, lastUpdated: Date.now() },
      { new: true }
    );
    res.json(resume);
  } catch (error) {
    console.error('Error updating resume:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update resume' });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Resume deleted' });
  } catch (error) {
    console.error('Error deleting resume:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
};

exports.getResumeCount = async (req, res) => {
  try {
    console.log('Fetching resume count for user:', req.user.id); // Debug log
    const count = await Resume.countDocuments({ user: req.user.id });
    console.log('Resume count:', count); // Debug log
    res.json({ count });
  } catch (error) {
    console.error('Error fetching resume count:', error.message, error.stack); // Detailed error log
    res.status(500).json({ error: 'Failed to fetch resume count' });
  }
};