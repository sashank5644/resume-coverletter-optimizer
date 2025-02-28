require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

// Updated Ollama health check using tags endpoint
async function checkOllamaService(retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to Ollama (attempt ${i + 1}/${retries})...`);
      
      // Use /api/tags endpoint instead of /api/health
      const response = await axios.get(`${OLLAMA_URL}/api/tags`, { 
        timeout: 5000,
        validateStatus: (status) => status === 200 // Only accept 200 status
      });

      // Check if we got a valid response
      if (response.data) {
        console.log('Successfully connected to Ollama service');
        
        // Log available models
        const models = response.data.models || [];
        if (models.length > 0) {
          console.log('Available models:', models.map(m => m.name).join(', '));
        } else {
          console.log('No models currently available. You may need to pull your required model.');
        }
        
        return true;
      }
      
    } catch (error) {
      const errorMessage = error.response?.status === 404 
        ? 'Endpoint not found - please check Ollama version and configuration'
        : error.message;
        
      if (i === retries - 1) {
        console.error('Failed to connect to Ollama service after all retries');
        console.error('Error details:', errorMessage);
        return false;
      }
      console.log(`Retrying in ${RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  return false;
}

// Initialize all services
async function initializeServices() {
  try {
    // Check Ollama first
    const ollamaAvailable = await checkOllamaService();
    if (!ollamaAvailable) {
      console.error('\nERROR: Ollama service is not available.');
      console.error('Please ensure:');
      console.error('1. Ollama is running (ollama serve)');
      console.error('2. The deepseek-coder model is pulled (ollama pull deepseek-coder)');
      console.error(`3. Ollama is accessible at ${OLLAMA_URL}\n`);
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB Atlas');

    // Initialize Express middleware
    app.use(cors());
    app.use(express.json());

    // Initialize routes
    app.use('/api/ai', require('./routes/ai'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/resumes', require('./routes/resumes'));
    app.use('/api/jobs', require('./routes/jobs'));

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`Ollama service available at ${OLLAMA_URL}`);
    });

  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start the application
initializeServices().catch(error => {
  console.error('Application failed to start:', error);
  process.exit(1);
});