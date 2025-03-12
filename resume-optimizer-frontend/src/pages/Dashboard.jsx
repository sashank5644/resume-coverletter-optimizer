import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styling/Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    resumeCount: 0,
    jobApplications: 0,
    interviews: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({ resumes: null, stats: null, recentJobs: null });

  useEffect(() => {
    const fetchResumeCount = async () => {
      try {
        const resumeRes = await axios.get('/api/resumes/count');
        setStats(prev => ({ ...prev, resumeCount: resumeRes.data.count || 0 }));
      } catch (err) {
        console.error('Error fetching resume count:', err);
        setErrors(prev => ({ ...prev, resumes: 'Failed to load resume count.' }));
      }
    };

    const fetchJobStats = async () => {
      try {
        const jobStatsRes = await axios.get('/api/jobs/stats');
        setStats(prev => ({
          ...prev,
          jobApplications: jobStatsRes.data.totalApplications || 0,
          interviews: jobStatsRes.data.interviews || 0
        }));
      } catch (err) {
        console.error('Error fetching job stats:', err);
        setErrors(prev => ({ ...prev, stats: 'Failed to load job stats.' }));
      }
    };

    const fetchRecentJobs = async () => {
      try {
        const recentJobsRes = await axios.get('/api/jobs/recent');
        setRecentJobs(recentJobsRes.data || []);
      } catch (err) {
        console.error('Error fetching recent jobs:', err);
        setErrors(prev => ({ ...prev, recentJobs: 'Failed to load recent jobs.' }));
      }
    };

    const fetchDashboardData = async () => {
      await Promise.all([fetchResumeCount(), fetchJobStats(), fetchRecentJobs()]);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome to your Resume Optimizer Dashboard</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Resumes</h3>
          {errors.resumes ? (
            <p className="error">{errors.resumes}</p>
          ) : (
            <p className="stat-number">{stats.resumeCount}</p>
          )}
          <Link to="/resumes" className="stat-link">Manage Resumes</Link>
        </div>
        
        <div className="stat-card">
          <h3>Job Applications</h3>
          {errors.stats ? (
            <p className="error">{errors.stats}</p>
          ) : (
            <p className="stat-number">{stats.jobApplications}</p>
          )}
          <Link to="/jobs" className="stat-link">View Applications</Link>
        </div>
        
        <div className="stat-card">
          <h3>Interviews</h3>
          {errors.stats ? (
            <p className="error">{errors.stats}</p>
          ) : (
            <p className="stat-number">{stats.interviews}</p>
          )}
          <Link to="/jobs" className="stat-link">Track Interviews</Link>
        </div>
      </div>
      
      <div className="dashboard-recent">
        <h2>Recent Job Applications</h2>
        {errors.recentJobs ? (
          <p className="error">{errors.recentJobs}</p>
        ) : recentJobs.length > 0 ? (
          <div className="job-list">
            {recentJobs.map(job => (
              <div key={job._id} className="job-card">
                <h3>{job.position}</h3>
                <p className="company">{job.company}</p>
                <p className="status">Status: <span className={`status-${job.status.toLowerCase()}`}>{job.status}</span></p>
                <p className="date">Applied: {new Date(job.appliedDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No recent job applications. <Link to="/jobs">Start tracking your applications</Link></p>
        )}
      </div>
      
      <div className="dashboard-action">
        <Link to="/resumes" className="btn-primary">Create New Resume</Link>
      </div>
    </div>
  );
};

export default Dashboard;