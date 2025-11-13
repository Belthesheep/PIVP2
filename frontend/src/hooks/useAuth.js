import { useState, useCallback } from 'react';
import { api } from '../api';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.register(username, password);
      await api.login(username, password);
      const me = await api.getMe();
      setCurrentUser(me.data || null);
      setUsername('');
      setPassword('');
      return true;
    } catch (error) {
      alert(error.response?.data?.detail || 'Error creating user');
      return false;
    }
  }, [username, password]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    try {
      await api.login(username, password);
      const me = await api.getMe();
      setCurrentUser(me.data || null);
      setUsername('');
      setPassword('');
      return true;
    } catch (error) {
      alert(error.response?.data?.detail || 'Login failed');
      return false;
    }
  }, [username, password]);

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setCurrentUser(me.data || null);
      return me.data;
    } catch (e) {
      return null;
    }
  }, []);

  return {
    currentUser,
    setCurrentUser,
    username,
    setUsername,
    password,
    setPassword,
    handleRegister,
    handleLogin,
    handleLogout,
    loadCurrentUser,
  };
}
