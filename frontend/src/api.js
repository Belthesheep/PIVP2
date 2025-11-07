import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

// Configure axios to send cookies
axios.defaults.withCredentials = true;

export const api = {
  // Auth
  register: (username, password) => 
    axios.post(`${API_BASE}/auth/register`, { username, password }),
  
  login: (username, password) => 
    axios.post(`${API_BASE}/auth/login`, { username, password }),
  
  logout: () => 
    axios.post(`${API_BASE}/auth/logout`),
  
  getMe: () => 
    axios.get(`${API_BASE}/auth/me`),
  
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