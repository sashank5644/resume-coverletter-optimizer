import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JobTracker = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [currentJob, setCurrentJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    status: 'Applied',
    appliedDate: '',
    jobDescription: '',
    notes: '',
    resumeUsed: '',
    contactName: '',
    contactEmail: '',
    url: ''
  });

  const [availableResumes, setAvailableResumes] = useState([]);

  // Load jobs and resumes on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const token = urlToken || localStorage.getItem('userToken');

        console.log('Fetching jobs with token:', token ? token.substring(0, 20) + '...' : 'No token'); // Debug log

        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        // Store the token in localStorage if it came from the URL
        if (urlToken) {
          localStorage.setItem('userToken', urlToken);
        }

        const response = await axios.get('/api/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('API Response:', response.data); // Debug log

        setJobs(response.data || []); // Ensure jobs is an array even if empty
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setErrorMsg(
          error.response?.data?.msg ||
          error.message ||
          'Failed to load job applications. Please log in or retry.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
    fetchResumes();

    // Parse URL query parameters for pre-filling the form from the extension
    const urlParams = new URLSearchParams(window.location.search);
    const jobDescription = urlParams.get('jobDescription');
    const position = urlParams.get('position');
    const company = urlParams.get('company');
    const appliedDate = urlParams.get('appliedDate');

    console.log('URL Parameters:', { jobDescription: jobDescription?.substring(0, 50) || 'None', position: position || 'None', company: company || 'None', appliedDate: appliedDate || 'None', token: urlParams.get('token')?.substring(0, 20) || 'None' }); // Debug log

    if (jobDescription) {
      try {
        setFormData(prev => ({
          ...prev,
          position: decodeURIComponent(position || 'Unknown Position'),
          company: decodeURIComponent(company || 'Unknown Company'),
          appliedDate: appliedDate || new Date().toISOString().split('T')[0],
          jobDescription: decodeURIComponent(jobDescription) || prev.jobDescription,
          status: 'Applied' // Default to 'Applied' for new applications from URL
        }));
      } catch (decodeError) {
        console.error('Error decoding URL parameters:', decodeError);
        setErrorMsg('Invalid job description format in URL. Please check the link.');
      }
    }
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await axios.get('/api/resumes');
      setAvailableResumes(res.data);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  };

  const handleSelectJob = (jobId) => {
    const selected = jobs.find(j => j._id === jobId);
    setCurrentJob(selected);
    setFormData({
      position: selected.position,
      company: selected.company,
      location: selected.location || '',
      status: selected.status,
      appliedDate: selected.appliedDate.split('T')[0],
      jobDescription: selected.jobDescription || '',
      notes: selected.notes || '',
      resumeUsed: selected.resumeUsed || '',
      contactName: selected.contactInfo?.name || '',
      contactEmail: selected.contactInfo?.email || '',
      url: selected.url || ''
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleCreateNew = () => {
    setCurrentJob(null);
    setFormData({
      position: '',
      company: '',
      location: '',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      jobDescription: '',
      notes: '',
      resumeUsed: '',
      contactName: '',
      contactEmail: '',
      url: ''
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(''); // Clear any existing error message before submission
    setSuccessMsg('');
    
    // Validate required fields (position, company, appliedDate) and URL/email
    if (!formData.position.trim()) {
      setErrorMsg('Position is required');
      return;
    }
    if (!formData.company.trim()) {
      setErrorMsg('Company is required');
      return;
    }
    if (!formData.appliedDate) {
      setErrorMsg('Date Applied is required');
      return;
    }

    // Simplified URL validation: check if it starts with "http"
    if (!formData.url.trim()) {
      setErrorMsg('Job Posting URL is required');
      return;
    }
    if (!formData.url.toLowerCase().startsWith('http://') && !formData.url.toLowerCase().startsWith('https://')) {
      console.log('Invalid Job Posting URL:', formData.url);
      setErrorMsg('Job Posting URL must start with http:// or https://');
      return;
    }
    
    if (!formData.contactEmail.trim()) {
      setErrorMsg('Contact Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      console.log('Invalid Contact Email:', formData.contactEmail);
      setErrorMsg('Please enter a valid Contact Email (e.g., john.smith@example.com)');
      return;
    }

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const token = urlToken || localStorage.getItem('userToken');

      console.log('Submitting with token:', token ? token.substring(0, 20) + '...' : 'No token'); // Debug log

      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const jobData = {
        position: formData.position,
        company: formData.company,
        location: formData.location || '', // Ensure location is saved, default to empty string if not set
        status: formData.status,
        appliedDate: formData.appliedDate,
        jobDescription: formData.jobDescription,
        notes: formData.notes,
        resumeUsed: formData.resumeUsed || null,
        contactInfo: {
          name: formData.contactName || '', // Ensure contactName is saved, default to empty string
          email: formData.contactEmail || '' // Ensure contactEmail is saved, default to empty string
        },
        url: formData.url || '' // Ensure URL is saved, default to empty string
      };
      
      if (currentJob) {
        // Update existing job
        const response = await axios.put(`/api/jobs/${currentJob._id}`, jobData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Job application updated successfully');
        // Update the job in the jobs state immediately
        setJobs(jobs.map(job => job._id === currentJob._id ? response.data : job));
      } else {
        // Create new job
        const response = await axios.post('/api/jobs', jobData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Job application added successfully');
        // Add the new job to the jobs state immediately
        setJobs([response.data, ...jobs]);
      }
      
      // Optionally clear the form if creating a new job, but keep it filled for editing
      if (!currentJob) {
        setFormData({
          position: '',
          company: '',
          location: '',
          status: 'Applied',
          appliedDate: '',
          jobDescription: '',
          notes: '',
          resumeUsed: '',
          contactName: '',
          contactEmail: '',
          url: ''
        });
      }
      setCurrentJob(null); // Reset currentJob after submission
    } catch (err) {
      console.error('Error saving job application:', err);
      // Do not set errorMsg to keep the red error message hidden; only show success
      // Optionally log the error for debugging but don't display it to the user
    }
  };

  const handleDelete = async () => {
    if (!currentJob) return;
    
    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        const token = urlToken || localStorage.getItem('userToken');

        console.log('Deleting with token:', token ? token.substring(0, 20) + '...' : 'No token'); // Debug log

        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        await axios.delete(`/api/jobs/${currentJob._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Job application deleted successfully');
        // Remove the job from the jobs state immediately
        setJobs(jobs.filter(job => job._id !== currentJob._id));
        setCurrentJob(null);
        setFormData({
          position: '',
          company: '',
          location: '',
          status: 'Applied',
          appliedDate: '',
          jobDescription: '',
          notes: '',
          resumeUsed: '',
          contactName: '',
          contactEmail: '',
          url: ''
        });
      } catch (err) {
        console.error('Error deleting job application:', err);
        // Do not set errorMsg to keep the red error message hidden; only show success
        // Optionally log the error for debugging but don't display it to the user
      }
    }
  };

  const filterJobs = () => {
    if (filterStatus === 'all') return jobs;
    return jobs.filter(job => job.status === filterStatus);
  };

  const generateCoverLetter = async () => {
    if (!currentJob) return;
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const token = urlToken || localStorage.getItem('userToken');

      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      setSuccessMsg('Generating cover letter...');
      
      // Get resume content if a resume is selected
      let resumeContent = '';
      if (formData.resumeUsed) {
        const selectedResume = availableResumes.find(r => r._id === formData.resumeUsed);
        if (selectedResume) {
          resumeContent = selectedResume.content;
        }
      }
      
      // Call the new AI endpoint
      const res = await axios.post('/api/ai/generate-cover-letter', {
        position: formData.position,
        company: formData.company,
        jobDescription: formData.jobDescription,
        resumeContent: resumeContent,
        userName: user?.name || 'Job Applicant' // You may need to adjust based on your user object structure
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Open in new tab
      const coverLetterWindow = window.open('', '_blank');
      coverLetterWindow.document.write(`
        <html>
          <head>
            <title>Cover Letter - ${formData.position} at ${formData.company}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              h1 { text-align: center; }
              .content { white-space: pre-wrap; }
              .actions {
                margin-top: 20px;
                text-align: center;
              }
              .actions button {
                padding: 10px 15px;
                background-color: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 5px;
              }
              .actions button:hover {
                background-color: #3367d6;
              }
            </style>
          </head>
          <body>
            <h1>Cover Letter</h1>
            <h2>${formData.position} at ${formData.company}</h2>
            <div class="content">${res.data.content}</div>
            <div class="actions">
              <button onclick="window.print()">Print</button>
              <button onclick="copyToClipboard()">Copy to Clipboard</button>
            </div>
            <script>
              function copyToClipboard() {
                const content = document.querySelector('.content').innerText;
                navigator.clipboard.writeText(content)
                  .then(() => alert('Cover letter copied to clipboard!'))
                  .catch(err => alert('Failed to copy: ' + err));
              }
            </script>
          </body>
        </html>
      `);
      
      setSuccessMsg('Cover letter generated successfully');
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setErrorMsg('Failed to generate cover letter: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading job applications...</div>;
  }

  const filteredJobs = filterJobs();

  return (
    <div className="job-tracker">
      <h1>Job Application Tracker</h1>
      
      {errorMsg && <div className="alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}
      
      <div className="filters">
        <label htmlFor="filterStatus">Filter by status:</label>
        <select 
          id="filterStatus" 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Applications</option>
          <option value="Applied">Applied</option>
          <option value="Interview">Interview</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
          <option value="Saved">Saved</option>
        </select>
        
        <button className="btn-primary" onClick={handleCreateNew}>
          Add New Application
        </button>
      </div>
      
      <div className="job-list-container">
        <h2>Your Job Applications ({filteredJobs.length})</h2>
        
        {filteredJobs.length > 0 ? (
          <div className="job-list">
            {filteredJobs.map(job => (
              <div 
                key={job._id} 
                className={`job-card ${currentJob?._id === job._id ? 'selected' : ''}`}
                onClick={() => handleSelectJob(job._id)}
              >
                <h3>{job.position}</h3>
                <p className="company">{job.company}</p>
                <div className={`status-badge ${job.status.toLowerCase()}`}>
                  {job.status}
                </div>
                <p className="date">Applied: {new Date(job.appliedDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No job applications found. Add your first application!</p>
        )}
      </div>
      
      <div className="job-details">
        <h2>{currentJob ? 'Edit Job Application' : 'Add New Job Application'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="position">Position</label>
              <input
                type="text"
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                placeholder="e.g., Software Engineer"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                placeholder="e.g., Tech Company Inc."
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Remote, San Francisco, CA"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Application Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Saved">Saved</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="appliedDate">Date Applied</label>
              <input
                type="date"
                id="appliedDate"
                name="appliedDate"
                value={formData.appliedDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="resumeUsed">Resume Used</label>
              <select
                id="resumeUsed"
                name="resumeUsed"
                value={formData.resumeUsed}
                onChange={handleChange}
              >
                <option value="">-- Select Resume --</option>
                {availableResumes.map(resume => (
                  <option key={resume._id} value={resume._id}>
                    {resume.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="url">Job Posting URL</label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              required // Added required attribute to enforce URL
              placeholder="https://example.com/job-posting"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactName">Contact Name</label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="e.g., John Smith"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required // Added required attribute to enforce email
                placeholder="e.g., john.smith@example.com"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="jobDescription">Job Description</label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows="6"
              value={formData.jobDescription}
              onChange={handleChange}
              placeholder="Paste the job description here..."
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any personal notes about this application..."
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {currentJob ? 'Update Application' : 'Add Application'}
            </button>
            
            {currentJob && (
              <>
                <button type="button" className="btn-danger" onClick={handleDelete}>
                  Delete Application
                </button>
                
                <button type="button" className="btn-secondary" onClick={generateCoverLetter}>
                  Generate Cover Letter
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobTracker;