const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { extractResume } = require('./llm/resumeExtractor'); // Import the resume extractor

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '5mb' })); // Increase payload limit to 5MB
app.use(cors({
  origin: ['http://localhost:5173', 'https://resume-coverletter-optimizer.vercel.app', 'chrome-extension://abjngobpaipoobeokcgfnjeccmcggcic'],
  credentials: true,
})); // Enable CORS for all routes

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/users', require('./routes/users'));

// Endpoint to extract job details
app.post('/api/extract-job-details', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const maxSafeContentLength = 5000;
  if (content.length > maxSafeContentLength) {
    return res.status(413).json({ 
      error: `Payload too large. Content exceeds ${maxSafeContentLength} characters. Please reduce the size.` 
    });
  }

  try {
    const prompt = `
    You are an AI assistant that extracts and structures job postings into a well-formatted summary. 
    The content may contain multiple job listings or extraneous information. Focus on extracting details for the main job posting.
    Look for sections that describe company mission, qualifications, and application instructions to identify the core job listing.
    
    Extract and organize the information into this EXACT format with these EXACT section headers:
    
    **Position:**  
    [Job Title]  
    
    **Company:**  
    [Company Name]  
    
    **Location:**  
    [City, State (On-site/Hybrid/Remote)]  
    
    **Job Description:**  
    [Brief summary of the role, responsibilities, and company mission]  
    
    **Qualifications:**  
    - [List job requirements and qualifications]  
    
    **Salary (if available):**  
    [Salary Range or "Not specified"]  
    
    **Job Type (if available):**  
    [Full-time/Part-time/Internship/Contract]  
    
    **Duration (if available):**  
    [Contract length or "Not specified"]  
    
    **Date (if available):**  
    [Posting date or application deadline]  
    
    Only extract information that's clearly specified in the content. If certain information isn't available, write "Not specified" for that field.
    Do not add any commentary or additional text outside of these exact section headers and their corresponding content.
    
    Content:
    ${content}
    `;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY2);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(prompt);
    const extractedText = result.response.text();

    const parsed = {
      position: extractSection(extractedText, "Position:"),
      company: extractSection(extractedText, "Company:"),
      location: extractSection(extractedText, "Location:"),
      jobDescription: extractSection(extractedText, "Job Description:"),
      qualifications: extractSection(extractedText, "Qualifications:"),
      salary: extractSection(extractedText, "Salary \\(if available\\):"),
      jobType: extractSection(extractedText, "Job Type \\(if available\\):"),
      duration: extractSection(extractedText, "Duration \\(if available\\):"),
      date: extractSection(extractedText, "Date \\(if available\\):")
    };

    res.json(parsed);
  } catch (error) {
    console.error('Gemini API error in extract-job-details:', error);
    res.status(500).json({ error: 'Failed to extract job details' });
  }
});

// New endpoint to extract and parse a resume
app.post('/api/extract-resume', async (req, res) => {
  const { file, text } = req.body;

  if (!file && !text) {
    return res.status(400).json({ error: 'Please provide a PDF file or resume text.' });
  }

  try {
    const parsedData = await extractResume(file, text);
    res.json(parsedData);
  } catch (err) {
    console.error('Error in /api/extract-resume:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function extractSection(text, sectionHeader) {
  const pattern = new RegExp(`\\*\\*${sectionHeader}\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*\\w+:|$)`, 'i');
  const match = text.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim() || "Not specified";
  }
  return "Not specified";
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});