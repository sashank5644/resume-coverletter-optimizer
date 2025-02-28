// Constants
const API_URL = 'http://localhost:3000'; // Update with your actual backend URL

// DOM Elements
const jobStatusEl = document.getElementById('jobStatus');
const loginStatusEl = document.getElementById('loginStatus');
const extractBtn = document.getElementById('extractBtn');
const optimizeBtn = document.getElementById('optimizeBtn');
const coverLetterBtn = document.getElementById('coverLetterBtn');
const loginToggleBtn = document.getElementById('loginToggleBtn');
const loginSection = document.getElementById('loginSection');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// State
let currentJobDescription = null;
let isLoggedIn = false;
let userToken = null;

// Initialize the extension
function init() {
  checkLoginStatus();
  checkForJobPage();
  setupEventListeners();
}

// Check if user is logged in
function checkLoginStatus() {
  chrome.storage.local.get(['userToken'], function(result) {
    if (result.userToken) {
      userToken = result.userToken;
      isLoggedIn = true;
      loginStatusEl.textContent = 'Logged in successfully';
      loginStatusEl.classList.add('success');
      loginToggleBtn.textContent = 'Logout';
      
      // Enable buttons if user is logged in
      if (currentJobDescription) {
        optimizeBtn.disabled = false;
        coverLetterBtn.disabled = false;
      }
    } else {
      loginStatusEl.textContent = 'Not logged in. Please log in to use all features.';
      loginStatusEl.classList.remove('success');
      loginToggleBtn.textContent = 'Login / Sign Up';
      optimizeBtn.disabled = true;
      coverLetterBtn.disabled = true;
    }
  });
}

// Check if current page is a job description page
function checkForJobPage() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    
    if (currentUrl.includes('linkedin.com/jobs/') || 
        currentUrl.includes('indeed.com/viewjob') ||
        currentUrl.includes('indeed.com/job/')) {
      
      jobStatusEl.textContent = 'Job description page detected!';
      jobStatusEl.classList.add('success');
      extractBtn.disabled = false;
      
      // Check if we already extracted this job
      chrome.storage.local.get(['lastExtractedUrl', 'lastJobDescription'], function(result) {
        if (result.lastExtractedUrl === currentUrl && result.lastJobDescription) {
          currentJobDescription = result.lastJobDescription;
          jobStatusEl.textContent = 'Job description already extracted!';
          
          if (isLoggedIn) {
            optimizeBtn.disabled = false;
            coverLetterBtn.disabled = false;
          }
        }
      });
      
    } else {
      jobStatusEl.textContent = 'Not a job description page. Navigate to a LinkedIn or Indeed job posting.';
      jobStatusEl.classList.remove('success');
      jobStatusEl.classList.add('error');
      extractBtn.disabled = true;
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  // Extract button
  extractBtn.addEventListener('click', function() {
    extractJobDescription();
  });
  
  // Optimize Resume button
  optimizeBtn.addEventListener('click', function() {
    if (!isLoggedIn) {
      alert('Please log in to use this feature.');
      return;
    }
    
    if (!currentJobDescription) {
      alert('Please extract a job description first.');
      return;
    }
    
    chrome.storage.local.get(['userToken'], function(result) {
      if (result.userToken) {
        // Instead of opening the dashboard, open the job tracker page with job details in the URL
        const jobData = {
          jobDescription: encodeURIComponent(currentJobDescription),
          position: extractPositionFromDescription(currentJobDescription) || 'Unknown Position', // Helper function to parse position
          company: extractCompanyFromDescription(currentJobDescription) || 'Unknown Company',   // Helper function to parse company
          appliedDate: new Date().toISOString().split('T')[0] // Current date
        };
        
        // Open the job tracker page with query parameters
        chrome.tabs.create({
          url: `http://localhost:5173/jobs?jobDescription=${jobData.jobDescription}&position=${encodeURIComponent(jobData.position)}&company=${encodeURIComponent(jobData.company)}&appliedDate=${jobData.appliedDate}&token=${result.userToken}`
        });
      }
    });
  });

  function extractPositionFromDescription(description) {
    // Simple regex to find position (e.g., "Software Engineer" or similar)
    const positionMatch = description.match(/(\w+\s+Engineer|\w+\s+Developer|\w+\s+Manager)/i);
    return positionMatch ? positionMatch[0] : 'Unknown Position';
  }
  
  function extractCompanyFromDescription(description) {
    // Simple regex to find company name (e.g., "Tech Inc." or similar)
    const companyMatch = description.match(/(?:at\s+)?([A-Z][a-zA-Z\s]+(?:Inc\.|Corp\.|Co\.))/i);
    return companyMatch ? companyMatch[1] : 'Unknown Company';
  }
  
  // Cover Letter button
  coverLetterBtn.addEventListener('click', function() {
    if (!isLoggedIn) {
      alert('Please log in to use this feature.');
      return;
    }
    
    if (!currentJobDescription) {
      alert('Please extract a job description first.');
      return;
    }
    
    chrome.storage.local.get(['userToken'], function(result) {
      if (result.userToken) {
        // Open the web app in a new tab
        chrome.tabs.create({
          url: `https://localhost:5173/?jobs?jobDescription=${encodeURIComponent(currentJobDescription)}&token=${result.userToken}`
        });
      }
    });
  });
  
  // Login/Logout toggle
  loginToggleBtn.addEventListener('click', function() {
    if (isLoggedIn) {
      // Logout functionality
      chrome.storage.local.remove(['userToken'], function() {
        isLoggedIn = false;
        userToken = null;
        checkLoginStatus();
      });
    } else {
      // Show login form
      loginSection.style.display = loginSection.style.display === 'block' ? 'none' : 'block';
    }
  });
  
  // Login button
  loginBtn.addEventListener('click', function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    
    loginStatusEl.textContent = 'Logging in...';
    
    fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        chrome.storage.local.set({ userToken: data.token }, function() {
          userToken = data.token;
          isLoggedIn = true;
          loginSection.style.display = 'none';
          checkLoginStatus();
        });
      } else {
        loginStatusEl.textContent = 'Login failed. Check your credentials.';
        loginStatusEl.classList.add('error');
      }
    })
    .catch(error => {
      loginStatusEl.textContent = 'Error connecting to server.';
      loginStatusEl.classList.add('error');
      console.error('Login error:', error);
    });
  });
  
  // Signup button
  signupBtn.addEventListener('click', function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }
    
    loginStatusEl.textContent = 'Creating account...';
    
    fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        chrome.storage.local.set({ userToken: data.token }, function() {
          userToken = data.token;
          isLoggedIn = true;
          loginSection.style.display = 'none';
          checkLoginStatus();
        });
      } else {
        loginStatusEl.textContent = 'Signup failed. ' + (data.message || '');
        loginStatusEl.classList.add('error');
      }
    })
    .catch(error => {
      loginStatusEl.textContent = 'Error connecting to server.';
      loginStatusEl.classList.add('error');
      console.error('Signup error:', error);
    });
  });
}

