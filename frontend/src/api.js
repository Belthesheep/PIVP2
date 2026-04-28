import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const api = {
  // Auth
  register: (username, email, password) => 
    axios.post(`${API_BASE}/auth/register`, { username, email, password }),
  
  login: (usernameOrEmail, password) => 
    axios.post(`${API_BASE}/auth/login`, { username_or_email: usernameOrEmail, password }),
  
  logout: () => 
    axios.post(`${API_BASE}/auth/logout`),
  
  getMe: () => 
    axios.get(`${API_BASE}/auth/me`),
  
  // Password Recovery
  requestPasswordReset: (email) =>
    axios.post(`${API_BASE}/auth/request-password-reset`, { email }),
  
  validateResetToken: (token) =>
    axios.post(`${API_BASE}/auth/validate-reset-token`, { token }),
  
  resetPassword: (token, newPassword) =>
    axios.post(`${API_BASE}/auth/reset-password`, { token, new_password: newPassword }),
  
  // Users
  getUsers: () => 
    axios.get(`${API_BASE}/users`),
  
  // Posts
  getPosts: (tag = null, userId = null) => 
    axios.get(`${API_BASE}/posts`, { params: { tag, user_id: userId } }),
  
  getPost: (id) => 
    axios.get(`${API_BASE}/posts/${id}`),
  
  createPost: (formData) => 
    axios.post(`${API_BASE}/posts`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deletePost: (id) => 
    axios.delete(`${API_BASE}/posts/${id}`),
  
  // Favorites
  toggleFavorite: (postId) => 
    axios.post(`${API_BASE}/posts/${postId}/favorite`),
  
  getUserFavorites: (userId) => 
    axios.get(`${API_BASE}/users/${userId}/favorites`),
  
  // Pools
  getPools: () => 
    axios.get(`${API_BASE}/pools`),
  
  getPool: (id) => 
    axios.get(`${API_BASE}/pools/${id}`),
  
  createPool: (name, description) => 
    axios.post(`${API_BASE}/pools`, { name, description }),
  
  deletePool: (id) => 
    axios.delete(`${API_BASE}/pools/${id}`),
  
  addPostToPool: (poolId, postId) => 
    axios.post(`${API_BASE}/pools/${poolId}/posts`, { post_id: postId }),
  
  removePostFromPool: (poolId, postId) => 
    axios.delete(`${API_BASE}/pools/${poolId}/posts/${postId}`),
  
  // Tags
  getTags: () => 
    axios.get(`${API_BASE}/tags`)
};