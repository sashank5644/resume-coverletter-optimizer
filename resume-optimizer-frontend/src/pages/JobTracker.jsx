import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styling/JobTracker.css';

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
  const [newInterview, setNewInterview] = useState({ date: '', type: 'Phone', notes: '' });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }
        const response = await axios.get('/api/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('API Response for jobs:', response.data);
        setJobs(response.data || []);
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

    const urlParams = new URLSearchParams(window.location.search);
    const jobDescription = urlParams.get('jobDescription');
    const position = urlParams.get('position');
    const company = urlParams.get('company');
    const appliedDate = urlParams.get('appliedDate');

    if (jobDescription) {
      try {
        setFormData(prev => ({
          ...prev,
          position: decodeURIComponent(position || 'Unknown Position'),
          company: decodeURIComponent(company || 'Unknown Company'),
          appliedDate: appliedDate || new Date().toISOString().split('T')[0],
          jobDescription: decodeURIComponent(jobDescription) || prev.jobDescription,
          status: 'Applied'
        }));
      } catch (decodeError) {
        console.error('Error decoding URL parameters:', decodeError);
        setErrorMsg('Invalid job description format in URL. Please check the link.');
      }
    }
  }, []);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/resumes', {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    setNewInterview({ date: '', type: 'Phone', notes: '' }); // Reset interview form
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
    setNewInterview({ date: '', type: 'Phone', notes: '' });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleInterviewChange = (e) => {
    setNewInterview({
      ...newInterview,
      [e.target.name]: e.target.value
    });
  };

  const handleAddInterview = async () => {
    if (!newInterview.date) {
      setErrorMsg('Interview date is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/jobs/${currentJob._id}`, {
        interviews: [...(currentJob.interviews || []), {
          date: new Date(newInterview.date).toISOString(),
          type: newInterview.type,
          notes: newInterview.notes
        }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('Interview added successfully');
      setJobs(jobs.map(job => job._id === currentJob._id ? response.data : job));
      setNewInterview({ date: '', type: 'Phone', notes: '' });
    } catch (err) {
      console.error('Error adding interview:', err);
      setErrorMsg('Failed to add interview: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

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
    if (!formData.url.trim()) {
      setErrorMsg('Job Posting URL is required');
      return;
    }
    if (!formData.contactEmail.trim()) {
      setErrorMsg('Contact Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setErrorMsg('Please enter a valid Contact Email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const jobData = {
        position: formData.position,
        company: formData.company,
        location: formData.location,
        status: formData.status,
        appliedDate: formData.appliedDate,
        jobDescription: formData.jobDescription,
        notes: formData.notes,
        resumeUsed: formData.resumeUsed,
        contactInfo: {
          name: formData.contactName,
          email: formData.contactEmail
        },
        url: formData.url
      };

      console.log('Submitting job data to backend:', jobData);

      if (currentJob) {
        const response = await axios.put(`/api/jobs/${currentJob._id}`, jobData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Job application updated successfully');
        setJobs(jobs.map(job => job._id === currentJob._id ? response.data : job));
      } else {
        const response = await axios.post('/api/jobs', jobData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Job application added successfully');
        setJobs([response.data, ...jobs]);
      }

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
      setCurrentJob(null);
    } catch (err) {
      console.error('Error saving job application:', err.response?.data || err.message);
      setErrorMsg('Failed to save job application: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async () => {
    if (!currentJob) return;

    if (window.confirm('Are you sure you want to delete this job application?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/jobs/${currentJob._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccessMsg('Job application deleted successfully');
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
        setErrorMsg('Failed to delete job application');
      }
    }
  };

  const generateCoverLetter = async () => {
    if (!currentJob) return;

    try {
      const token = localStorage.getItem('token');
      let resumeContent = '';
      if (formData.resumeUsed) {
        const selectedResume = availableResumes.find(r => r._id === formData.resumeUsed);
        if (selectedResume) {
          resumeContent = selectedResume.content;
        }
      }

      const res = await axios.post('/api/ai/generate-cover-letter', {
        position: formData.position,
        company: formData.company,
        jobDescription: formData.jobDescription,
        resumeContent: resumeContent,
        userName: user?.name || 'Job Applicant'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const coverLetterWindow = window.open('', '_blank');
      coverLetterWindow.document.write(`
        <html>
          <head>
            <title>Cover Letter - ${formData.position} at ${formData.company}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { text-align: center; }
              .content { white-space: pre-wrap; }
              .actions { margin-top: 20px; text-align: center; }
              .actions button { padding: 10px 15px; background-color: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 0 5px; }
              .actions button:hover { background-color: #3367d6; }
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

  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter(job => job.status === filterStatus);

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
              required
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
                required
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
          
          {currentJob && (
            <div className="form-group">
              <h3>Interviews</h3>
              {currentJob.interviews && currentJob.interviews.length > 0 ? (
                <ul>
                  {currentJob.interviews.map((interview, index) => (
                    <li key={index}>
                      {new Date(interview.date).toLocaleDateString()} - {interview.type}: {interview.notes}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No interviews recorded.</p>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="interviewDate">Date</label>
                  <input
                    type="date"
                    id="interviewDate"
                    name="date"
                    value={newInterview.date}
                    onChange={handleInterviewChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="interviewType">Type</label>
                  <select
                    id="interviewType"
                    name="type"
                    value={newInterview.type}
                    onChange={handleInterviewChange}
                  >
                    <option value="Phone">Phone</option>
                    <option value="Video">Video</option>
                    <option value="In-person">In-person</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="interviewNotes">Notes</label>
                <textarea
                  id="interviewNotes"
                  name="notes"
                  rows="2"
                  value={newInterview.notes}
                  onChange={handleInterviewChange}
                  placeholder="Add notes about the interview..."
                ></textarea>
              </div>
              <button type="button" className="btn-primary" onClick={handleAddInterview}>
                Add Interview
              </button>
            </div>
          )}
          
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