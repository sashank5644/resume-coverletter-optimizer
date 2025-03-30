import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../components/AuthContext';
import ResumePreview from './ResumePreview';
import html2pdf from 'html2pdf.js';
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
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');

  // Form state for new/editing resume
  const [formData, setFormData] = useState({
    title: '',
    projects: '', // Changed from content to projects
    skills: '',
    education: '',
    experience: ''
  });

  // Advanced PDF download function using html2pdf.js
  const downloadAsPDF = () => {
    setPdfLoading(true);
    const resumeElement = document.querySelector('.resume-preview');
    const filename = `${formData.title || 'Resume'}.pdf`;
    
    const options = {
      margin: -5,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf()
      .set(options)
      .from(resumeElement)
      .save()
      .then(() => {
        setPdfLoading(false);
      })
      .catch(err => {
        console.error('Error generating PDF:', err);
        setPdfLoading(false);
        window.print();
      });
  };

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
    if (jobDesc) {
      setJobDescription(decodeURIComponent(jobDesc));
    }
    if (resumeId) {
      if (!isValidObjectId(resumeId)) {
        setErrorMsg('Invalid resume ID format.');
        navigate('/resumes', { replace: true });
        return;
      }
      fetchResumes(resumeId);
    } else {
      fetchResumes();
    }
  }, [token, navigate]);

  const fetchResumes = async (resumeIdToSelect = null) => {
    setLoading(true);
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Authentication token not found. Please log in.');
      navigate('/login');
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/api/resumes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setResumes(res.data);
      if (resumeIdToSelect) {
        const selectedResume = res.data.find(r => r._id === resumeIdToSelect);
        if (selectedResume) {
          handleSelectResume(selectedResume._id);
        } else {
          setErrorMsg('Selected resume not found.');
          navigate('/resumes', { replace: true });
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
    const selected = resumes.find(r => r._id === resumeId);
    if (!selected) {
      setErrorMsg('Selected resume not found in current list.');
      setCurrentResume(null);
      setFormData({
        title: '',
        projects: '',
        skills: '',
        education: '',
        experience: ''
      });
      return;
    }
  
    setCurrentResume(selected);
    setFormData({
      title: selected.title,
      // Handle both projects (new format) and content (old format) for backward compatibility
      projects: selected.projects && Array.isArray(selected.projects)
        ? selected.projects.map(proj => `${proj.name}, ${proj.date}\n${proj.description}`).join('\n\n')
        : selected.content || '', // Fallback to content if projects is not available
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
      projects: '', // Changed from content to projects
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
      // Validate title
      if (!formData.title.trim()) {
        setErrorMsg('Resume title is required.');
        return;
      }
  
      // Parse skills
      const skills = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
  
      // Parse education
      const education = formData.education.split('\n')
        .filter(line => line.trim())
        .map(edu => {
          const parts = edu.split(',').map(item => item.trim());
          const degree = parts[0] || 'Not specified';
          const institution = parts[1] || 'Not specified';
          const year = parts[2] || 'Not specified';
          return { degree, institution, year };
        });
  
      // Parse experience
      const experience = [];
      const expEntries = formData.experience.split('\n\n');
      for (const entry of expEntries) {
        if (!entry.trim()) continue;
        const lines = entry.split('\n');
        const firstLine = lines[0].split(',').map(item => item.trim());
        const position = firstLine[0] || 'Not specified';
        const company = firstLine[1] || 'Not specified';
        const period = firstLine[2] || 'Not specified';
        const description = lines.slice(1).join('\n').trim() || 'No description provided';
        experience.push({ position, company, period, description });
      }
  
      // Parse projects
      const projects = [];
      const projEntries = formData.projects.split('\n\n');
      for (const entry of projEntries) {
        if (!entry.trim()) continue;
        const lines = entry.split('\n');
        const firstLine = lines[0].split(',').map(item => item.trim());
        const name = firstLine[0] || 'Untitled Project';
        const date = firstLine[1] || 'Not specified';
        const description = lines.slice(1).join('\n').trim() || 'No description provided';
        projects.push({ name, date, description });
      }
  
      const resumeData = {
        title: formData.title,
        projects,
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
      setErrorMsg(err.response?.data?.error || 'Error saving resume. Please check your input and try again.');
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

      setDeleting(true);
      try {
        await axios.delete(`${API_BASE_URL}/api/resumes/${currentResume._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSuccessMsg('Resume deleted successfully');
        setCurrentResume(null);
        setFormData({
          title: '',
          projects: '', // Changed from content to projects
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
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleOptimize = async () => {
    if (!currentResume) {
      setErrorMsg('Please select a resume to optimize.');
      return;
    }
  
    if (!formData.projects.trim()) {
      setErrorMsg('Please add projects to your resume before optimizing.');
      return;
    }
  
    if (!jobDescription.trim()) {
      setErrorMsg('Please enter a job description to optimize your resume.');
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
        resumeProjects: formData.projects,
        resumeSkills: formData.skills,
        jobDescription
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setFormData({
        ...formData,
        projects: res.data.projects,
        skills: res.data.skills.join(', ')
      });
      
      setSuccessMsg('Resume optimized successfully');
    } catch (err) {
      console.error('Optimization error:', err.response?.data || err.message);
      setErrorMsg(err.response?.data?.error || 'Failed to optimize resume. Please try again.');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };

  if (loading) {
    return <div className="loading">Loading resumes...</div>;
  }

  return (
    <div className="resume-builder-container">
      <h1>RESUME BUILDER</h1>
      
      {errorMsg && <div className="alert-error">{errorMsg}</div>}
      {successMsg && <div className="alert-success">{successMsg}</div>}
      
      <div className="resume-builder-layout">
        <div className="left-column">
          <div className="resume-sidebar">
            <button className="create-resume-btn" onClick={handleCreateNew}>
              CREATE NEW RESUME
            </button>
            
            <h3>YOUR RESUMES</h3>
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
              <p className="no-resumes">No resumes yet. Create your first one!</p>
            )}
          </div>
          
          <div className="resume-editor">
            <div className="editor-section">
              <h3>RESUME TITLE</h3>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Software Developer Resume"
                className="editor-input"
              />
            </div>
            
            <div className="editor-section">
              <h3>PROJECTS (SEPARATE ENTRIES WITH BLANK LINE)</h3>
              <textarea
                name="projects" // Changed from content to projects
                rows="3"
                value={formData.projects}
                onChange={handleChange}
                placeholder="Scalable Event-Driven Data Pipeline, 2023\nDesigned a Kafka-based streaming pipeline..."
                className="editor-textarea"
              ></textarea>
              <small>Format: Project Name, Date<br/>Description</small>
            </div>
            
            <div className="editor-section">
              <h3>SKILLS (COMMA SEPARATED)</h3>
              <textarea
                name="skills"
                rows="2"
                value={formData.skills}
                onChange={handleChange}
                placeholder="JavaScript, React, Node.js, MongoDB..."
                className="editor-textarea"
              ></textarea>
            </div>
            
            <div className="editor-section">
              <h3>EDUCATION (ONE PER LINE)</h3>
              <textarea
                name="education"
                rows="2"
                value={formData.education}
                onChange={handleChange}
                placeholder="B.S. Computer Science, University of Example, 2020"
                className="editor-textarea"
              ></textarea>
              <small>Format: Degree, Institution, Year</small>
            </div>
            
            <div className="editor-section">
              <h3>EXPERIENCE (SEPARATE ENTRIES WITH BLANK LINE)</h3>
              <textarea
                name="experience"
                rows="3"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Software Developer, Example Corp, 2020-2022\nLed development of customer-facing web application using React and Node.js."
                className="editor-textarea"
              ></textarea>
              <small>Format: Position, Company, Period<br/>Description</small>
            </div>
            
            <div className="resume-actions">
              <button type="button" className="btn-primary" onClick={handleSubmit}>
                {currentResume ? 'Update' : 'Create'} Resume
              </button>
              
              {currentResume && (
                <button type="button" className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}

              {currentResume && (
                <button type="button" className="btn-optimize" onClick={handleOptimize} disabled={optimizing}>
                  {optimizing ? 'Optimizing...' : 'Optimize'}
                </button>
              )}
            </div>
            
            {currentResume && (
              <div className="optimize-section">
                <h3>AI Resume Optimization</h3>
                <p>Paste job description below to optimize your resume</p>
                
                <div className="editor-section">
                  <textarea
                    id="jobDescription"
                    rows="2"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here..."
                    className="editor-textarea"
                  ></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="resume-preview-container">
          <div className="preview-header">
            <h3>RESUME PREVIEW</h3>
            
            <div className="template-selector">
              <select 
                value={selectedTemplate} 
                onChange={handleTemplateChange}
                className="template-dropdown"
                aria-label="Select resume template"
              >
                <option value="classic">LaTeX Classic</option>
                <option value="modern">LaTeX Modern</option>
                <option value="minimal">LaTeX Minimal</option>
              </select>
            </div>
            
            <button 
              className="btn-download" 
              onClick={downloadAsPDF}
              disabled={pdfLoading}
              title="Download as PDF"
            >
              {pdfLoading ? (
                <span>Generating...</span>
              ) : (
                <>
                  <i className="download-icon"></i>
                  Download PDF
                </>
              )}
            </button>
          </div>
          <div className="preview-wrapper">
            <ResumePreview formData={formData} templateStyle={selectedTemplate} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;