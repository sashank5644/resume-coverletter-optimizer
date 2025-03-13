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

// Function to clean and limit the size of extracted content
function cleanAndLimitContent(element, maxLength = 5000) {
  if (!element) return '';

  // Remove script and style elements
  const clone = element.cloneNode(true);
  const scripts = clone.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());

  // Extract text content and clean it
  let text = clone.textContent || clone.innerText || '';
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/[\n\r]+/g, '\n') // Normalize line breaks
    .trim();

  // Limit the length to avoid payload issues
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '... [Truncated]';
  }

  return text;
}

// Function to extract relevant job description content from the page
function getPageContent() {
  let content = '';

  // Check if on LinkedIn
  if (window.location.href.includes('linkedin.com')) {
    const jobDescriptionElement = document.querySelector('.jobs-description-content__text') || 
                                 document.querySelector('.description__text') || 
                                 document.querySelector('main');
    content = cleanAndLimitContent(jobDescriptionElement);
  }
  // Check if on Indeed
  else if (window.location.href.includes('indeed.com')) {
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