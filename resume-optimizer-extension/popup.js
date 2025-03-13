document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const mainSection = document.getElementById('main-section');
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');
  const extractJobBtn = document.getElementById('extract-job');
  const jobDescriptionTextarea = document.getElementById('job-description');
  const positionInput = document.getElementById('position');
  const companyInput = document.getElementById('company');
  const optimizeResumeBtn = document.getElementById('optimize-resume');
  const logoutBtn = document.getElementById('logout-btn');
  const createResumeBtn = document.getElementById('create-resume');
  const resumeSelection = document.getElementById('resume-selection');
  const messageDiv = document.getElementById('message');
  const registerLink = document.getElementById('register-link');

  const API_BASE_URL = 'https://resume-coverletter-optimizer.onrender.com'; // Replace with 'https://your-backend-render-url.com' for production
  const FRONTEND_URL = 'https://resume-coverletter-optimizer.vercel.app/'; // Replace with your actual Vercel URL
  const REGISTER_URL = 'https://resume-coverletter-optimizer.vercel.app/'; // Replace with your actual registration URL

  // Check if user is already logged in
  chrome.storage.local.get(['authToken'], (result) => {
    if (result.authToken) {
      loginSection.style.display = 'none';
      mainSection.style.display = 'block';
    }
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    loginBtn.disabled = true;
    loginError.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const token = data.token;
      chrome.storage.local.set({ authToken: token }, () => {
        loginSection.style.display = 'none';
        mainSection.style.display = 'block';
        showMessage('Login successful!', 'success');
      });
    } catch (err) {
      loginError.textContent = err.message === 'Network Error'
        ? 'Unable to connect to the server. Please ensure the backend is running at http://localhost:3000.'
        : 'Login failed. Please check your credentials and try again.';
      loginError.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
    }
  });

  // Register link handler
  registerLink.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    chrome.tabs.create({ url: REGISTER_URL }, () => {
      showMessage('Redirecting to registration page...', 'info');
    });
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['authToken'], () => {
      loginSection.style.display = 'block';
      mainSection.style.display = 'none';
      emailInput.value = '';
      passwordInput.value = '';
      jobDescriptionTextarea.value = '';
      positionInput.value = '';
      companyInput.value = '';
      createResumeBtn.style.display = 'none';
      optimizeResumeBtn.style.display = 'none';
      resumeSelection.style.display = 'none';
      showMessage('Logged out successfully!', 'success');
    });
  });

  // Fetch resumes from backend
  async function fetchResumes() {
    const token = (await chrome.storage.local.get(['authToken'])).authToken;
    if (!token) {
      showMessage('Please log in to fetch resumes.', 'error');
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/resumes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch resumes');
      }
      console.log('Fetched resumes:', data); // Debug log
      return data || [];
    } catch (error) {
      console.error('Error fetching resumes:', error);
      showMessage('Failed to fetch resumes.', 'error');
      return [];
    }
  }

  // Handle resume check and UI update after extraction
  async function handleResumeCheck() {
    const resumes = await fetchResumes();
    console.log('Resumes length in handleResumeCheck:', resumes.length); // Debug log
    // Toggle resume selection section based on resumes
    resumeSelection.style.display = resumes.length > 0 ? 'block' : 'none';

    if (resumes.length > 0) {
      // Show Optimize Resume button if there are resumes
      createResumeBtn.style.display = 'none';
      optimizeResumeBtn.style.display = 'block';
      console.log('Setting optimizeResumeBtn display to block'); // Debug log
      showMessage('Job description extracted. Click "Optimize Resume" to proceed.', 'success');
    } else {
      // Show Create Resume button and message if no resumes
      createResumeBtn.style.display = 'block';
      optimizeResumeBtn.style.display = 'none';
      resumeSelection.style.display = 'none'; // Ensure resume selection is hidden
      showMessage('Please create a resume before optimizing.', 'info');
    }
  }

  // Utility function to send a message to the content script with retries
  async function sendMessageWithRetry(tabId, message, retries = 3, delay = 500) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Attempt ${i + 1}: Sending message to tab ${tabId}`);
        return await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          });
        });
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed: ${error.message}`);
        if (i === retries - 1) {
          throw new Error(`Failed to send message after ${retries} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Utility function to split content into chunks for API processing
  function processJobDescription(content) {
    // Extract key information even from large job descriptions
    const extractKeyInfo = (text) => {
      // Simple extraction based on common patterns in job descriptions
      const patterns = {
        position: /position\s*:\s*([^:\n]+)/i,
        company: /company\s*:\s*([^:\n]+)/i,
        location: /location\s*:\s*([^:\n]+)/i,
        jobType: /(full[-\s]time|part[-\s]time|contract|freelance|temporary|permanent)/i,
        qualifications: /(qualifications|requirements|skills)[\s\n:]+([^#]+?)((?=\n\s*[A-Z])|$)/i,
        description: /(description|responsibilities|duties|overview)[\s\n:]+([^#]+?)((?=\n\s*[A-Z])|$)/i
      };
      
      const results = {};
      for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
          results[key] = key === 'qualifications' || key === 'description' ? match[2].trim() : match[1].trim();
        } else {
          results[key] = key === 'qualifications' || key === 'description' ? 'Not specified' : 'Not specified';
        }
      }
      
      return results;
    };
    
    // Process the content to extract key information
    const keyInfo = extractKeyInfo(content);
    
    // Create a more concise job description with the essential information
    const maxApiSize = 3000; // Maximum size for API request
    const trimmedDescription = keyInfo.description.length > 1000 ? 
      keyInfo.description.substring(0, 1000) + '... (trimmed)' : 
      keyInfo.description;
    
    const trimmedQualifications = keyInfo.qualifications.length > 1000 ? 
      keyInfo.qualifications.substring(0, 1000) + '... (trimmed)' : 
      keyInfo.qualifications;
    
    // Combine the information into a structured format
    const processedContent = {
      position: keyInfo.position,
      company: keyInfo.company,
      location: keyInfo.location || 'Not specified',
      jobType: keyInfo.jobType || 'Not specified',
      description: trimmedDescription,
      qualifications: trimmedQualifications,
      originalLength: content.length,
      wasTrimmed: content.length > maxApiSize
    };
    
    return processedContent;
  }

  // Extract job description using backend proxy
  extractJobBtn.addEventListener('click', async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0]) {
        showMessage('No active tab found.', 'error');
        return;
      }

      const tabId = tabs[0].id;
      console.log('Sending message to tab:', tabId);
      
      extractJobBtn.disabled = true;
      extractJobBtn.textContent = 'Extracting...';

      try {
        // Use the retry mechanism to send the message
        const response = await sendMessageWithRetry(tabId, { action: 'getPageContent' });

        if (response && response.content) {
          try {
            // Process job description locally to avoid payload size issues
            const processedJobData = processJobDescription(response.content);
            console.log('Processed job data:', processedJobData);
            
            // Check if we need to use the API or process locally based on size
            let extractedData;
            
            if (!processedJobData.wasTrimmed) {
              // Use the API for smaller content
              const res = await fetch(`${API_BASE_URL}/api/extract-job-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: response.content })
              });
              
              if (!res.ok) {
                if (res.status === 413) {
                  // Fallback to local processing if payload is too large
                  extractedData = {
                    position: processedJobData.position,
                    company: processedJobData.company,
                    location: processedJobData.location,
                    jobDescription: processedJobData.description,
                    qualifications: processedJobData.qualifications,
                    salary: 'Not specified',
                    jobType: processedJobData.jobType,
                    duration: 'Not specified',
                    date: new Date().toLocaleDateString()
                  };
                } else {
                  const errorData = await res.json();
                  throw new Error(errorData.error || 'Failed to extract job details');
                }
              } else {
                // Use API response for smaller content
                extractedData = await res.json();
              }
            } else {
              // Use local processing for larger content
              extractedData = {
                position: processedJobData.position,
                company: processedJobData.company,
                location: processedJobData.location,
                jobDescription: processedJobData.description,
                qualifications: processedJobData.qualifications,
                salary: 'Not specified',
                jobType: processedJobData.jobType,
                duration: 'Not specified',
                date: new Date().toLocaleDateString()
              };
            }

            const { position, company, location, jobDescription, qualifications, salary, jobType, duration, date } = extractedData;
            const formattedDescription = `
              Position: ${position}
              Company: ${company}
              Location: ${location}
              Duration: ${duration}
              Date: ${date}
              Salary: ${salary}
              Job Type: ${jobType}

              Job Description:
              ${jobDescription}

              Qualifications:
              ${qualifications}
              
              ${processedJobData.wasTrimmed ? '(Note: This job description was truncated due to its size)' : ''}
            `.trim();

            jobDescriptionTextarea.value = formattedDescription;
            positionInput.value = position;
            companyInput.value = company;
            await handleResumeCheck(); // Check resumes and update UI
            
            // Show a warning if content was trimmed
            if (processedJobData.wasTrimmed) {
              showMessage('Job description was too large and has been summarized.', 'warning', 5000);
            } else {
              showMessage('Job description extracted successfully!', 'success');
            }
            
          } catch (error) {
            console.error('Backend API error:', error.message);
            showMessage(error.message || 'Failed to extract job description.', 'error');
          }
        } else {
          showMessage('No content found on this page.', 'error');
        }
      } catch (error) {
        console.error('Message sending error:', error.message);
        // Check if the error is related to the content script not being loaded
        if (error.message.includes('Receiving end does not exist')) {
          showMessage('This page is not a supported job page (LinkedIn or Indeed). Please navigate to a job listing.', 'error');
        } else {
          showMessage('Failed to get page content: ' + error.message, 'error');
        }
      } finally {
        extractJobBtn.disabled = false;
        extractJobBtn.textContent = 'Extract Job Description';
      }
    });
  });

  // Create Resume button handler
  createResumeBtn.addEventListener('click', () => {
    const redirectUrl = `${FRONTEND_URL}/resumes`;
    chrome.tabs.create({ url: redirectUrl }, () => {
      showMessage('Redirecting to Resume Builder...', 'info');
    });
  });

  // Optimize Resume button handler
  optimizeResumeBtn.addEventListener('click', () => {
    const jobDescription = encodeURIComponent(jobDescriptionTextarea.value);
    const redirectUrl = `${FRONTEND_URL}/resumes?jobDescription=${jobDescription}`;
    chrome.tabs.create({ url: redirectUrl }, () => {
      showMessage('Redirecting to Resume Builder...', 'info');
    });
  });

  // Helper function to show messages
  function showMessage(message, type, duration = 3000) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, duration);
  }
});