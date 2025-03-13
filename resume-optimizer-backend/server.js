const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Import the cors package
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'resume-coverletter-optimizer.vercel.app'], // Update with your actual Vercel URL
  credentials: true,
})); // Enable CORS for all routes

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Google Generative AI with GEMINI_API_KEY2
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY2);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/users', require('./routes/users'));

// New endpoint to extract job details
app.post('/api/extract-job-details', async (req, res) => {
  const { content } = req.body;
  //console.log('Job description!', {content});
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
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

    const result = await model.generateContent(prompt);
    const extractedText = result.response.text();

    // Improved parsing with regex to handle multi-line sections
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
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to extract job details' });
  }
});

function extractSection(text, sectionHeader) {
  // Create a regex pattern that captures everything until the next section header or end of text
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