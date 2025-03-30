const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

exports.optimizeResume = async (req, res) => {
  const { resumeProjects, resumeSkills, jobDescription } = req.body;

  if (!resumeProjects || !jobDescription) {
    return res.status(400).json({ error: 'Resume projects and job description are required' });
  }

  try {
    // Validate API key presence
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Construct prompt for resume optimization
    const prompt = `
      You are an expert resume optimizer. Optimize the following resume projects to better match the job description provided. 
      Focus on aligning project descriptions, skills, and keywords with the job requirements. Return ONLY the optimized projects and skills in the EXACT following format with no additional text:
      - Optimized Projects: [Your optimized projects here, in the same format as the input]
      - Skills: [Comma-separated list of updated skills]

      **Resume Projects:**
      ${resumeProjects}

      **Current Skills:**
      ${resumeSkills || 'None provided'}

      **Job Description:**
      ${jobDescription}
    `;

    //console.log('Sending prompt to Gemini:', prompt); // Debug log

    // Make the API call to Gemini
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    //console.log('Gemini raw response:', responseText); // Debug log for full response

    // Parse the response with robust handling
    let optimizedProjects = '';
    let skills = [];

    // Try to extract optimized projects
    const optimizedProjectsMatch = responseText.match(/Optimized Projects: ([\s\S]*?)(?=\n- Skills:|$)/i);
    if (optimizedProjectsMatch) {
      optimizedProjects = optimizedProjectsMatch[1].trim();
    } else {
      console.warn('Optimized Projects not found in Gemini response, using original projects');
      optimizedProjects = resumeProjects; // Fallback to original projects
    }

    // Try to extract skills
    const skillsMatch = responseText.match(/Skills: (.*)/i);
    if (skillsMatch) {
      skills = skillsMatch[1].split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    } else {
      console.warn('Skills not found in Gemini response, using original skills');
      skills = resumeSkills ? resumeSkills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0) : [];
    }

    // Ensure we have valid data to return
    if (!optimizedProjects) {
      throw new Error('No valid optimized projects generated');
    }

    res.json({ projects: optimizedProjects, skills });
  } catch (error) {
    console.error('Error optimizing resume:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to optimize resume', 
      details: error.message || 'An unexpected error occurred while processing the Gemini response',
      rawResponse: responseText // Include raw response for debugging
    });
  }
};

exports.generateCoverLetter = async (req, res) => {
  const { position, company, jobDescription, resumeContent, userName } = req.body;

  if (!position || !company || !jobDescription) {
    return res.status(400).json({ error: 'Position, company, and job description are required' });
  }

  try {
    // Validate API key presence
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    // Construct prompt for cover letter generation
    const prompt = `
      You are an expert in writing professional cover letters. Generate a cover letter for the following job application. Use the job description and resume content to tailor the letter, highlighting relevant skills and experiences. Address the letter to "Hiring Manager" and sign it with the user's name.

      **Position:**
      ${position}

      **Company:**
      ${company}

      **Job Description:**
      ${jobDescription}

      **Resume Content:**
      ${resumeContent || 'Not provided'}

      **User Name:**
      ${userName || 'Job Applicant'}

      Provide the cover letter in plain text format.
    `;

    //console.log('Sending prompt to Gemini:', prompt); // Debug log

    const result = await model.generateContent(prompt);
    const coverLetter = result.response.text();

    res.json({ content: coverLetter });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    res.status(500).json({ error: 'Failed to generate cover letter: ' + error.message });
  }
};