# 🏗️ Architecture Diagram

## Before Refactoring

```
┌─────────────────────────────────────────────┐
│                                             │
│            App.jsx (835 lines)              │
│                                             │
│  • State definitions (50+ lines)            │
│  • Auth logic (100+ lines)                  │
│  • Post logic (150+ lines)                  │
│  • Pool logic (150+ lines)                  │
│  • Tag logic (80+ lines)                    │
│  • Carousel logic (50+ lines)               │
│  • JSX rendering (300+ lines)               │
│                                             │
│  🔴 MONOLITHIC                              │
│  🔴 Hard to maintain                        │
│  🔴 Hard to test                            │
│  🔴 Hard to collaborate                     │
│  🔴 Hard to extend                          │
│                                             │
└─────────────────────────────────────────────┘
```

## After Refactoring

```
                         ┌──────────────────┐
                         │   App.jsx        │
                         │  (~200 lines)    │
                         │  ✅ CLEAN        │
                         │  ✅ SIMPLE       │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
            ┌───────▼───────┐ ┌──▼────────┐ ┌─▼─────────────┐
            │  🎣 HOOKS     │ │ 🎨 VIEWS  │ │ 🎨 COMPONENTS │
            ├───────────────┤ ├───────────┤ ├───────────────┤
            │ useAuth       │ │ PostsView │ │ Auth/         │
            │ usePosts      │ │ PoolsView │ │ ├─ LoginForm  │
            │ usePools      │ │ Favorites │ │ ├─ RegisterF. │
            │ useTags       │ │  View     │ │ └─ UserHeader │
            │ useCarousel   │ └───────────┘ │ Posts/        │
            │ useFavorites  │               │ ├─ PostCard   │
            └───────────────┘               │ ├─ PostGrid   │
                                            │ ├─ PostDetail │
                                            │ └─ UploadForm │
                                            │ Pools/        │
                                            │ ├─ PoolCard   │
                                            │ ├─ PoolGrid   │
                                            │ ├─ PoolDetail │
                                            │ └─ CreatePool │
                                            │ Common/       │
                                            │ ├─ Header     │
                                            │ ├─ Sidebar    │
                                            │ ├─ Pagination│
                                            │ └─ Carousel   │
                                            └───────────────┘
```

## Data Flow

```
┌──────────────────────────────────────────────────┐
│             User Interaction                     │
│         (Click, Type, Submit)                    │
└──────────────────────────┬───────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │      React Components            │
        │   (Header, PostCard, etc)        │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │      Custom Hooks                │
        │  (useAuth, usePosts, etc)        │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │       API Module                 │
        │     (api.js)                     │
        └────────────────┬─────────────────┘
                         │
                         ▼
        ┌──────────────────────────────────┐
        │    Backend API                   │
        │  (FastAPI Server)                │
        └──────────────────────────────────┘
```

## Component Hierarchy

```
App
├── Header
│   ├── Navigation Buttons
│   └── UserHeader
│
├── Sidebar (conditional)
│   ├── Tag Search Input
│   ├── Tag Suggestions
│   └── Tag List
│
└── Main Container
    ├── PostsView (when view === 'posts')
    │   ├── PostGrid
    │   │   └── PostCard (x12)
    │   └── Pagination
    │
    ├── PostDetail (when view === 'postDetail')
    │   ├── Image
    │   ├── Description & Favorite
    │   ├── Tags
    │   ├── Pools
    │   └── Add to Pool
    │
    ├── PoolsView (when view === 'pools')
    │   ├── CreatePoolForm
    │   ├── PoolGrid
    │   │   └── PoolCard (x10)
    │   └── Pagination
    │
    ├── PoolDetail (when view === 'poolDetail')
    │   ├── Pool Info
    │   ├── Carousel Button
    │   └── PostGrid
    │       └── PostCard (x12)
    │
    ├── FavoritesView (when view === 'favorites')
    │   ├── PostGrid
    │   │   └── PostCard (x12)
    │   └── Pagination
    │
    ├── LoginForm (when view === 'login')
    │
    ├── RegisterForm (when view === 'register')
    │
    └── UploadForm (when view === 'upload')

└── Carousel (overlay, conditional)
    ├── Image
    ├── Info
    └── Navigation
```

## Hook to Component Mapping

