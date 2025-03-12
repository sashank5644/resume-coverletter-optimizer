import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/users/me`);
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user on refresh:', err);
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login request to:', `${apiUrl}/api/users/login`, { email, password }); // Debug log
      const response = await axios.post(`${apiUrl}/api/users/login`, { email, password });
      const token = response.data.token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await fetchUser();
    } catch (err) {
      console.error('Login error:', err.response?.data || err.message);
      throw err; // Re-throw to be caught by the caller
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    axios.defaults.headers.common['Authorization'] = '';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};