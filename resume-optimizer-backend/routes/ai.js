const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const axios = require('axios');

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'deepseek-r1:1.5b';
const REQUEST_TIMEOUT = 30000;

// Enhanced response parser with better error handling
const parseOllamaResponse = (responseText) => {
  try {
    const lines = responseText.trim().split('\n');
    let accumulatedResponse = '';
    let skills = [];
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          accumulatedResponse += parsed.response;
          // Try to extract skills if response contains JSON
          if (parsed.response.includes('"skills"')) {
            const match = parsed.response.match(/"skills":\s*\[(.*?)\]/);
            if (match) {
              skills = JSON.parse(`[${match[1]}]`);
            }
          }
        }
      } catch (e) {
        // Continue processing even if one line fails
        continue;
      }
    }

    return {
      content: accumulatedResponse.trim(),
      skills: skills
    };
  } catch (error) {
    console.error('Response parsing error:', error);
    throw new Error('Failed to parse AI response');
  }
};

// Health check with detailed status using tags endpoint
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 5000
    });
    
    // Check if our required model is available
    const models = response.data.models || [];
    const modelAvailable = models.some(m => m.name.startsWith(MODEL_NAME));
    
    res.json({
      status: 'ok',
      model: MODEL_NAME,
      modelAvailable,
      availableModels: models.map(m => m.name)
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      error: 'AI service unavailable',
      details: err.message
    });
  }
});

// Main optimization endpoint
router.post('/optimize-resume', auth, async (req, res) => {
  try {
    const { resumeContent, resumeSkills, jobDescription } = req.body;

    // Enhanced input validation
    if (!resumeContent?.trim()) {
      return res.status(400).json({
        error: 'Invalid resume content',
        details: 'Resume content is required and cannot be empty'
      });
    }

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        error: 'Invalid job description',
        details: 'Job description is required and cannot be empty'
      });
    }

    // Verify service availability before main request using tags endpoint
    await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });

    // Structured prompt with clear instructions
    const prompt = `
    Task: Analyze and optimize the provided resume for the target job description.
    You are an AI assistant that optimizes resumes based on a job description. 
    Enhance the candidate's resume by aligning it with the required skills, experience, and responsibilities.
    Make it concise, professional, and ATS-friendly.
    
    Guidelines:
    1. Maintain professional language and format
    2. Highlight relevant skills and experience
    3. Suggest specific improvements
    4. Keep original information accurate
    
    Resume Content:
    ${resumeContent}

    Current Skills:
    ${resumeSkills || 'No skills provided'}

    Job Description:
    ${jobDescription}

    Provide response in the following format:
    {
      "content": "side by side optimized resume content with improvements and previous content",
      "skills": ["relevant skill 1", "relevant skill 2"]
    }
    `;

    // Main API call with enhanced error handling
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt,
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.1
    }, {
      timeout: REQUEST_TIMEOUT,
      responseType: 'text'
    });

    const parsedResponse = parseOllamaResponse(response.data);

    // Validate response content
    if (!parsedResponse.content || parsedResponse.content.length < 50) {
      throw new Error('AI response too short or invalid');
    }

    res.json({
      content: parsedResponse.content,
      skills: parsedResponse.skills,
      message: 'Resume successfully optimized'
    });

  } catch (error) {
    console.error('Resume optimization error:', error);

    // Enhanced error handling with specific status codes
    const errorResponse = {
      error: 'Resume optimization failed',
      details: error.message
    };

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      return res.status(503).json({
        ...errorResponse,
        error: 'AI service unavailable',
        details: 'Could not connect to the AI service. Please try again later.'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        ...errorResponse,
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please wait a moment and try again.'
      });
    }

    if (error.response?.status === 413) {
      return res.status(413).json({
        ...errorResponse,
        error: 'Content too large',
        details: 'The resume or job description is too long. Please reduce the content size.'
      });
    }

    res.status(500).json(errorResponse);
  }
});

// Cover letter generation endpoint
router.post('/generate-cover-letter', auth, async (req, res) => {
  try {
    const { 
      position, 
      company, 
      jobDescription,
      resumeContent,
      userName = 'Job Applicant' // Default name if not provided
    } = req.body;

    // Input validation
    if (!position?.trim() || !company?.trim()) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Position and company are required'
      });
    }

    // Verify service availability before main request
    await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });

    // Create structured prompt for cover letter generation
    const prompt = `
    Task: Generate a professional cover letter for a job application.
    
    Guidelines:
    1. Create a concise, professional cover letter
    2. Highlight relevant skills and experience that match the job description
    3. Use a formal but engaging tone
    4. Include standard cover letter sections (greeting, introduction, body, conclusion, signature)
    5. Keep it to less than 500 words
    
    Job Details:
    Position: ${position}
    Company: ${company}
    Job Description: ${jobDescription || 'Not provided'}
    
    Resume Content:
    ${resumeContent || 'Not provided'}
    
    Applicant Name: ${userName}
    
    Create a complete, ready-to-use cover letter.
    `;

    // API call with error handling
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL_NAME,
      prompt,
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.1
    }, {
      timeout: REQUEST_TIMEOUT,
      responseType: 'text'
    });

    let content = '';
    const lines = response.data.trim().split('\n');
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          content += parsed.response;
        }
      } catch (e) {
        // Continue processing even if one line fails
        continue;
      }
    }

    // Validate response content
    if (!content || content.length < 100) {
      throw new Error('AI response too short or invalid');
    }

    res.json({
      content: content.trim(),
      message: 'Cover letter generated successfully'
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);

    // Enhanced error handling with specific status codes
    const errorResponse = {
      error: 'Cover letter generation failed',
      details: error.message
    };

    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      return res.status(503).json({
        ...errorResponse,
        error: 'AI service unavailable',
        details: 'Could not connect to the AI service. Please try again later.'
      });
    }

    res.status(500).json(errorResponse);
  }
});

module.exports = router;