import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../components/AuthContext';
import '../styling/ResumeBuilder.css';

// Simple ObjectId validation (MongoDB ObjectId is a 24-character hex string)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Define API base URL using import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://resume-coverletter-optimizer.onrender.com';

const ResumeBuilder = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [currentResume, setCurrentResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state for new/editing resume
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    skills: '',
    education: '',
    experience: ''
  });

  // Load job description and resume ID from URL parameters when token is available
  useEffect(() => {
    if (!token) {
      setErrorMsg('Authentication token not found. Please log in.');
      navigate('/login');
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const jobDesc = urlParams.get('jobDescription');
    const resumeId = urlParams.get('resumeId');
    //console.log('URL Params:', { jobDesc, resumeId }); // Debug log
    if (jobDesc) {
      setJobDescription(decodeURIComponent(jobDesc)); // Populate job description from URL
    }
    if (resumeId) {
      if (!isValidObjectId(resumeId)) {
        setErrorMsg('Invalid resume ID format.');
        navigate('/resumes', { replace: true }); // Clear invalid query params
        return;
      }
      fetchResumes(resumeId); // Fetch and select the specific resume
    } else {
      fetchResumes(); // Fetch all resumes if no resumeId
    }
  }, [token, navigate]);

  const fetchResumes = async (resumeIdToSelect = null) => {
    setLoading(true);
    setErrorMsg('');
    //console.log('Fetching resumes, token:', token); // Debug log

    if (!token) {
      setErrorMsg('Authentication token not found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      //console.log('Resumes response:', res.data.map(r => ({ _id: r._id, title: r.title })));
      setResumes(res.data);
      if (resumeIdToSelect) {
        const selectedResume = res.data.find(r => r._id === resumeIdToSelect);
        if (selectedResume) {
          handleSelectResume(selectedResume._id);
        } else {
          setErrorMsg('Selected resume not found.');
          navigate('/resumes', { replace: true }); // Clear invalid query params
        }
      }
    } catch (err) {
      console.error('Error loading resumes:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.msg === 'Token is not valid' || err.response?.status === 401
        ? 'Session expired. Please log in again.'
        : err.response?.data?.error || err.response?.statusText || err.message || 'Failed to load resumes. Please try again later.';
      setErrorMsg(errorMessage);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = (resumeId) => {
    //console.log('handleSelectResume called with resumeId:', resumeId);
    //console.log('Current resumes state:', resumes.map(r => ({ _id: r._id, title: r.title })));
    const selected = resumes.find(r => r._id === resumeId);
    if (!selected) {
      setErrorMsg('Selected resume not found in current list.');
      setCurrentResume(null);
      setFormData({
        title: '',
        content: '',
        skills: '',
        education: '',
        experience: ''
      });
      return;
    }

    setCurrentResume(selected);
    setFormData({
      title: selected.title,
      content: selected.content,
      skills: selected.skills.join(', '),
      education: selected.education.map(edu => 
        `${edu.degree}, ${edu.institution}, ${edu.year}`).join('\n'),
      experience: selected.experience.map(exp => 
        `${exp.position}, ${exp.company}, ${exp.period}\n${exp.description}`).join('\n\n')
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleCreateNew = () => {
    setCurrentResume(null);
    setFormData({
      title: '',
      content: '',
      skills: '',
      education: '',
      experience: ''
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
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!token) {
      setErrorMsg('Authentication token not found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const skills = formData.skills.split(',').map(skill => skill.trim());
      const education = formData.education.split('\n')
        .filter(line => line.trim())
        .map(edu => {
          const [degree, institution, year] = edu.split(',').map(item => item.trim());
          return { degree, institution, year };
        });
      const experience = [];
      const expEntries = formData.experience.split('\n\n');
      for (const entry of expEntries) {
        if (!entry.trim()) continue;
        const lines = entry.split('\n');
        const firstLine = lines[0].split(',').map(item => item.trim());
        const position = firstLine[0];
        const company = firstLine[1];
        const period = firstLine[2];
        const description = lines.slice(1).join('\n').trim();
        experience.push({ position, company, period, description });
      }
      
      const resumeData = {
        title: formData.title,
        content: formData.content,
        skills,
        education,
        experience
      };
      
      if (currentResume) {
        await axios.put(`${API_BASE_URL}/api/resumes/${currentResume._id}`, resumeData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSuccessMsg('Resume updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/api/resumes`, resumeData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSuccessMsg('Resume created successfully');
      }
      
      fetchResumes();
    } catch (err) {
      console.error('Resume save error:', err.response?.data || err.message);
      setErrorMsg(err.response?.data?.error || 'Error saving resume');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };
  
  const handleDelete = async () => {
    if (!currentResume) return;
    
    if (window.confirm('Are you sure you want to delete this resume?')) {
      if (!token) {
        setErrorMsg('Authentication token not found. Please log in.');
        navigate('/login');
        return;
      }

      try {
        await axios.delete(`${API_BASE_URL}/api/resumes/${currentResume._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSuccessMsg('Resume deleted successfully');
        setCurrentResume(null);
        setFormData({
          title: '',
          content: '',
          skills: '',
          education: '',
          experience: ''
        });
        fetchResumes();
      } catch (err) {
        console.error('Resume deletion error:', err.response?.data || err.message);
        setErrorMsg(err.response?.data?.error || 'Failed to delete resume');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    }
  };

  const handleOptimize = async () => {
    if (!currentResume || !jobDescription.trim()) {
      setErrorMsg('Please select a resume and enter a job description');
      return;
    }
    
    if (!token) {
      setErrorMsg('Authentication token not found. Please log in.');
      navigate('/login');
      return;
    }

    setOptimizing(true);
    setErrorMsg('');
    
    try {
      const res = await axios.post(`${API_BASE_URL}/api/ai/optimize-resume`, {
        resumeContent: formData.content,
        resumeSkills: formData.skills,
        jobDescription
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setFormData({
        ...formData,
        content: res.data.content,
        skills: res.data.skills.join(', ')
      });
      
      setSuccessMsg('Resume optimized successfully');
    } catch (err) {
      console.error('Optimization error:', err.response?.data || err.message);
      setErrorMsg(err.response?.data?.error || 'Failed to optimize resume');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading resumes...</div>;
  }

  return (
    <div className="resume-builder">
      <h1>Resume Builder</h1>
      
      {errorMsg && <div className="alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}
      
      <div className="resume-sidebar">
        <button className="btn-primary" onClick={handleCreateNew}>
          Create New Resume
        </button>
        
        <h3>Your Resumes</h3>
        {resumes.length > 0 ? (
          <ul className="resume-list">
            {resumes.map(resume => (
              <li 
                key={resume._id} 
                className={currentResume?._id === resume._id ? 'active' : ''}
                onClick={() => handleSelectResume(resume._id)}
              >
                {resume.title}
              </li>
            ))}
          </ul>
        ) : (
          <p>No resumes yet. Create your first one!</p>
        )}
      </div>
      
      <div className="resume-editor">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Resume Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Software Developer Resume"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="content">Resume Content</label>
            <textarea
              id="content"
              name="content"
              rows="12"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="Enter your resume content here..."
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="skills">Skills (comma separated)</label>
            <textarea
              id="skills"
              name="skills"
              rows="3"
              value={formData.skills}
              onChange={handleChange}
              placeholder="JavaScript, React, Node.js, MongoDB..."
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="education">Education (one per line)</label>
            <textarea
              id="education"
              name="education"
              rows="3"
              value={formData.education}
              onChange={handleChange}
              placeholder="B.S. Computer Science, University of Example, 2020"
            ></textarea>
            <small>Format: Degree, Institution, Year</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="experience">Experience (separate entries with blank line)</label>
            <textarea
              id="experience"
              name="experience"
              rows="6"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Software Developer, Example Corp, 2020-2022\nLed development of customer-facing web application using React and Node.js."
            ></textarea>
            <small>Format: Position, Company, Period<br/>Description</small>
          </div>
          
          <div className="resume-actions">
            <button type="submit" className="btn-primary">
              {currentResume ? 'Update Resume' : 'Create Resume'}
            </button>
            
            {currentResume && (
              <button type="button" className="btn-danger" onClick={handleDelete}>
                Delete Resume
              </button>
            )}
          </div>
        </form>
        
        {jobDescription && !currentResume ? (
          <div className="alert-info">
            Please select a resume from the sidebar to optimize it for the extracted job description.
          </div>
        ) : (
          currentResume && (
            <div className="optimize-section">
              <h3>AI Resume Optimization</h3>
              <p>Paste a job description below to optimize your resume for this specific position</p>
              
              <div className="form-group">
                <label htmlFor="jobDescription">Job Description</label>
                <textarea
                  id="jobDescription"
                  rows="6"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                ></textarea>
              </div>
              
              <button 
                className="btn-primary" 
                onClick={handleOptimize}
                disabled={optimizing}
              >
                {optimizing ? 'Optimizing...' : 'Optimize Resume'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;