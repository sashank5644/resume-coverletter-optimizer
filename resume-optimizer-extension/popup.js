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

  // Extract job description using backend proxy
  extractJobBtn.addEventListener('click', async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0]) {
        showMessage('No active tab found.', 'error');
        return;
      }

      const tabId = tabs[0].id;
      console.log('Sending message to tab:', tabId);

      try {
        // Use the retry mechanism to send the message
        const response = await sendMessageWithRetry(tabId, { action: 'getPageContent' });

        if (response && response.content) {
          // Check the size of the content before sending
          const maxPayloadSize = 5000; // Adjust based on server limits
          let contentToSend = response.content;
          if (contentToSend.length > maxPayloadSize) {
            contentToSend = contentToSend.substring(0, maxPayloadSize) + '... [Truncated due to size limit]';
            console.warn(`Content truncated to ${maxPayloadSize} characters to avoid payload size issues.`);
          }

          try {
            const res = await fetch(`${API_BASE_URL}/api/extract-job-details`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: contentToSend })
            });

            // Check for 413 status code
            if (res.status === 413) {
              throw new Error('Payload too large. The job description is too long to process. Try a shorter description.');
            }

            // Check if the response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await res.text();
              console.error('Non-JSON response received:', text);
              throw new Error('Server returned an invalid response (not JSON). Please try again later.');
            }

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || 'Failed to extract job details');
            }

            const { position, company, location, jobDescription, qualifications, salary, jobType, duration, date } = data;
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
            `.trim();

            jobDescriptionTextarea.value = formattedDescription;
            positionInput.value = position;
            companyInput.value = company;
            await handleResumeCheck(); // Check resumes and update UI
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
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 3000);
  }
});