require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize GoogleGenerativeAI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY2);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Function to extract and parse a resume
const extractResume = async (file, text) => {
  try {
    let resumeText = text;

    //console.log('Processing request with:', { file: file ? 'File present' : 'No file', textLength: text ? text.length : 0 });

    // If a file is provided, extract text from the PDF
    if (file) {
      //console.log('Extracting text from PDF...');
      const extractResult = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: file // Base64 string
          }
        },
        {
          text: 'Extract the text from this PDF document.'
        }
      ]);
      resumeText = extractResult.response.text();
      //console.log('Extracted text from PDF:', resumeText);
    }

    // Parse the resume text
    //console.log('Parsing resume text...');
    const parsePrompt = `You are an AI assistant that extracts structured data from resume text. Extract the following sections from the provided resume text and format the output as a valid JSON object with the following structure: { "title": "", "projects": "", "skills": "", "education": "", "experience": "" }. The "projects" and "experience" fields must be strings with entries separated by double newlines (\n\n), where each entry has the format "Title, Date\nDescription". The "skills" field must be a comma-separated string. The "education" field must be formatted as "Degree, Institution, Year" with entries separated by newlines (\n). If a section is not found, return an empty string for that field. Ensure the output is valid JSON with proper escaping of special characters. Do not wrap the JSON in Markdown formatting (e.g., do not include \`\`\`json or similar). Here is the resume text:\n\n${resumeText}`;

    const parseResult = await model.generateContent(
      [
        {
          text: parsePrompt
        }
      ],
      {
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }
    );

    const rawResponse = parseResult.response.text();

    // Strip Markdown formatting if present (e.g., ```json\n...\n```)
    let jsonString = rawResponse;
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
    }


    const parsedData = JSON.parse(jsonString);
    //console.log('Parsed data:', parsedData);
    return parsedData;
  } catch (err) {
    //console.error('Error with Gemini API in extractResume:', err.message, err.stack);
    throw new Error('Failed to process resume with Gemini API: ' + err.message);
  }
};

module.exports = { extractResume };