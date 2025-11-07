import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [view, setView] = useState('posts'); // 'posts', 'upload', 'register'
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedTag]);

  const loadData = async () => {
    try {
      const [postsRes, tagsRes, usersRes] = await Promise.all([
        api.getPosts(selectedTag),
        api.getTags(),
        api.getUsers()
      ]);
      setPosts(postsRes.data);
      setTags(tagsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(username, password);
      alert('User created! Now select yourself below.');
      setUsername('');
      setPassword('');
      loadData();
      setView('posts');
    } catch (error) {
      alert(error.response?.data?.detail || 'Error creating user');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please select a user first!');
      return;
    }
    if (!uploadFile) {
      alert('Please select an image!');
      return;
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
      setView('posts');
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error uploading post');
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      loadData();
    } catch (error) {
      alert('Error deleting post');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>🐏 SheepBooru</h1>
        <nav>
          <button onClick={() => setView('posts')}>Browse</button>
          <button onClick={() => setView('upload')}>Upload</button>
          <button onClick={() => setView('register')}>Register</button>
        </nav>
        <div className="user-selector">
          <label>Current User: </label>
          <select 
            value={currentUser?.id || ''} 
            onChange={(e) => setCurrentUser(users.find(u => u.id === parseInt(e.target.value)))}
          >
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="container">
        {/* REGISTER VIEW */}
        {view === 'register' && (
          <div className="register-form">
            <h2>Register New User</h2>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Username (min 3 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Register</button>
            </form>
          </div>
        )}

        {/* UPLOAD VIEW */}
        {view === 'upload' && (
          <div className="upload-form">
            <h2>Upload New Post</h2>
            {!currentUser && <p className="warning">⚠️ Select a user first!</p>}
            <form onSubmit={handleUpload}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setUploadFile(e.target.files[0])}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                required
              />
              <button type="submit" disabled={!currentUser}>Upload</button>
            </form>
          </div>
        )}

        {/* POSTS VIEW */}
        {view === 'posts' && (
          <>
            <aside className="sidebar">
              <h3>Tags</h3>
              <div className="tag-list">
                <button 
                  className={!selectedTag ? 'active' : ''}
                  onClick={() => setSelectedTag(null)}
                >
                  All Posts ({posts.length})
                </button>
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    className={selectedTag === tag.tag_name ? 'active' : ''}
                    onClick={() => setSelectedTag(tag.tag_name)}
                  >
                    {tag.tag_name} ({tag.post_count})
                  </button>
                ))}
              </div>
            </aside>

            <main className="posts-grid">
              {posts.length === 0 ? (
                <p>No posts yet. Upload some!</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} className="post-card">
                    <img 
                      src={`http://localhost:8000/uploads/${post.image_filename}`} 
                      alt={post.description || 'Post'}
                    />
                    <div className="post-info">
                      <p className="post-desc">{post.description || 'No description'}</p>
                      <div className="post-tags">
                        {post.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="post-meta">
                        <small>by {post.uploader_username}</small>
                        {currentUser?.id === post.uploader_id && (
                          <button 
                            className="delete-btn"
                            onClick={() => handleDelete(post.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default App;