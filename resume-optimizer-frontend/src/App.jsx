import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/ResumeBuilder';
import JobTracker from './pages/JobTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthContext } from './components/AuthContext';
import './App.css';

// Set default axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <div className="app">
        <Navbar user={user} logout={logout} />
        <div className="container">
          <Routes>
            <Route path="/" element={user ? <Dashboard user={user} /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/resumes" element={user ? <ResumeBuilder user={user} /> : <Login />} />
            <Route path="/jobs" element={user ? <JobTracker user={user} /> : <Login />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;