import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styling/ResumeBuilder.css';

const ResumeBuilder = ({ user }) => {
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

  // Load resumes on component mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const res = await axios.get('/api/resumes');
      setResumes(res.data);
    } catch (err) {
      console.error('Error loading resumes:', err);
      const errorMessage = err.response?.data?.error || 
        err.response?.statusText ||
        'Failed to load resumes. Please try again later.';
      setErrorMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = (resumeId) => {
    const selected = resumes.find(r => r._id === resumeId);
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
    
    try {
      // Parse skills, education and experience
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
        // Update existing resume - now using REST-style URL
        await axios.put(`/api/resumes/${currentResume._id}`, resumeData);
        setSuccessMsg('Resume updated successfully');
      } else {
        // Create new resume
        await axios.post('/api/resumes', resumeData);
        setSuccessMsg('Resume created successfully');
      }
      
      fetchResumes();
    } catch (err) {
      console.error('Resume save error:', err);
      setErrorMsg(err.response?.data?.error || 'Error saving resume');
    }
  };
  
  // Update handleDelete to use the new REST endpoint
  const handleDelete = async () => {
    if (!currentResume) return;
    
    if (window.confirm('Are you sure you want to delete this resume?')) {
      try {
        await axios.delete(`/api/resumes/${currentResume._id}`);
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
        console.error('Resume deletion error:', err);
        setErrorMsg(err.response?.data?.error || 'Failed to delete resume');
      }
    }
  };

  const handleOptimize = async () => {
    if (!currentResume || !jobDescription.trim()) {
      setErrorMsg('Please select a resume and enter a job description');
      return;
    }
    
    setOptimizing(true);
    setErrorMsg('');
    
    try {
      const res = await axios.post('http://localhost:3000/api/ai/optimize-resume', {
        resumeContent: formData.content,
        resumeSkills: formData.skills,
        jobDescription
      });
      
      setFormData({
        ...formData,
        content: res.data.content,
        skills: res.data.skills.join(', ')
      });
      
      setSuccessMsg('Resume optimized successfully');
    } catch (err) {
      setErrorMsg('Failed to optimize resume');
      alert(err);
      console.error(err);
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
              placeholder="Software Developer, Example Corp, 2020-2022
Led development of customer-facing web application using React and Node.js."
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
        
        {currentResume && (
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
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;