// Extract job description from the current page
function extractJobDescription() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    jobStatusEl.textContent = 'Extracting job description...';
    
    // First check if the content script is already there
    chrome.tabs.sendMessage(tabs[0].id, {action: 'ping'}, function(response) {
      if (chrome.runtime.lastError || !response) {
        console.log('Content script not yet loaded, injecting manually');
        
        // Manually inject the content script
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['content.js']
        }).then(() => {
          console.log('Content script injected successfully');
          // Wait a moment for the script to initialize
          setTimeout(() => {
            sendExtractMessage(tabs[0].id, currentUrl);
          }, 300);
        }).catch(err => {
          jobStatusEl.textContent = 'Error injecting script: ' + err.message;
          jobStatusEl.classList.add('error');
        });
      } else {
        // Content script is already there, send the extraction message
        sendExtractMessage(tabs[0].id, currentUrl);
      }
    });
  });
}

function sendExtractMessage(tabId, currentUrl) {
  chrome.tabs.sendMessage(
    tabId,
    { action: 'extractJobDescription' },
    function(response) {
      if (chrome.runtime.lastError) {
        jobStatusEl.textContent = 'Error: ' + chrome.runtime.lastError.message;
        jobStatusEl.classList.add('error');
        return;
      }
      
      if (response && response.jobDescription) {
        currentJobDescription = response.jobDescription;
        
        // Save to local storage
        chrome.storage.local.set({
          lastExtractedUrl: currentUrl,
          lastJobDescription: response.jobDescription
        });
        
        jobStatusEl.textContent = 'Job description extracted successfully!';
        jobStatusEl.classList.add('success');
        
        // Enable buttons if user is logged in
        if (isLoggedIn) {
          optimizeBtn.disabled = false;
          coverLetterBtn.disabled = false;
        }
      } else {
        jobStatusEl.textContent = 'Failed to extract job description. Try again.';
        jobStatusEl.classList.add('error');
      }
    }
  );
}

// Client-side extraction fallback
function useClientSideExtraction(tabId, currentUrl) {
  chrome.tabs.sendMessage(
    tabId,
    { action: 'extractJobDescription' },
    function(response) {
      if (chrome.runtime.lastError) {
        jobStatusEl.textContent = 'Error1: ' + chrome.runtime.lastError.message;
        jobStatusEl.classList.add('error');
        return;
      }
      
      if (response && response.jobDescription) {
        // Add this missing success code:
        currentJobDescription = response.jobDescription;
        
        // Save to local storage
        chrome.storage.local.set({
          lastExtractedUrl: currentUrl,
          lastJobDescription: response.jobDescription
        });
        
        jobStatusEl.textContent = 'Job description extracted successfully!';
        jobStatusEl.classList.add('success');
        
        // Enable buttons if user is logged in
        if (isLoggedIn) {
          optimizeBtn.disabled = false;
          coverLetterBtn.disabled = false;
        }
      } else {
        jobStatusEl.textContent = 'Failed to extract job description. Try again.';
        jobStatusEl.classList.add('error');
      }
    }
  );
}

// This function is now a fallback and only used when server-side extraction fails
function saveJobToDatabase(jobDescription, jobUrl, jobTitle, company) {
  fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      jobDescription,
      jobUrl,
      jobTitle: jobTitle || 'Unknown Title',
      company: company || 'Unknown Company',
      status: 'Saved'
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Job saved to database:', data);
  })
  .catch(error => {
    console.error('Error saving job:', error);
  });
}


// Initialize the popup
document.addEventListener('DOMContentLoaded', init);