```
🎣 useAuth
  └─→ Components:
      ├─ LoginForm
      ├─ RegisterForm
      └─ UserHeader

🎣 usePosts
  └─→ Components:
      ├─ PostCard
      ├─ PostGrid
      ├─ PostDetail
      └─ UploadForm

🎣 usePools
  └─→ Components:
      ├─ PoolCard
      ├─ PoolGrid
      ├─ PoolDetail
      └─ CreatePoolForm

🎣 useTags
  └─→ Components:
      └─ Sidebar

🎣 useCarousel
  └─→ Components:
      └─ Carousel

🎣 useFavorites
  └─→ Components:
      ├─ PostCard
      └─ FavoritesView
```

## State Organization

```
App.jsx
│
├─ auth (from useAuth)
│  ├─ currentUser
│  ├─ username
│  ├─ password
│  └─ Methods: handleRegister, handleLogin, handleLogout
│
├─ posts (from usePosts)
│  ├─ posts
│  ├─ uploadFile
│  ├─ uploadDescription
│  ├─ uploadTags
│  └─ Methods: loadPosts, handleUpload, handleDelete
│
├─ pools (from usePools)
│  ├─ pools
│  ├─ selectedPool
│  ├─ poolSearch
│  └─ Methods: loadPools, handleCreatePool, openPool, etc
│
├─ tags (from useTags)
│  ├─ tags
│  ├─ selectedTag
│  ├─ tagSearch
│  ├─ tagSearchQuery
│  └─ Methods: parseTagTokens, appendTagToSearch, etc
│
├─ carousel (from useCarousel)
│  ├─ carouselOpen
│  ├─ carouselItems
│  ├─ carouselIndex
│  └─ Methods: openCarouselWith, closeCarousel, etc
│
├─ favorites (from useFavorites)
│  ├─ favorites
│  └─ Methods: loadUserFavorites, toggleFavorite
│
└─ View State (in App.jsx)
   ├─ view ('posts', 'postDetail', 'pools', etc)
   ├─ selectedPost
   ├─ postsPage
   └─ poolsPage
```

## File Dependency Graph

```
App.jsx
├── hooks/useAuth.js
├── hooks/usePosts.js
├── hooks/usePools.js
├── hooks/useTags.js
├── hooks/useCarousel.js
├── hooks/useFavorites.js
│
├── components/Common/Header.jsx
├── components/Common/Sidebar.jsx
├── components/Common/Pagination.jsx
├── components/Common/Carousel.jsx
│
├── components/Auth/LoginForm.jsx
├── components/Auth/RegisterForm.jsx
├── components/Auth/UserHeader.jsx
│
├── components/Posts/PostCard.jsx
├── components/Posts/PostGrid.jsx
├── components/Posts/PostDetail.jsx
├── components/Posts/UploadForm.jsx
│
├── components/Pools/PoolCard.jsx
├── components/Pools/PoolGrid.jsx
├── components/Pools/PoolDetail.jsx
├── components/Pools/CreatePoolForm.jsx
│
├── views/PostsView.jsx
├── views/PoolsView.jsx
└── views/FavoritesView.jsx

api.js (used by all hooks)
contexts/AppContext.jsx (setup ready for future use)
```

## Import Structure

```
Each Hook imports:
  └─ React hooks (useState, useCallback, etc)
  └─ api.js for API calls

Each Component imports:
  └─ React (useState, useCallback, etc)
  └─ Other components (when composing)

App.jsx imports:
  └─ All hooks
  └─ All components
  └─ All views
```

## Folder Size Comparison

```
Before:
  App.jsx                    ~50 KB

After:
  App.jsx                    ~6 KB  ✨ 8x smaller!
  hooks/ (6 files)           ~12 KB
  components/ (20 files)     ~30 KB
  views/ (3 files)           ~5 KB
  contexts/AppContext.jsx    ~0.5 KB
  ─────────────────────────────────
  Total new code             ~53 KB
```

## Development Workflow Diagram

```
Want to fix a feature?
  │
  ├─→ Know the feature name? → Go to components/FeatureName/
  │
  └─→ Need to change state? → Go to hooks/useFeatureName.js

Want to add a feature?
  │
  ├─→ Create: hooks/useNewFeature.js
  ├─→ Create: components/NewFeature/
  ├─→ Import into: App.jsx
  └─→ Done! 🎉

Want to understand a component?
  │
  ├─→ Find it: components/*/
  ├─→ Check props: function MyComponent({ prop1, prop2 })
  ├─→ Check where it's used: grep -r "MyComponent"
  └─→ Done! ✨
```

---

**Clean architecture = Happy development! 🚀**
