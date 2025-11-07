import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pools, setPools] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [view, setView] = useState('posts'); // 'posts', 'upload', 'login', 'register', 'post-detail', 'pools', 'pool-detail'
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);
  const [poolCarouselIndex, setPoolCarouselIndex] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  
  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [poolName, setPoolName] = useState('');
  const [poolDescription, setPoolDescription] = useState('');
  const [poolSearchQuery, setPoolSearchQuery] = useState('');
  const [showAddToPool, setShowAddToPool] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [selectedTag]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showCarousel && selectedPool?.posts) {
        if (e.key === 'ArrowLeft') {
          setPoolCarouselIndex(i => Math.max(0, i - 1));
        } else if (e.key === 'ArrowRight') {
          setPoolCarouselIndex(i => Math.min(selectedPool.posts.length - 1, i + 1));
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showCarousel, selectedPool]);

  const checkAuth = async () => {
    try {
      const res = await api.getMe();
      setCurrentUser(res.data);
    } catch (error) {
      setCurrentUser(null);
    }
  };

  const loadData = async () => {
    try {
      const [postsRes, tagsRes, poolsRes] = await Promise.all([
        api.getPosts(selectedTag),
        api.getTags(),
        api.getPools()
      ]);
      setPosts(postsRes.data);
      setTags(tagsRes.data);
      setPools(poolsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await api.login(username, password);
      await checkAuth();
      setUsername('');
      setPassword('');
      setView('posts');
      loadData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.register(username, password);
      alert('Registration successful! Please login.');
      setUsername('');
      setPassword('');
      setView('login');
    } catch (error) {
      alert(error.response?.data?.detail || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setView('posts');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select an image!');
      return;
    }

    const formData = new FormData();
    formData.append('image', uploadFile);
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
      alert(error.response?.data?.detail || 'Upload failed');
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      loadData();
      if (view === 'post-detail') setView('posts');
    } catch (error) {
      alert('Error deleting post');
    }
  };

  const viewPost = async (postId) => {
    try {
      const res = await api.getPost(postId);
      setSelectedPost(res.data);
      setView('post-detail');
      // Load pools data if not already loaded
      if (pools.length === 0) {
        const poolsRes = await api.getPools();
        setPools(poolsRes.data);
      }
    } catch (error) {
      alert('Error loading post');
    }
  };

  const handleToggleFavorite = async (postId) => {
    try {
      const res = await api.toggleFavorite(postId);
      setSelectedPost(prev => ({
        ...prev,
        is_favorited: res.data.is_favorited,
        favorite_count: res.data.favorite_count
      }));
      loadData();
    } catch (error) {
      alert('Error toggling favorite');
    }
  };

  const handleCreatePool = async (e) => {
    e.preventDefault();
    try {
      await api.createPool(poolName, poolDescription);
      alert('Pool created!');
      setPoolName('');
      setPoolDescription('');
      setView('pools');
      loadData();
    } catch (error) {
      alert('Error creating pool');
    }
  };

  const viewPool = async (poolId) => {
    try {
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
      setPoolCarouselIndex(0);
      setShowCarousel(false);
      setView('pool-detail');
    } catch (error) {
      alert('Error loading pool');
    }
  };

  const handleAddToPool = async (poolId) => {
    if (!selectedPost) return;
    try {
      await api.addPostToPool(poolId, selectedPost.id);
      alert('Added to pool!');
      setShowAddToPool(false);
      setPoolSearchQuery('');
      const res = await api.getPost(selectedPost.id);
      setSelectedPost(res.data);
    } catch (error) {
      alert(error.response?.data?.detail || 'Error adding to pool');
    }
  };

  const handleRemoveFromPool = async (poolId, postId) => {
    if (!confirm('Remove from pool?')) return;
    try {
      await api.removePostFromPool(poolId, postId);
      viewPool(poolId);
    } catch (error) {
      alert('Error removing from pool');
    }
  };

  const handleDeletePool = async (poolId) => {
    if (!confirm('Delete this pool?')) return;
    try {
      await api.deletePool(poolId);
      setView('pools');
      loadData();
    } catch (error) {
      alert('Error deleting pool');
    }
  };

  return (
    <div className="app">
      <header>
        <h1>🐏 SheepBooru</h1>
        <nav>
          <button onClick={() => setView('posts')}>Browse</button>
          <button onClick={() => setView('pools')}>Pools</button>
          {currentUser && <button onClick={() => setView('upload')}>Upload</button>}
          {!currentUser && <button onClick={() => setView('login')}>Login</button>}
          {!currentUser && <button onClick={() => setView('register')}>Register</button>}
        </nav>
        <div className="user-info">
          {currentUser ? (
            <>
              <span>👤 {currentUser.username}</span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <span>Not logged in</span>
          )}
        </div>
      </header>

      <div className="container">
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="auth-form">
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Login</button>
            </form>
          </div>
        )}

        {/* REGISTER VIEW */}
        {view === 'register' && (
          <div className="auth-form">
            <h2>Register</h2>
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
              <button type="submit">Upload</button>
            </form>
          </div>
        )}

        {/* POST DETAIL VIEW */}
        {view === 'post-detail' && selectedPost && (
          <>
            <aside className="sidebar">
              <h3>Tags on this post</h3>
              <div className="tag-list">
                {selectedPost.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setView('posts');
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </aside>
            
            <div className="post-detail">
              <button className="back-btn" onClick={() => setView('posts')}>← Back to Posts</button>
              <div className="detail-content">
                <div className="detail-image">
                  <img 
                    src={`http://localhost:8000/uploads/${selectedPost.image_filename}`} 
                    alt={selectedPost.description}
                  />
                </div>
                <div className="detail-info">
                  <h2>Post #{selectedPost.id}</h2>
                  <p className="post-desc">{selectedPost.description || 'No description'}</p>
                  
                  <div className="detail-section">
                    <h3>Tags</h3>
                    <div className="post-tags">
                      {selectedPost.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Stats</h3>
                    <p>Uploaded by: {selectedPost.uploader_username}</p>
                    <p>Favorites: {selectedPost.favorite_count}</p>
                    <p>Upload date: {new Date(selectedPost.upload_date).toLocaleDateString()}</p>
                  </div>

                  <div className="detail-section">
                    <h3>Pools</h3>
                    {selectedPost.pools && selectedPost.pools.length > 0 ? (
                      <div className="pool-links">
                        {selectedPost.pools.map(pool => (
                          <button 
                            key={pool.id}
                            className="pool-link"
                            onClick={() => viewPool(pool.id)}
                          >
                            📚 {pool.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>Not in any pools</p>
                    )}
                  </div>

                  <div className="detail-actions">
                    {currentUser && (
                      <>
                        <button 
                          className={selectedPost.is_favorited ? 'btn-favorited' : 'btn-favorite'}
                          onClick={() => handleToggleFavorite(selectedPost.id)}
                        >
                          {selectedPost.is_favorited ? '★ Unfavorite' : '☆ Favorite'}
                        </button>
                        {currentUser.id === selectedPost.uploader_id && (
                          <button onClick={() => setShowAddToPool(!showAddToPool)}>
                            {showAddToPool ? 'Cancel' : 'Add to Pool'}
                          </button>
                        )}
                      </>
                    )}
                    {currentUser?.id === selectedPost.uploader_id && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDelete(selectedPost.id)}
                      >
                        Delete Post
                      </button>
                    )}
                  </div>

                  {showAddToPool && (
                    <div className="pool-selector">
                      <h4>Search for a pool:</h4>
                      <input
                        type="text"
                        placeholder="Type pool name..."
                        value={poolSearchQuery}
                        onChange={(e) => setPoolSearchQuery(e.target.value)}
                        className="pool-search-input"
                      />
                      <div className="pool-search-results">
                        {pools
                          .filter(p => p.creator_id === currentUser.id)
                          .filter(p => p.name.toLowerCase().includes(poolSearchQuery.toLowerCase()))
                          .map(pool => (
                            <button 
                              key={pool.id}
                              onClick={() => handleAddToPool(pool.id)}
                            >
                              📚 {pool.name} ({pool.post_count} posts)
                            </button>
                          ))}
                        {pools.filter(p => p.creator_id === currentUser.id && p.name.toLowerCase().includes(poolSearchQuery.toLowerCase())).length === 0 && (
                          <p className="no-results">
                            {pools.filter(p => p.creator_id === currentUser.id).length === 0 
                              ? "You haven't created any pools yet!" 
                              : "No pools match your search"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* POOLS VIEW */}
        {view === 'pools' && (
          <div className="pools-view">
            <div className="pools-header">
              <h2>All Pools</h2>
              {currentUser && (
                <button onClick={() => setView('create-pool')}>Create Pool</button>
              )}
            </div>
            <div className="pools-grid">
              {pools.map(pool => (
                <div key={pool.id} className="pool-card" onClick={() => viewPool(pool.id)}>
                  <h3>{pool.name}</h3>
                  <p>{pool.description || 'No description'}</p>
                  <div className="pool-meta">
                    <small>by {pool.creator_username}</small>
                    <small>{pool.post_count} posts</small>
                  </div>
                </div>
              ))}
              {pools.length === 0 && <p>No pools yet. Create one!</p>}
            </div>
          </div>
        )}

        {/* CREATE POOL VIEW */}
        {view === 'create-pool' && (
          <div className="upload-form">
            <h2>Create New Pool</h2>
            <form onSubmit={handleCreatePool}>
              <input
                type="text"
                placeholder="Pool name"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={poolDescription}
                onChange={(e) => setPoolDescription(e.target.value)}
                rows="4"
              />
              <button type="submit">Create Pool</button>
            </form>
            <button onClick={() => setView('pools')}>Cancel</button>
          </div>
        )}

        {/* POOL DETAIL VIEW */}
        {view === 'pool-detail' && selectedPool && (
          <div className="pool-detail">
            <button className="back-btn" onClick={() => setView('pools')}>← Back to Pools</button>
            
            <div className="pool-header">
              <div>
                <h2>{selectedPool.name}</h2>
                <p>{selectedPool.description}</p>
                <small>Created by {selectedPool.creator_username} • {selectedPool.post_count} posts</small>
              </div>
              <div className="pool-actions">
                <button onClick={() => setShowCarousel(!showCarousel)}>
                  {showCarousel ? '📋 Grid View' : '🎬 Carousel View'}
                </button>
                {currentUser?.id === selectedPool.creator_id && (
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeletePool(selectedPool.id)}
                  >
                    Delete Pool
                  </button>
                )}
              </div>
            </div>

            {showCarousel && selectedPool.posts.length > 0 ? (
              <div className="carousel">
                <button 
                  className="carousel-btn prev"
                  onClick={() => setPoolCarouselIndex(i => Math.max(0, i - 1))}
                  disabled={poolCarouselIndex === 0}
                >
                  ←
                </button>
                
                <div className="carousel-content">
                  <img 
                    src={`http://localhost:8000/uploads/${selectedPool.posts[poolCarouselIndex].image_filename}`}
                    alt="Pool post"
                  />
                  <div className="carousel-info">
                    <p>Post {poolCarouselIndex + 1} of {selectedPool.posts.length}</p>
                    <p>{selectedPool.posts[poolCarouselIndex].description}</p>
                    <div className="post-tags">
                      {selectedPool.posts[poolCarouselIndex].tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  className="carousel-btn next"
                  onClick={() => setPoolCarouselIndex(i => Math.min(selectedPool.posts.length - 1, i + 1))}
                  disabled={poolCarouselIndex === selectedPool.posts.length - 1}
                >
                  →
                </button>
              </div>
            ) : (
              <div className="posts-grid">
                {selectedPool.posts.map(post => (
                  <div key={post.id} className="post-card">
                    <img 
                      src={`http://localhost:8000/uploads/${post.image_filename}`}
                      alt={post.description}
                      onClick={() => viewPost(post.id)}
                    />
                    <div className="post-info">
                      <p className="post-desc">{post.description || 'No description'}</p>
                      <div className="post-tags">
                        {post.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      {currentUser?.id === selectedPool.creator_id && (
                        <button 
                          className="delete-btn"
                          onClick={() => handleRemoveFromPool(selectedPool.id, post.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {selectedPool.posts.length === 0 && <p>This pool is empty.</p>}
              </div>
            )}
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
                  <div key={post.id} className="post-card" onClick={() => viewPost(post.id)}>
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
                        <small>★ {post.favorite_count}</small>
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