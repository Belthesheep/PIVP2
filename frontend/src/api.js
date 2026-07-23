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
  getPosts: (tag = null, userId = null, mostRelevant = true) => 
    axios.get(`${API_BASE}/posts`, { params: { tag, user_id: userId, most_relevant: mostRelevant } }),
  
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
    axios.get(`${API_BASE}/tags`),
  
  getTagsWithThumbnails: () =>
    axios.get(`${API_BASE}/tags/with-thumbnails`),
  
  // Reports (Admin only)
  getReportSummary: () =>
    axios.get(`${API_BASE}/reports/summary`),
  
  getActivityReport: (period = 'day') =>
    axios.get(`${API_BASE}/reports/activity`, { params: { period } }),
  
  getPostsReport: () =>
    axios.get(`${API_BASE}/reports/posts`),
  
  getPoolsReport: () =>
    axios.get(`${API_BASE}/reports/pools`),
  
  getTagsReport: (limit = 20) =>
    axios.get(`${API_BASE}/reports/tags`, { params: { limit } }),
  
  getTopUploadersReport: (limit = 10) =>
    axios.get(`${API_BASE}/reports/top-uploaders`, { params: { limit } }),
  
  getActivityLog: (limit = 100, actionType = null) =>
    axios.get(`${API_BASE}/reports/activity-log`, { params: { limit, action_type: actionType } }),
  
  // Report Exports
  exportReportCSV: (reportType = 'summary') =>
    axios.get(`${API_BASE}/reports/export/csv`, { params: { report_type: reportType }, responseType: 'blob' }),
  
  exportReportJSON: (reportType = 'summary') =>
    axios.get(`${API_BASE}/reports/export/json`, { params: { report_type: reportType }, responseType: 'blob' }),
  
  exportReportPDF: (reportType = 'summary') =>
    axios.get(`${API_BASE}/reports/export/pdf`, { params: { report_type: reportType }, responseType: 'blob' }),
  
  // Terms & Conditions
  getCurrentTOS: () =>
    axios.get(`${API_BASE}/tos/current`),
  
  getTOSHistory: () =>
    axios.get(`${API_BASE}/tos/history`),
  
  getTOSVersion: (versionId) =>
    axios.get(`${API_BASE}/tos/${versionId}`),
  
  createTOS: (content, version) =>
    axios.post(`${API_BASE}/tos`, { content, version }, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Admin functions
  listUsers: (limit = 100) =>
    axios.get(`${API_BASE}/admin/users`, { params: { limit } }),
  
  getUserDetails: (userId) =>
    axios.get(`${API_BASE}/admin/users/${userId}`),
  
  updateUserRole: (userId, isAdmin) =>
    axios.put(`${API_BASE}/admin/users/${userId}/role`, { is_admin: isAdmin }),
  
  deletePostAdmin: (postId) =>
    axios.delete(`${API_BASE}/admin/posts/${postId}`),
  
  deletePoolAdmin: (poolId) =>
    axios.delete(`${API_BASE}/admin/pools/${poolId}`),
  
  deleteUserAdmin: (userId) =>
    axios.delete(`${API_BASE}/admin/users/${userId}`),
  
  getAdminActivityLog: (limit = 100) =>
    axios.get(`${API_BASE}/admin/activity-log`, { params: { limit } }),
  
  // Deleted content (moderation)
  getDeletedPosts: (limit = 100) =>
    axios.get(`${API_BASE}/admin/deleted/posts`, { params: { limit } }),
  
  getDeletedPools: (limit = 100) =>
    axios.get(`${API_BASE}/admin/deleted/pools`, { params: { limit } }),
  
  getDeletedUsers: (limit = 100) =>
    axios.get(`${API_BASE}/admin/deleted/users`, { params: { limit } }),
  
  // Restore content (moderation)
  restorePost: (postId) =>
    axios.post(`${API_BASE}/admin/restore/post/${postId}`),
  
  restorePool: (poolId) =>
    axios.post(`${API_BASE}/admin/restore/pool/${poolId}`),
  
  restoreUser: (userId) =>
    axios.post(`${API_BASE}/admin/restore/user/${userId}`),
};

// Named exports for convenience
export const listTagsWithThumbnails = async () => {
  const response = await api.getTagsWithThumbnails();
  return response.data;
};