import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, logout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout(); // Use the logout function from AuthContext
    setMenuOpen(false); // Close the mobile menu on logout
    navigate('/login');
  };

  // Close menu when clicking a link
  const handleNavClick = () => {
    setMenuOpen(false);
  };

  // Check if the current path matches the nav item
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Resume Optimizer</Link>
      </div>

      <div 
        className={`navbar-mobile-toggle ${menuOpen ? 'active' : ''}`} 
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
        {user ? (
          <>
            <Link 
              to="/" 
              className={`navbar-item ${isActive('/') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              Dashboard
            </Link>
            <Link 
              to="/resumes" 
              className={`navbar-item ${isActive('/resumes') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              Resume Builder
            </Link>
            <Link 
              to="/jobs" 
              className={`navbar-item ${isActive('/jobs') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              Job Tracker
            </Link>
            <button 
              onClick={handleLogout} 
              className="navbar-item logout-btn"
            >
              Logout
            </button>
            <div className="navbar-user">
              <span>Welcome, {user.name}</span>
            </div>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className={`navbar-item ${isActive('/login') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className={`navbar-item ${isActive('/register') ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;