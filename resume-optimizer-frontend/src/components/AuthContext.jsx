import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null); // Initialize from localStorage
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    //console.log('Initial token from localStorage:', storedToken); // Debug log
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUser();
    } else {
      //console.log('No token found in localStorage, user not logged in');
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/users/me`);
      setUser(response.data);
      //console.log('User fetched successfully:', response.data); // Debug log
    } catch (err) {
      console.error('Failed to fetch user on refresh:', err.response?.data || err.message);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      //console.log('Login request to:', `${apiUrl}/api/users/login`, { email, password }); // Debug log
      const response = await axios.post(`${apiUrl}/api/users/login`, { email, password });
      const newToken = response.data.token;
      //console.log('Login successful, new token:', newToken); // Debug log
      localStorage.setItem('token', newToken);
      setToken(newToken); // Update token in context
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      await fetchUser();
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      throw err; // Re-throw to be caught by the caller
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null); // Clear token in context
    axios.defaults.headers.common['Authorization'] = '';
    setUser(null);
    console.log('Logged out, token cleared'); // Debug log
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};