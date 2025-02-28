import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    resumeCount: 0,
    jobApplications: 0,
    interviews: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const resumeRes = await axios.get('/api/resumes/count');
        const jobStatsRes = await axios.get('/api/jobs/stats');
        const recentJobsRes = await axios.get('/api/jobs/recent');
        
        setStats({
          resumeCount: resumeRes.data.count || resumeRes.data || 0,
          jobApplications: jobStatsRes.data.totalApplications || 0,
          interviews: jobStatsRes.data.interviews || 0
        });
        
        setRecentJobs(recentJobsRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Log the specific error response for debugging
        if (err.response) {
          console.error('Error response:', err.response.data);
        }
      } finally {
        setLoading(false);
      }
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
          <p className="stat-number">{stats.resumeCount}</p>
          <Link to="/resumes" className="stat-link">Manage Resumes</Link>
        </div>
        
        <div className="stat-card">
          <h3>Job Applications</h3>
          <p className="stat-number">{stats.jobApplications}</p>
          <Link to="/jobs" className="stat-link">View Applications</Link>
        </div>
        
        <div className="stat-card">
          <h3>Interviews</h3>
          <p className="stat-number">{stats.interviews}</p>
          <Link to="/jobs" className="stat-link">Track Interviews</Link>
        </div>
      </div>
      
      <div className="dashboard-recent">
        <h2>Recent Job Applications</h2>
        {recentJobs.length > 0 ? (
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