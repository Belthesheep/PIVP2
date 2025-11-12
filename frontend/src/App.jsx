import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [pools, setPools] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagSearch, setTagSearch] = useState(''); // search input for tags (comma-separated)
  const [tagSearchQuery, setTagSearchQuery] = useState(''); // actual search query (updated on Enter only)
  const [poolSearch, setPoolSearch] = useState(''); // search input for adding to pool
  const [pools, setPools] = useState([]);
  const [favorites, setFavorites] = useState([]); // user's favorited posts

  // Pagination
  const [postsPage, setPostsPage] = useState(0);
  const [poolsPage, setPoolsPage] = useState(0);
  const POSTS_PER_PAGE = 16; // 4 columns x 10 rows
  const POOLS_PER_PAGE = 30; // 3 columns x 10 rows

  // Views: posts, upload, register, login, pools, poolDetail, postDetail, favorites
  const [view, setView] = useState('posts');

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
    // try to restore current user (session cookie)
    (async () => {
      try {
        const me = await api.getMe();
        setCurrentUser(me.data || null);
        // Load favorites if user is logged in
        if (me.data) {
          const favs = await api.getUserFavorites(me.data.id);
          setFavorites(favs.data || []);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

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
      setView('posts');
      loadAll();
      // Load favorites after successful login
      const favs = await api.getUserFavorites(me.data.id);
      setFavorites(favs.data || []);
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
      // Store the pools that contain this post from the API response
      setSelectedPost({ ...post, _favorited: favorited, _containingPools: post.pools || [] });
      setView('postDetail');
    } catch (error) {
      alert('Error loading post');
    }
  };

  const handleToggleFavorite = async (postId) => {
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
      // refresh posts list counts and favorites
      loadAll();
      loadUserFavorites();
      return res.data;
    } catch (error) {
      alert('Error toggling favorite');
    }
  };

  // Load user's favorited posts
  const loadUserFavorites = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getUserFavorites(currentUser.id);
      setFavorites(res.data || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
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

  // helper: parse tag search string into tokens (comma-separated only)
  const parseTagTokens = (s) => {
    if (!s) return [];
    return s.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  };

  // helper: check if a tag already exists in the search string
  const tagExistsInSearch = (tagName, searchString) => {
    return parseTagTokens(searchString).includes(tagName.toLowerCase());
  };

  // helper: append a tag to search string, checking for duplicates
  const appendTagToSearch = (currentSearch, tagName) => {
    if (tagExistsInSearch(tagName, currentSearch)) {
      return currentSearch; // tag already exists, don't add
    }
    const base = currentSearch.trim();
    if (!base) return `${tagName},`;
    if (base.endsWith(',')) return `${base}${tagName},`;
    return `${base},${tagName},`;
  };

  // helper: replace the incomplete tag at the end with a complete one
  const replaceIncompleteTag = (currentSearch, tagName) => {
    const parts = currentSearch.split(',');
    // Remove the last incomplete part
    parts.pop();
    // Add the complete tag
    parts.push(tagName);
    return parts.join(',') + ',';
  };

  // helper: get tags to display in sidebar (top 20 for browse, post-specific for detail)
  const getSidebarTags = () => {
    if (view === 'postDetail' && selectedPost) {
      // Show only the tags from the selected post
      return (selectedPost.tags || []).map((tagName, idx) => ({
        id: idx,
        tag_name: tagName,
        post_count: 0
      }));
    }
    // Show top 20 most popular tags for all other views
    return tags.slice(0, 20);
  };

  // derived filtered posts based on tagSearchQuery (AND semantics)
  const filteredPosts = posts.filter(post => {
    const postTags = (post.tags || []).map(t => String(t).toLowerCase());
    const searchTags = parseTagTokens(tagSearchQuery);
    if (searchTags.length === 0) return true;
    return searchTags.every(rt => postTags.includes(rt));
  });

  const handleCreatePool = async (name, description) => {
    try {
      await api.createPool(name, description);
      loadPools();
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

  // helper to find pools that contain a post
  // uses the pools data from the post detail API response
  const poolsContainingPost = (postId) => {
    if (!selectedPost || !selectedPost._containingPools) return [];
    return selectedPost._containingPools;
  };

    // robust helper to get number of posts in a pool regardless of API shape
    const poolPostCount = (pool) => {
      if (!pool) return 0;
      if (Array.isArray(pool.posts)) return pool.posts.length;
      // common alternative fields returned by some APIs
      if (typeof pool.post_count === 'number') return pool.post_count;
      if (typeof pool.postCount === 'number') return pool.postCount;
      if (typeof pool.count === 'number') return pool.count;
      if (typeof pool.size === 'number') return pool.size;
      return 0;
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
          {currentUser && (
            <button onClick={() => { setView('favorites'); setPostsPage(0); }}>Favorites</button>
          )}
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

      <div className="app-content">
        {/* Sidebar (show for browsing and detail views) */}
        {(view !== 'register' && view !== 'login' && view !== 'upload' && view !== 'favorites') && (
          <aside className="sidebar">
            <h3>Tags</h3>
            <div style={{ marginBottom: 8, position: 'relative' }}>
              <input
                placeholder="Search tags (comma-separated)"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setTagSearchQuery(tagSearch);
                    if (view !== 'posts') {
                      setView('posts');
                      setPostsPage(0);
                    }
                  }
                }}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(20,40,80,0.06)' }}
              />

              {/* Tag suggestions dropdown (compact buttons) */}
              {(() => {
                const parts = tagSearch.split(',');
                const current = parts[parts.length - 1].trim().toLowerCase();
                const tokens = parseTagTokens(tagSearch);
                const suggestions = current.length > 0 ? tags.filter(t => t.tag_name.toLowerCase().includes(current) && !tokens.includes(t.tag_name.toLowerCase())) : [];
                if (suggestions.length === 0) return null;
                return (
                  <div className="suggestion-list" style={{ marginTop: 6 }}>
                    {suggestions.map(s => (
                      <button key={s.id} className="suggestion-btn" onClick={() => {
                        // Replace the incomplete tag with the complete one
                        setTagSearch(prev => replaceIncompleteTag(prev, s.tag_name));
                      }}>{s.tag_name}</button>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="tag-list">
              {getSidebarTags().map(tag => (
                <button key={tag.id} className="tag-sidebar-btn" onClick={() => {
                  // when clicking a sidebar tag, append to tagSearch plus comma (checking for duplicates)
                  setTagSearch(prev => appendTagToSearch(prev, tag.tag_name));
                }}>{tag.tag_name} {tag.post_count > 0 && <small style={{ marginLeft: 8, color: '#666' }}>({tag.post_count})</small>}</button>
              ))}
            </div>
          </aside>
        )}

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

          {/* Main content area */}
          <main>
          {view === 'posts' && (
            <div>
              <div className="posts-grid">
                {filteredPosts.length === 0 ? (
                  <p>No posts match the selected tags or search.</p>
                ) : (
                  filteredPosts.slice(postsPage * POSTS_PER_PAGE, (postsPage + 1) * POSTS_PER_PAGE).map(post => (
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
              {/* Posts pagination */}
              {filteredPosts.length > POSTS_PER_PAGE && (
                <div className="pagination">
                  {Array.from({ length: Math.ceil(filteredPosts.length / POSTS_PER_PAGE) }).map((_, i) => (
                    <button key={i} className={`page-btn ${postsPage === i ? 'active' : ''}`} onClick={() => { setPostsPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
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
                {/* Description + Favorite Button */}
                <div className="detail-header">
                  <h2>{selectedPost.description || 'No description'}</h2>
                  <button
                    className={selectedPost._favorited ? 'btn-favorited' : 'btn-favorite'}
                    onClick={async () => { await toggleFavorite(selectedPost.id); }}
                  >
                    {selectedPost._favorited ? 'Favorited' : 'Favorite'} • {selectedPost.favorite_count ?? 0}
                  </button>
                </div>

                {/* Tags */}
                <div className="detail-section">
                  <h3>Tags</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(selectedPost.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>

                {/* Pools: Left side and Add to Pool: Right side */}
                <div className="detail-pools-row">
                  <div className="pools-column">
                    <h3>Pools</h3>
                    <div className="pool-links">
                      {poolsContainingPost(selectedPost.id).length === 0 ? (
                        <div>No pools contain this post</div>
                      ) : (
                        poolsContainingPost(selectedPost.id).map(pool => (
                          <button key={pool.id} className="pool-link" onClick={() => openPool(pool.id)}>{pool.name}</button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="add-to-pool-column">
                    <h3>Add to pool</h3>
                    <input
                      placeholder="Search pools by name"
                      value={poolSearch}
                      onChange={(e) => setPoolSearch(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(20,40,80,0.06)', marginBottom: 8 }}
                    />
                    {/* Pool suggestions as compact buttons - only show if search term is provided and pool creator is current user */}
                    {poolSearch && (
                      <div className="suggestion-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pools
                          .filter(p => currentUser && p.creator_id === currentUser.id)
                          .filter(p => p.name.toLowerCase().includes(poolSearch.toLowerCase()))
                          .map(pool => (
                            <button key={pool.id} className="suggestion-btn" onClick={(e) => { e.stopPropagation(); addPostToPool(pool.id, selectedPost.id); setPoolSearch(''); }}>
                              {pool.name} <small style={{ marginLeft: 8, color: '#fff', opacity: 0.9 }}>{poolPostCount(pool)} posts</small>
                            </button>
                          ))}
                        {pools.filter(p => currentUser && p.creator_id === currentUser.id).filter(p => p.name.toLowerCase().includes(poolSearch.toLowerCase())).length === 0 && <div style={{ color: '#666' }}>No matching pools</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploader at the bottom */}
                <div className="detail-section detail-footer">
                  <h3>Uploader</h3>
                  <small>{selectedPost.uploader_username}</small>
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
              {pools.slice(poolsPage * POOLS_PER_PAGE, (poolsPage + 1) * POOLS_PER_PAGE).map(pool => (
                <div key={pool.id} className="pool-card" onClick={() => openPool(pool.id)}>
                  <h3>{pool.name}</h3>
                  <p>{pool.description || 'No description'}</p>
                  <div className="pool-meta">
                    <small>by {pool.creator_username || pool.creator_id}</small>
                    <small>{poolPostCount(pool)} posts</small>
                  </div>
                </div>
              ))}
              {pools.length === 0 && <p>No pools yet. Create one!</p>}
            </div>

            {/* Pools pagination */}
            {pools.length > POOLS_PER_PAGE && (
              <div className="pagination">
                {Array.from({ length: Math.ceil(pools.length / POOLS_PER_PAGE) }).map((_, i) => (
                  <button key={i} className={`page-btn ${poolsPage === i ? 'active' : ''}`} onClick={() => { setPoolsPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* POOL DETAIL VIEW */}
        {view === 'poolDetail' && selectedPool && (
          <div>
            <div className="pool-header">
              <div>
                <h2>{selectedPool.name}</h2>
                <p>{selectedPool.description}</p>
                <small>Created by {selectedPool.creator_username} • {selectedPool.post_count} posts</small>
              </div>
              <div className="pool-actions">
                <button onClick={() => openCarouselWith(selectedPool.posts || [], 0)} disabled={poolPostCount(selectedPool) === 0}>Open Carousel</button>
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
                ))}
                {selectedPool.posts.length === 0 && <p>This pool is empty.</p>}
              </div>
            )}
          </div>
        )}

        {/* FAVORITES VIEW */}
        {view === 'favorites' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>My Favorites</h2>
            {!currentUser ? (
              <p>Please login to see your favorites</p>
            ) : favorites.length === 0 ? (
              <p>You haven't favorited any posts yet</p>
            ) : (
              <div>
                <div className="posts-grid">
                  {favorites.slice(postsPage * POSTS_PER_PAGE, (postsPage + 1) * POSTS_PER_PAGE).map(post => (
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
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAVORITES VIEW */}
        {view === 'favorites' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>My Favorites</h2>
            {!currentUser ? (
              <p>Please login to see your favorites</p>
            ) : favorites.length === 0 ? (
              <p>You haven't favorited any posts yet</p>
            ) : (
              <div>
                <div className="posts-grid">
                  {favorites.slice(postsPage * POSTS_PER_PAGE, (postsPage + 1) * POSTS_PER_PAGE).map(post => (
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
                  ))}
                </div>

                {/* Favorites pagination */}
                {favorites.length > POSTS_PER_PAGE && (
                  <div className="pagination">
                    {Array.from({ length: Math.ceil(favorites.length / POSTS_PER_PAGE) }).map((_, i) => (
                      <button key={i} className={`page-btn ${postsPage === i ? 'active' : ''}`} onClick={() => { setPostsPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
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
        </main>
        </div>
      </div>
    </div>
  );
}

export default App;