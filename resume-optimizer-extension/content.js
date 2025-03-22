// Log to confirm content script is running
console.log('Content script loaded on:', window.location.href);

// Function to check if we're on a job page
function isJobPage() {
  const url = window.location.href;
  return (
    (url.includes('linkedin.com') && url.includes('/jobs/')) ||
    (url.includes('indeed.com') && (url.includes('/jobs') || url.includes('/viewjob') || url.includes('/q-')))
  );
}

// Function to inject a notification into the DOM and remove it after 5 seconds
function injectNotification() {
  if (document.getElementById('job-detected-notification')) return; // Avoid duplicate notifications

  const notification = document.createElement('div');
  notification.id = 'job-detected-notification';
  notification.innerHTML = `
    <div class="job-notification">
      <p>Job page detected! Open the AI Resume Optimizer extension to extract the job description.</p>
    </div>
  `;
  document.body.appendChild(notification);

  // Inject styles for the notification
  const style = document.createElement('style');
  style.textContent = `
    .job-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      font-family: 'Poppins', sans-serif;
      font-size: 0.9rem;
    }
  `;
  document.head.appendChild(style);

  // Remove the notification after 5 seconds
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Check for job page and inject notification
if (isJobPage()) {
  console.log('Job page detected:', window.location.href);
  injectNotification();
} else {
  console.log('Not a job page:', window.location.href);
}

// Enhanced LinkedIn specific selectors for better job extraction
const LINKEDIN_SELECTORS = {
  // Job title selectors
  jobTitle: [
    'h1.job-title', 
    'h1.topcard__title',
    'h1[data-test-job-title]',
    '.job-details-jobs-unified-top-card__job-title',
    '.topcard__title'
  ],
  // Company name selectors
  company: [
    'a.topcard__org-name-link',
    '.job-details-jobs-unified-top-card__company-name',
    '.topcard__org-name-link',
    '[data-test-employer-name]'
  ],
  // Location selectors
  location: [
    '.job-details-jobs-unified-top-card__bullet',
    '.topcard__flavor-row span',
    '[data-test-job-location]',
    '.job-details-jobs-unified-top-card__workplace-type'
  ],
  // Job description selectors
  description: [
    '.jobs-description-content__text',
    '.show-more-less-html__markup',
    '.description__text',
    '[data-test-job-description]',
    '.job-details-jobs-unified-top-card__job-insight'
  ],
  // About section - company description
  about: [
    '.job-details-jobs-unified-top-card__company-description',
    '.topcard__flavor-row span',
    '.topcard__org-description'
  ]
};

// Enhanced Indeed specific selectors
const INDEED_SELECTORS = {
  jobTitle: [
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    'h1.jobsearch-JobInfoHeader-title'
  ],
  company: [
    '[data-testid="inlineCompanyName"]',
    '.jobsearch-InlineCompanyRating'
  ],
  location: [
    '[data-testid="jobsearch-JobInfoHeader-locationText"]',
    '.jobsearch-JobInfoHeader-subtitle .iconLabel'
  ],
  description: [
    '#jobDescriptionText',
    '.jobsearch-JobComponent-description'
  ]
};

// Function to attempt to extract text from multiple selectors
function extractFromSelectors(selectors, element) {
  for (const selector of selectors) {
    const elements = element.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      // If multiple elements, combine their text
      let text = '';
      elements.forEach(el => {
        text += (el.textContent || el.innerText || '') + ' ';
      });
      return text.trim();
    }
  }
  return '';
}

// Function  to clean and intelligently extract content
function cleanAndLimitContent(element, maxLength = 10000) {
  if (!element) return '';

  // Remove script and style elements
  const clone = element.cloneNode(true);
  const scripts = clone.querySelectorAll('script, style, iframe, img, svg, canvas, video, audio');
  scripts.forEach(script => script.remove());

  // First, try to find the most relevant content
  const jobDescriptionSection = findJobDescriptionSection(clone);
  
  // Extract text content and clean it
  let text = (jobDescriptionSection || clone).textContent || (jobDescriptionSection || clone).innerText || '';
  
  // Better text cleaning
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/[\n\r]+/g, '\n') // Normalize line breaks
    .replace(/\n\s+/g, '\n') // Remove leading spaces after line breaks
    .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double line breaks
    .trim();

  // Extract structured information if possible (for better processing)
  const structuredData = extractStructuredData(text);
  
  // Combine structured data with full text, prioritizing the structured data
  if (Object.keys(structuredData).length > 0) {
    // Create a structured format that's more useful for processing
    const formattedText = formatStructuredData(structuredData, text, maxLength);
    return formattedText;
  }

  // If no structured data, just return the cleaned text with a length limit
  return text.length > maxLength ? text.substring(0, maxLength) + '... [Truncated]' : text;
}

// Enhanced function to find the most relevant job description section
function findJobDescriptionSection(element) {
  // First try specific selectors for the current site
  const isLinkedIn = window.location.href.includes('linkedin.com');
  const isIndeed = window.location.href.includes('indeed.com');

  // Use platform-specific selectors first
  if (isLinkedIn) {
    for (const selector of LINKEDIN_SELECTORS.description) {
      const found = element.querySelector(selector);
      if (found) return found;
    }
  } else if (isIndeed) {
    for (const selector of INDEED_SELECTORS.description) {
      const found = element.querySelector(selector);
      if (found) return found;
    }
  }
  
  // Fall back to generic selectors
  const fallbackSelectors = [
    // Generic selectors that might contain job descriptions
    '[id*="description"]',
    '[id*="job-description"]',
    '[class*="description"]',
    '[class*="job-description"]',
    'article',
    'main',
    // LinkedIn-specific fallbacks
    '.jobs-box__html-content',
    '.jobs-description',
    // Indeed-specific fallbacks
    '.jobsearch-jobDescriptionText'
  ];
  
  for (const selector of fallbackSelectors) {
    const found = element.querySelector(selector);
    if (found) return found;
  }
  
  return null;
}

