import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';

const Navbar = ({ user, setUser }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Resume Optimizer</Link>
      </div>

      <div className="navbar-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
        {user ? (
          <>
            <Link to="/" className="navbar-item">Dashboard</Link>
            <Link to="/resumes" className="navbar-item">Resume Builder</Link>
            <Link to="/jobs" className="navbar-item">Job Tracker</Link>
            <button onClick={logout} className="navbar-item logout-btn">Logout</button>
            <div className="navbar-user">
              <span>Welcome, {user.name}</span>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-item">Login</Link>
            <Link to="/register" className="navbar-item">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;