const API_BASE_URL = 'https://resume-coverletter-optimizer.onrender.com';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Optimize Resume (not used in this flow but kept for future use)
  if (message.action === 'optimizeResume') {
    fetch(`${API_BASE_URL}/api/ai/optimize-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${message.token}`
      },
      body: JSON.stringify(message.data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          sendResponse({ success: false, error: data.error });
        } else {
          sendResponse({ success: true, data });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }

  // Generate Cover Letter (not used in this flow)
  if (message.action === 'generateCoverLetter') {
    fetch(`${API_BASE_URL}/api/ai/generate-cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${message.token}`
      },
      body: JSON.stringify(message.data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          sendResponse({ success: false, error: data.error });
        } else {
          sendResponse({ success: true, data });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }

  // Save Job Application (not used in this flow)
  if (message.action === 'saveJob') {
    fetch(`${API_BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${message.token}`
      },
      body: JSON.stringify(message.data)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          sendResponse({ success: false, error: data.error });
        } else {
          sendResponse({ success: true, data });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }

  // Suggest Skills (not used in this flow)
  if (message.action === 'suggestSkills') {
    const mockSkills = ['JavaScript', 'React', 'Node.js', 'MongoDB'];
    sendResponse({ success: true, data: { skills: mockSkills } });
    return true;
  }
});