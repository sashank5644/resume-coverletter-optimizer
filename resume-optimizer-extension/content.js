console.log('Content script loaded on:', window.location.href);
// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received in content script:', request.action);
  
  // Respond to ping to confirm content script is loaded
  if (request.action === 'ping') {
    console.log('Responding to ping');
    sendResponse({status: 'ready'});
    return true;
  }
  
  if (request.action === 'extractJobDescription') {
    try {
      console.log('Extracting job data...');
      const jobData = extractJobData();
      console.log('Job data extracted:', jobData);
      sendResponse(jobData);
    } catch (error) {
      console.error('Error extracting job data:', error);
      sendResponse({ error: error.message });
    }
    return true; // Keep the message channel open for async response
  }
});

// Main function to extract job data
function extractJobData() {
  debugExtraction();
  const currentUrl = window.location.href;
  let jobDescription = '';
  let jobTitle = '';
  let company = '';
  
  // LinkedIn Job Page
  if (currentUrl.includes('linkedin.com/jobs/')) {
    jobDescription = extractLinkedInJobDescription();
    jobTitle = extractLinkedInJobTitle();
    company = extractLinkedInCompany();
  } 
  // Indeed Job Page
  else if (currentUrl.includes('indeed.com/viewjob') || currentUrl.includes('indeed.com/job/')) {
    jobDescription = extractIndeedJobDescription();
    jobTitle = extractIndeedJobTitle();
    company = extractIndeedCompany();
  }
  
  return {
    jobDescription,
    jobTitle,
    company,
    url: currentUrl,
    platform: getPlatformName(currentUrl)
  };
}

// Extract job description from LinkedIn
function extractLinkedInJobDescription() {
  // Try different possible selectors for LinkedIn job descriptions
  const descriptionSelectors = [
    '.description__text',
    '.show-more-less-html__markup',
    '[data-automation="job-description"]',
    '.jobs-description-content',
    '.jobs-box__html-content',
    '.jobs-description',
    '.jobs-unified-description__content',
    '.jobs-description-details',
    '#job-details',
    '[data-testid="job-description"]'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanText(element.textContent);
    }
  }
  
  // If all selectors fail, try to find any div that might contain the job description
  const jobDetailsSection = document.querySelector('.job-details') || 
                           document.querySelector('.jobs-description') || 
                           document.querySelector('.jobs-box');
  
  if (jobDetailsSection) {
    return cleanText(jobDetailsSection.textContent);
  }
  
  return 'Could not extract job description from LinkedIn. Please try again or copy manually.';
}

// Extract job title from LinkedIn
function extractLinkedInJobTitle() {
  const titleSelectors = [
    '.jobs-unified-top-card__job-title',
    '.job-title',
    '.jobs-details-top-card__job-title',
    'h1.t-24',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanText(element.textContent);
    }
  }
  
  return 'Unknown Position';
}

// Extract company name from LinkedIn
function extractLinkedInCompany() {
  const companySelectors = [
    '.jobs-unified-top-card__company-name',
    '.jobs-details-top-card__company-url',
    '.company-name',
    '.jobs-top-card__company-url'
  ];
  
  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanText(element.textContent);
    }
  }
  
  const allTextElements = document.querySelectorAll('div, section, article, p');
  for (const element of allTextElements) {
    const text = element.textContent.trim();
    // If we find a large block of text (likely the job description)
    if (text.length > 300 && text.includes('experience') && 
        (text.includes('responsibilities') || text.includes('requirements'))) {
      return cleanText(text);
    }
  }

  return 'Unknown Company';
}

// Extract job description from Indeed
function extractIndeedJobDescription() {
  // Try different possible selectors for Indeed job descriptions
  const descriptionSelectors = [
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    '[data-testid="jobDescriptionText"]',
    '.job-desc',
    // Add these new selectors:
    '#jobDetails',
    '.viewJobBodyClass', 
    '.jobsearch-JobComponent-description',
    '#jobDetailText'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanText(element.textContent);
    }
  }
  
  return 'Could not extract job description from Indeed. Please try again or copy manually.';
}

// Extract job title from Indeed
function extractIndeedJobTitle() {
  const titleSelectors = [
    '.jobsearch-JobInfoHeader-title',
    '[data-testid="jobTitle"]',
    '.job-title',
    'h1.jobsearch-JobInfoHeader-title'
  ];
  
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanText(element.textContent);
    }
  }
  
  const allTextElements = document.querySelectorAll('div, section, article, p');
  for (const element of allTextElements) {
    const text = element.textContent.trim();
    // If we find a large block of text (likely the job description)
    if (text.length > 300 && text.includes('experience') && 
        (text.includes('responsibilities') || text.includes('requirements'))) {
      return cleanText(text);
    }
  }

  return 'Unknown Position';
}

// Extract company name from Indeed
function extractIndeedCompany() {
  const companySelectors = [
    '.jobsearch-InlineCompanyRating-companyName',
    '[data-testid="companyName"]',
    '.company-name',
    '.companyName'
  ];
  
  for (const selector of companySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return cleanText(element.textContent);
    }
  }
  
  return 'Unknown Company';
}

// Helper function to clean extracted text
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

// Get platform name from URL
function getPlatformName(url) {
  if (url.includes('linkedin.com')) {
    return 'LinkedIn';
  } else if (url.includes('indeed.com')) {
    return 'Indeed';
  }
  return 'Unknown';
}

function debugExtraction() {
  console.log('Debugging job extraction:');
  console.log('URL:', window.location.href);
  
  // LinkedIn selectors
  if (window.location.href.includes('linkedin.com')) {
    console.log('LinkedIn selectors check:');
    const descriptionSelectors = [
      '.description__text',
      '.show-more-less-html__markup',
      '[data-automation="job-description"]',
      '.jobs-description-content',
      '.jobs-box__html-content',
      '.jobs-description',
      '.jobs-unified-description__content'
    ];
    
    for (const selector of descriptionSelectors) {
      const element = document.querySelector(selector);
      console.log(`Selector "${selector}": ${element ? 'FOUND' : 'NOT FOUND'}`);
      if (element) {
        console.log('Content length:', element.textContent.trim().length);
      }
    }
  }
}