// Enhanced structured data extraction function
function extractStructuredData(text) {
  const data = {};
  
  // Try to extract direct information from the DOM first (done in getPageContent)
  
  // Fallback: Common patterns for job description fields
  const patterns = {
    position: /(?:job title|position|role|title|job position)\s*:?\s*([^\n]+)/i,
    company: /(?:company|organization|employer)\s*:?\s*([^\n]+)/i,
    location: /(?:location|place|city|address)\s*:?\s*([^\n]+)/i,
    salary: /(?:salary|compensation|pay|wage)\s*:?\s*([^\n]+)/i,
    jobType: /(?:job type|employment type|work type)\s*:?\s*([^\n]+)/i,
    description: /(?:description|overview|about the job|about the role|responsibilities|duties)\s*:?\s*([\s\S]+?)(?=\n\s*(?:requirements|qualifications|skills|experience|about you|who you are|what you'll need|education)|$)/i,
    qualifications: /(?:requirements|qualifications|skills required|skills needed|experience|about you|who you are|what you'll need|education)\s*:?\s*([\s\S]+?)(?=\n\s*(?:benefits|perks|what we offer|why join us|about us|about the company)|$)/i,
    benefits: /(?:benefits|perks|what we offer|why join us)\s*:?\s*([\s\S]+?)(?=\n\s*(?:about us|about the company|apply|how to apply)|$)/i
  };
  
  // Try to extract patterns
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data[key] = match[1].trim();
    }
  }
  
  return data;
}

// Function to format structured data with full text backup
function formatStructuredData(data, fullText, maxLength) {
  // Start with a higher-level structured format
  let result = '';
  
  // Add known structured data
  if (data.position) result += `Position: ${data.position}\n`;
  if (data.company) result += `Company: ${data.company}\n`;
  if (data.location) result += `Location: ${data.location}\n`;
  if (data.salary) result += `Salary: ${data.salary}\n`;
  if (data.jobType) result += `Job Type: ${data.jobType}\n\n`;
  
  // Add description and qualifications which are the most important
  if (data.description) {
    result += `Job Description:\n${data.description}\n\n`;
  }
  
  if (data.qualifications) {
    result += `Qualifications:\n${data.qualifications}\n\n`;
  }
  
  if (data.benefits) {
    result += `Benefits:\n${data.benefits}\n\n`;
  }
  
  // If the structured format is too short, add some of the full text to provide context
  // but prioritize the structured data we've already extracted
  if (result.length < 100 && fullText.length > 0) {
    let remainingSpace = maxLength - result.length;
    if (remainingSpace > 100) {
      result += `Additional Information:\n${fullText.substring(0, remainingSpace)}`;
    }
  }
  
  // Ensure we don't exceed maximum length
  if (result.length > maxLength) {
    result = result.substring(0, maxLength) + '... [Truncated]';
  }
  
  return result;
}

// Enhanced function to extract relevant job description content from the page
function getPageContent() {
  const isLinkedIn = window.location.href.includes('linkedin.com');
  const isIndeed = window.location.href.includes('indeed.com');
  
  let content = '';
  let structuredData = {};

  // Extract structured data from DOM elements
  if (isLinkedIn) {
    // For LinkedIn, try to extract structured info from UI elements first
    const position = extractFromSelectors(LINKEDIN_SELECTORS.jobTitle, document);
    const company = extractFromSelectors(LINKEDIN_SELECTORS.company, document);
    const location = extractFromSelectors(LINKEDIN_SELECTORS.location, document);
    
    structuredData = {
      position: position || '',
      company: company || '',
      location: location || ''
    };
    
    // Extract description content
    const jobDescriptionElement = document.querySelector('.jobs-description-content__text') || 
                               document.querySelector('.show-more-less-html__markup') || 
                               document.querySelector('.description__text') || 
                               document.querySelector('[data-test-job-description]') ||
                               document.querySelector('main');
                               
    content = cleanAndLimitContent(jobDescriptionElement);
  } 
  // Check if on Indeed
  else if (isIndeed) {
    const position = extractFromSelectors(INDEED_SELECTORS.jobTitle, document);
    const company = extractFromSelectors(INDEED_SELECTORS.company, document);
    const location = extractFromSelectors(INDEED_SELECTORS.location, document);
    
    structuredData = {
      position: position || '',
      company: company || '',
      location: location || ''
    };
    
    const jobDescriptionElement = document.querySelector('#jobDescriptionText') || 
                               document.querySelector('.jobsearch-JobComponent-description') || 
                               document.querySelector('main');
    content = cleanAndLimitContent(jobDescriptionElement);
  }

  // Fallback: If no specific element is found, use the main content or body
  if (!content) {
    const mainContent = document.querySelector('main') || document.body;
    content = cleanAndLimitContent(mainContent);
  }

  // Combine DOM-extracted structured data with text content
  if (structuredData.position || structuredData.company) {
    let structuredContent = '';
    if (structuredData.position) structuredContent += `Position: ${structuredData.position}\n`;
    if (structuredData.company) structuredContent += `Company: ${structuredData.company}\n`;
    if (structuredData.location) structuredContent += `Location: ${structuredData.location}\n\n`;
    
    // Add the rest of the content
    structuredContent += content;
    return structuredContent;
  }

  return content;
}

// Send content to popup when requested
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  if (message.action === 'getPageContent') {
    const content = getPageContent();
    console.log('Sending page content (length):', content.length); // Log the length of the content
    sendResponse({ content });
  }
  return true; // Keep the message channel open for asynchronous response
});