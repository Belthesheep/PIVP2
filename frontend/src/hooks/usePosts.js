import { useState, useCallback } from 'react';
import { api } from '../api';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');

  const loadPosts = useCallback(async (tag = null, userId = null) => {
    try {
      const res = await api.getPosts(tag, userId);
      setPosts(res.data || []);
      return res.data;
    } catch (error) {
      console.error('Error loading posts:', error);
      return [];
    }
  }, []);

  const handleUpload = useCallback(async (currentUser) => {
    if (!currentUser) {
      alert('Please login or select a user first!');
      return false;
    }
    if (!uploadFile) {
      alert('Please select an image!');
      return false;
    }

    const formData = new FormData();
    formData.append('image', uploadFile);
    formData.append('uploader_id', currentUser.id);
    formData.append('description', uploadDescription);
    formData.append('tags', uploadTags);

    try {
      await api.createPost(formData);
      alert('Post uploaded successfully!');
      setUploadFile(null);
      setUploadDescription('');
      setUploadTags('');
      await loadPosts();
      return true;
    } catch (error) {
      alert(error.response?.data?.detail || 'Error uploading post');
      return false;
    }
  }, [uploadFile, uploadDescription, uploadTags, loadPosts]);

  const handleDelete = useCallback(async (postId) => {
    if (!confirm('Delete this post?')) return false;
    try {
      await api.deletePost(postId);
      await loadPosts();
      return true;
    } catch (error) {
      alert('Error deleting post');
      return false;
    }
  }, [loadPosts]);

  return {
    posts,
    setPosts,
    uploadFile,
    setUploadFile,
    uploadDescription,
    setUploadDescription,
    uploadTags,
    setUploadTags,
    loadPosts,
    handleUpload,
    handleDelete,
  };
}
