import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api';
import './App.css';

function App() {
  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]); // toggled tags (array of tag names)
  const [tagSearch, setTagSearch] = useState(''); // search input for tags
  const [poolSearch, setPoolSearch] = useState(''); // search input for adding to pool
  const [pools, setPools] = useState([]);

  // Views: posts, upload, register, login, pools, poolDetail, postDetail
  const [view, setView] = useState('posts');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTags, setUploadTags] = useState('');

  // Detail state
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPool, setSelectedPool] = useState(null);

  // Carousel
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef();

  // quick load on mount and when selectedTag changes
  useEffect(() => {
    loadAll();
  }, [selectedTag]);

  useEffect(() => {
    // try to restore current user (session cookie)
    (async () => {
      try {
        const me = await api.getMe();
        setCurrentUser(me.data || null);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const loadAll = async () => {
    try {
      const [postsRes, tagsRes, usersRes, poolsRes] = await Promise.all([
        api.getPosts(),
        api.getTags(),
        api.getUsers(),
        api.getPools()
      ]);
      setPosts(postsRes.data || []);
      setTags(tagsRes.data || []);
      setUsers(usersRes.data || []);
      setPools(poolsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // AUTH: register, login, logout
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.register(username, password);
      // try auto-login
      await api.login(username, password);
      const me = await api.getMe();
      setCurrentUser(me.data || null);
      setUsername('');
      setPassword('');
      setView('posts');
      loadAll();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error creating user');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await api.login(username, password);
      const me = await api.getMe();
      setCurrentUser(me.data || null);
      setUsername('');
      setPassword('');
      setView('posts');
      loadAll();
    } catch (error) {
      alert(error.response?.data?.detail || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setCurrentUser(null);
  };

  // UPLOAD
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login or select a user first!');
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
      loadAll();
    } catch (error) {
      alert(error.response?.data?.detail || 'Error uploading post');
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      loadAll();
      // if deleted while viewing detail, go back
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setView('posts');
      }
    } catch (error) {
      alert('Error deleting post');
    }
  };

  // POST DETAIL
  const openPost = async (postId) => {
    try {
      const res = await api.getPost(postId);
      const post = res.data;
      // determine if current user has favorited this post
      let favorited = false;
      if (currentUser) {
        try {
          const favs = await api.getUserFavorites(currentUser.id);
          favorited = (favs.data || []).some(f => f.post_id === postId || f.id === postId);
        } catch (e) {
          // ignore
        }
      }
      setSelectedPost({ ...post, _favorited: favorited });
      setView('postDetail');
    } catch (error) {
      alert('Error loading post');
    }
  };

  const toggleFavorite = async (postId) => {
    if (!currentUser) {
      alert('Please login to favorite posts');
      return;
    }
    try {
      const res = await api.toggleFavorite(postId);
      // the API could return updated post or status; refresh selected post if open
      if (selectedPost && selectedPost.id === postId) {
        // re-fetch full post
        const updated = await api.getPost(postId);
        const favs = await api.getUserFavorites(currentUser.id);
        const fav = (favs.data || []).some(f => f.post_id === postId || f.id === postId);
        setSelectedPost({ ...updated.data, _favorited: fav });
      }
      // refresh posts list counts
      loadAll();
      return res.data;
    } catch (error) {
      alert('Error toggling favorite');
    }
  };

  // POOLS
  const loadPools = useCallback(async () => {
    try {
      const res = await api.getPools();
      setPools(res.data || []);
    } catch (e) {
      console.error('Error loading pools', e);
    }
  }, []);

  // helper: parse tag search string into tokens (comma or space separated)
  const parseTagTokens = (s) => {
    if (!s) return [];
    return s.split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
  };

  // derived filtered posts based on selectedTags and tagSearch (AND semantics)
  const filteredPosts = posts.filter(post => {
    const postTags = (post.tags || []).map(t => String(t).toLowerCase());
    const searchTags = parseTagTokens(tagSearch);
    const toggled = (selectedTags || []).map(t => String(t).toLowerCase()).filter(Boolean);
    const required = Array.from(new Set([...searchTags, ...toggled]));
    if (required.length === 0) return true;
    return required.every(rt => postTags.includes(rt));
  });

  const handleCreatePool = async (name, description) => {
    try {
      await api.createPool(name, description);
      loadPools();
      setView('pools');
    } catch (e) {
      alert('Error creating pool');
    }
  };

  const openPool = async (poolId) => {
    try {
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
      setView('poolDetail');
    } catch (e) {
      alert('Error loading pool');
    }
  };

  const addPostToPool = async (poolId, postId) => {
    try {
      await api.addPostToPool(poolId, postId);
      // refresh pool detail
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
      alert('Post added to pool');
    } catch (e) {
      alert('Error adding post to pool');
    }
  };

  const removePostFromPool = async (poolId, postId) => {
    try {
      await api.removePostFromPool(poolId, postId);
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
    } catch (e) {
      alert('Error removing post from pool');
    }
  };

  // CAROUSEL
  useEffect(() => {
    const listener = (e) => {
      if (!carouselOpen) return;
      if (e.key === 'ArrowLeft') prevCarousel();
      if (e.key === 'ArrowRight') nextCarousel();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [carouselOpen, carouselIndex, carouselItems]);

  const openCarouselWith = (items, startIndex = 0) => {
    setCarouselItems(items || []);
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  };

  const closeCarousel = () => {
    setCarouselOpen(false);
    setCarouselItems([]);
    setCarouselIndex(0);
  };

  const prevCarousel = () => {
    setCarouselIndex(i => (i - 1 + carouselItems.length) % carouselItems.length);
  };

  const nextCarousel = () => {
    setCarouselIndex(i => (i + 1) % carouselItems.length);
  };

  // helper: when a post card is clicked in the grid
  const onPostCardClick = (post) => {
    openPost(post.id);
  };

  // small helper to find pools that contain a post (best-effort)
  const poolsContainingPost = (postId) => {
    // many API designs return pool.posts as an array of posts; support both shapes
    return pools.filter(pool => {
      if (!pool.posts) return false;
      return pool.posts.some(p => p.id === postId || p.post_id === postId);
    });
  };

  return (
    <div className="app">
      <header>
        <h1>🐏 SheepBooru</h1>
        <nav>
          <button onClick={() => { setView('posts'); }}>Browse</button>
          <button onClick={() => { setView('upload'); }}>Upload</button>
          <button onClick={() => { setView('register'); }}>Register</button>
          <button onClick={() => { setView('login'); }}>Login</button>
          <button onClick={() => { setView('pools'); }}>Pools</button>
        </nav>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {currentUser ? (
            <>
              <div>Signed in: <strong>{currentUser.username}</strong></div>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <div>Not signed in</div>
          )}
        </div>
      </header>

      <div className="container">
        {/* REGISTER VIEW */}
        {view === 'register' && (
          <div className="auth-form">
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

        {/* UPLOAD VIEW */}
        {view === 'upload' && (
          <div className="upload-form">
            <h2>Upload New Post</h2>
            {!currentUser && <p className="warning">⚠️ Please login first!</p>}
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

        {/* Sidebar (show for browsing and detail views) */}
        {(view !== 'register' && view !== 'login' && view !== 'upload') && (
          <aside className="sidebar">
            <h3>Tags</h3>
            <div style={{ marginBottom: 8 }}>
              <input
                placeholder="Search tags (comma or space separated)"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(20,40,80,0.06)' }}
              />
            </div>
            <div className="tag-list">
              <label className="tag-toggle-row">
                <input type="checkbox" checked={selectedTags.length === 0 && !tagSearch} onChange={() => { setSelectedTags([]); setTagSearch(''); }} />
                <span style={{ marginLeft: 8 }}>All Posts ({posts.length})</span>
              </label>
              {tags.map(tag => (
                <label key={tag.id} className="tag-toggle-row">
                  <input
                    type="checkbox"
                    checked={(selectedTags || []).includes(tag.tag_name)}
                    onChange={(e) => {
                      const name = tag.tag_name;
                      setSelectedTags(prev => {
                        const set = new Set(prev || []);
                        if (set.has(name)) set.delete(name); else set.add(name);
                        return Array.from(set);
                      });
                    }}
                  />
                  <span style={{ marginLeft: 8 }}>{tag.tag_name} ({tag.post_count})</span>
                </label>
              ))}
            </div>
          </aside>
        )}

        {/* Main content area */}
        <main style={{ flex: 1 }}>
          {view === 'posts' && (
            <div className="posts-grid">
              {filteredPosts.length === 0 ? (
                <p>No posts match the selected tags or search.</p>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} className="post-card" onClick={() => onPostCardClick(post)}>
                    <img 
                      src={`http://localhost:8000/uploads/${post.image_filename}`} 
                      alt={post.description || 'Post'}
                    />
                    <div className="post-info">
                      <p className="post-desc">{post.description || 'No description'}</p>
                      <div className="post-tags">
                        {(post.tags || []).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      <div className="post-meta">
                        <small>by {post.uploader_username}</small>
                        <div>
                          <small style={{ marginRight: 8 }}>{post.favorite_count ?? 0} ★</small>
                          {currentUser?.id === post.uploader_id && (
                            <button 
                              className="delete-btn"
                              onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        {/* POST DETAIL VIEW */}
        {view === 'postDetail' && selectedPost && (
          <div className="post-detail">
            <div className="detail-content">
              <div className="detail-image">
                <img src={`http://localhost:8000/uploads/${selectedPost.image_filename}`} alt={selectedPost.description || 'Post'} />
              </div>
              <div className="detail-info">
                <h2>{selectedPost.description || 'No description'}</h2>
                <div className="detail-section">
                  <h3>Tags</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(selectedPost.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
                <div className="detail-section">
                  <h3>Uploader</h3>
                  <small>{selectedPost.uploader_username}</small>
                </div>
                <div className="detail-section">
                  <h3>Favorites</h3>
                  <div className="detail-actions">
                    <button
                      className={selectedPost._favorited ? 'btn-favorited' : 'btn-favorite'}
                      onClick={async () => { await toggleFavorite(selectedPost.id); }}
                    >
                      {selectedPost._favorited ? 'Favorited' : 'Favorite'} • {selectedPost.favorite_count ?? 0}
                    </button>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Pools</h3>
                  <div className="pool-links">
                    {poolsContainingPost(selectedPost.id).length === 0 ? (
                      <div>No pools contain this post</div>
                    ) : (
                      poolsContainingPost(selectedPost.id).map(pool => (
                        <button key={pool.id} className="pool-link" onClick={() => openPool(pool.id)}>{pool.name}</button>
                      ))
                    )}

                    <div style={{ marginTop: 12 }}>
                      <h4>Add to pool</h4>
                      <input
                        placeholder="Search pools by name"
                        value={poolSearch}
                        onChange={(e) => setPoolSearch(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(20,40,80,0.06)', marginBottom: 8 }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pools.filter(p => p.name.toLowerCase().includes(poolSearch.toLowerCase())).map(pool => (
                          <div key={pool.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>{pool.name} <small style={{ marginLeft: 8, color: '#666' }}>{(pool.posts || []).length} posts</small></div>
                            <button className="pool-link" onClick={(e) => { e.stopPropagation(); addPostToPool(pool.id, selectedPost.id); setPoolSearch(''); }}>
                              Add
                            </button>
                          </div>
                        ))}
                        {poolSearch && pools.filter(p => p.name.toLowerCase().includes(poolSearch.toLowerCase())).length === 0 && <div style={{ color: '#666' }}>No matching pools</div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button onClick={() => openCarouselWith([selectedPost], 0)}>Open in Carousel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POOLS VIEW */}
        {view === 'pools' && (
          <div className="pools-view">
            <div className="pools-header">
              <h2>Pools</h2>
              <CreatePoolForm onCreate={handleCreatePool} />
            </div>

            <div className="pools-grid">
              {pools.map(pool => (
                <div key={pool.id} className="pool-card" onClick={() => openPool(pool.id)}>
                  <h3>{pool.name}</h3>
                  <p>{pool.description}</p>
                  <div className="pool-meta">
                    <small>by {pool.creator_username || pool.creator_id}</small>
                    <small>{(pool.posts || []).length} posts</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* POOL DETAIL VIEW */}
        {view === 'poolDetail' && selectedPool && (
          <div>
            <button className="back-btn" onClick={() => { setView('pools'); setSelectedPool(null); }}>Back to pools</button>
            <div className="pool-header">
              <div>
                <h2>{selectedPool.name}</h2>
                <p>{selectedPool.description}</p>
                <small>by {selectedPool.creator_username || selectedPool.creator_id}</small>
              </div>
              <div className="pool-actions">
                <button onClick={() => openCarouselWith(selectedPool.posts || [], 0)} disabled={!(selectedPool.posts && selectedPool.posts.length)}>Open Carousel</button>
              </div>
            </div>

            <div className="pools-grid" style={{ marginTop: 16 }}>
              {(selectedPool.posts || []).map((p, idx) => (
                <div key={p.id || p.post_id || idx} className="post-card" onClick={() => openPost(p.id || p.post_id)}>
                  <img src={`http://localhost:8000/uploads/${p.image_filename || p.filename}`} alt={p.description || ''} />
                  <div className="post-info">
                    <p className="post-desc">{p.description || 'No description'}</p>
                    <div className="post-meta">
                      <small>by {p.uploader_username}</small>
                      <div>
                        <small style={{ marginRight: 8 }}>{p.favorite_count ?? 0} ★</small>
                        {currentUser?.id === (p.uploader_id || p.uploader) && (
                          <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(p.id || p.post_id); }}>Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAROUSEL MODAL */}
        {carouselOpen && (
          <div className="carousel" ref={carouselRef} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button className="carousel-btn" onClick={prevCarousel} style={{ background: '#fff', color: '#000' }}>◀</button>
            <div className="carousel-content" style={{ maxWidth: '80%', textAlign: 'center' }}>
              {carouselItems[carouselIndex] && (
                <>
                  <img src={`http://localhost:8000/uploads/${carouselItems[carouselIndex].image_filename || carouselItems[carouselIndex].filename}`} alt="carousel" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
                  <div className="carousel-info" style={{ marginTop: 8 }}>
                    <p>{carouselItems[carouselIndex].description}</p>
                    <small>by {carouselItems[carouselIndex].uploader_username}</small>
                  </div>
                </>
              )}
            </div>
            <button className="carousel-btn" onClick={nextCarousel} style={{ background: '#fff', color: '#000' }}>▶</button>
            <button onClick={closeCarousel} style={{ position: 'absolute', top: 20, right: 20, padding: 8 }}>Close</button>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

function CreatePoolForm({ onCreate }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  return (
    <form className="pool-create-form" onSubmit={(e) => { e.preventDefault(); if (!name) return; onCreate(name, desc); setName(''); setDesc(''); }}>
      <input className="pool-create-input" placeholder="Pool name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="pool-create-input" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <button type="submit" className="pool-create-btn">Create Pool</button>
    </form>
  );
}

export default App;