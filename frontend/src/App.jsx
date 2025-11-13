import { useState, useEffect } from 'react';
import { api } from './api';
import './App.css';

// Import hooks
import { useAuth } from './hooks/useAuth';
import { usePosts } from './hooks/usePosts';
import { usePools } from './hooks/usePools';
import { useTags } from './hooks/useTags';
import { useCarousel } from './hooks/useCarousel';
import { useFavorites } from './hooks/useFavorites';

// Import components
import { Header } from './components/Common/Header';
import { Sidebar } from './components/Common/Sidebar';
import { Carousel } from './components/Common/Carousel';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { PostDetail } from './components/Posts/PostDetail';
import { UploadForm } from './components/Posts/UploadForm';
import { PoolDetail } from './components/Pools/PoolDetail';

// Import views
import { PostsView } from './views/PostsView';
import { FavoritesView } from './views/FavoritesView';
import { PoolsView } from './views/PoolsView';

function App() {
  // Use custom hooks
  const auth = useAuth();
  const posts = usePosts();
  const pools = usePools();
  const tags = useTags();
  const carousel = useCarousel();
  const favorites = useFavorites();

  // State
  const [users, setUsers] = useState([]);
  const [view, setView] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [postsPage, setPostsPage] = useState(0);
  const [poolsPage, setPoolsPage] = useState(0);

  const POSTS_PER_PAGE = 16;
  const POOLS_PER_PAGE = 30;


  // Load data on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Load current user
      await auth.loadCurrentUser();
      // Load all data
      await loadAllData();
    };
    initializeApp();
  }, []);

  // Load favorites when user changes
  useEffect(() => {
    if (auth.currentUser) {
      favorites.loadUserFavorites(auth.currentUser.id);
    }
  }, [auth.currentUser]);

  // Load posts when tag changes
  useEffect(() => {
    posts.loadPosts(tags.selectedTag);
  }, [tags.selectedTag]);

  const loadAllData = async () => {
    try {
      const [postsRes, tagsRes, usersRes, poolsRes] = await Promise.all([
        api.getPosts(),
        api.getTags(),
        api.getUsers(),
        api.getPools()
      ]);
      posts.setPosts(postsRes.data || []);
      tags.setTags(tagsRes.data || []);
      setUsers(usersRes.data || []);
      pools.setPools(poolsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Handle auth
  const handleRegister = async () => {
    const success = await auth.handleRegister(new Event('submit'));
    if (success) {
      setView('posts');
      await loadAllData();
    }
  };

  const handleLogin = async () => {
    const success = await auth.handleLogin(new Event('submit'));
    if (success) {
      setView('posts');
      setPostsPage(0);
      await loadAllData();
      await favorites.loadUserFavorites(auth.currentUser.id);
    }
  };

  const handleLogout = async () => {
    await auth.handleLogout();
  };

  // Handle posts
  const handleUpload = async () => {
    const success = await posts.handleUpload(auth.currentUser);
    if (success) {
      setView('posts');
      await loadAllData();
    }
  };

  const handleDeletePost = async (postId) => {
    const success = await posts.handleDelete(postId);
    if (success) {
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setView('posts');
      }
      await loadAllData();
    }
  };

  const openPost = async (postId) => {
    try {
      const res = await api.getPost(postId);
      const post = res.data;
      let favorited = false;
      if (auth.currentUser) {
        try {
          const favs = await api.getUserFavorites(auth.currentUser.id);
          favorited = (favs.data || []).some(f => f.post_id === postId || f.id === postId);
        } catch (e) {
          // ignore
        }
      }
      setSelectedPost({ ...post, _favorited: favorited, _containingPools: post.pools || [] });
      setView('postDetail');
    } catch (error) {
      alert('Error loading post');
    }
  };

  const toggleFavorite = async (postId) => {
    if (!auth.currentUser) {
      alert('Please login to favorite posts');
      return;
    }
    try {
      await favorites.toggleFavorite(postId);
      if (selectedPost && selectedPost.id === postId) {
        const updated = await api.getPost(postId);
        const favs = await api.getUserFavorites(auth.currentUser.id);
        const fav = (favs.data || []).some(f => f.post_id === postId || f.id === postId);
        setSelectedPost({ ...updated.data, _favorited: fav, _containingPools: updated.data.pools || [] });
      }
      await loadAllData();
      await favorites.loadUserFavorites(auth.currentUser.id);
    } catch (error) {
      alert('Error toggling favorite');
    }
  };

  // Handle pools
  const handleCreatePool = async (name, description) => {
    const success = await pools.handleCreatePool(name, description);
    if (success) {
      setView('pools');
      setPoolsPage(0);
    }
  };

  const openPoolDetail = async (poolId) => {
    const pool = await pools.openPool(poolId);
    if (pool) {
      setView('poolDetail');
    }
  };

  const handleAddToPool = async (poolId, postId) => {
    await pools.addPostToPool(poolId, postId);
  };

  // Filter posts based on tag search
  const filteredPosts = posts.posts.filter(post => {
    const postTags = (post.tags || []).map(t => String(t).toLowerCase());
    const searchTags = tags.parseTagTokens(tags.tagSearchQuery);
    if (searchTags.length === 0) return true;
    return searchTags.every(rt => postTags.includes(rt));
  });

  return (
    <div className="app">
      <Header
        onBrowse={() => { setView('posts'); setPostsPage(0); }}
        onUpload={() => { setView('upload'); }}
        onRegister={() => { setView('register'); }}
        onLogin={() => { setView('login'); }}
        onPools={() => { setView('pools'); setPoolsPage(0); }}
        currentUser={auth.currentUser}
        showFavorites={true}
        onFavorites={() => { setView('favorites'); setPostsPage(0); }}
        onLogout={handleLogout}
      />

      <div className="app-content">
        {/* Sidebar */}
        {(view !== 'register' && view !== 'login' && view !== 'upload' && view !== 'favorites') && (
          <Sidebar
            tags={tags.tags}
            selectedTag={tags.selectedTag}
            tagSearch={tags.tagSearch}
            onTagSearchChange={tags.setTagSearch}
            onTagSearchSubmit={() => {
              tags.setTagSearchQuery(tags.tagSearch);
              if (view !== 'posts') {
                setView('posts');
                setPostsPage(0);
              }
            }}
            onSidebarTagClick={(tagName) => {
              tags.setTagSearch(prev => tags.appendTagToSearch(prev, tagName));
            }}
            onSuggestionClick={(tagName) => {
              tags.setTagSearch(prev => tags.replaceIncompleteTag(prev, tagName));
            }}
            currentView={view}
            selectedPost={selectedPost}
            parseTagTokens={tags.parseTagTokens}
          />
        )}

        <div className="container">
          {/* REGISTER VIEW */}
          {view === 'register' && (
            <RegisterForm
              username={auth.username}
              password={auth.password}
              onUsernameChange={auth.setUsername}
              onPasswordChange={auth.setPassword}
              onSubmit={handleRegister}
            />
          )}

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <LoginForm
              username={auth.username}
              password={auth.password}
              onUsernameChange={auth.setUsername}
              onPasswordChange={auth.setPassword}
              onSubmit={handleLogin}
            />
          )}

          {/* UPLOAD VIEW */}
          {view === 'upload' && (
            <UploadForm
              currentUser={auth.currentUser}
              uploadFile={posts.uploadFile}
              uploadDescription={posts.uploadDescription}
              uploadTags={posts.uploadTags}
              onFileChange={posts.setUploadFile}
              onDescriptionChange={posts.setUploadDescription}
              onTagsChange={posts.setUploadTags}
              onSubmit={handleUpload}
            />
          )}

          <main>
            {/* POSTS VIEW */}
            {view === 'posts' && (
              <PostsView
                posts={filteredPosts}
                currentUserId={auth.currentUser?.id}
                currentPage={postsPage}
                postsPerPage={POSTS_PER_PAGE}
                onPostClick={openPost}
                onDelete={handleDeletePost}
                onPageChange={setPostsPage}
              />
            )}

            {/* POST DETAIL VIEW */}
            {view === 'postDetail' && selectedPost && (
              <PostDetail
                post={selectedPost}
                currentUser={auth.currentUser}
                pools={pools.pools}
                onToggleFavorite={toggleFavorite}
                onDelete={handleDeletePost}
                onOpenPool={openPoolDetail}
                onAddToPool={handleAddToPool}
                onPoolSearchChange={pools.setPoolSearch}
                poolSearch={pools.poolSearch}
                poolPostCount={pools.poolPostCount}
              />
            )}

            {/* POOLS VIEW */}
            {view === 'pools' && (
              <PoolsView
                pools={pools.pools}
                currentPage={poolsPage}
                poolsPerPage={POOLS_PER_PAGE}
                onCreatePool={handleCreatePool}
                onCardClick={openPoolDetail}
                onPageChange={setPoolsPage}
                poolPostCount={pools.poolPostCount}
              />
            )}

            {/* POOL DETAIL VIEW */}
            {view === 'poolDetail' && pools.selectedPool && (
              <PoolDetail
                pool={pools.selectedPool}
                currentUser={auth.currentUser}
                onOpenCarousel={carousel.openCarouselWith}
                onOpenPost={openPost}
                onDelete={handleDeletePost}
                poolPostCount={pools.poolPostCount}
              />
            )}

            {/* FAVORITES VIEW */}
            {view === 'favorites' && (
              <FavoritesView
                favorites={favorites.favorites}
                currentUser={auth.currentUser}
                currentPage={postsPage}
                postsPerPage={POSTS_PER_PAGE}
                onPostClick={openPost}
                onDelete={handleDeletePost}
                onPageChange={setPostsPage}
              />
            )}
          </main>
        </div>
      </div>

      {/* CAROUSEL MODAL */}
      <Carousel
        items={carousel.carouselItems}
        currentIndex={carousel.carouselIndex}
        isOpen={carousel.carouselOpen}
        onPrev={carousel.prevCarousel}
        onNext={carousel.nextCarousel}
        onClose={carousel.closeCarousel}
      />
    </div>
  );
}

export default App;