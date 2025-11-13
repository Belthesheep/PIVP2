# 🚀 How to Extend the Refactored App

This guide shows how easy it is to add new features with the new modular structure!

## Adding a New Feature: Example - Comments System

### Step 1: Create a Hook
**File: `src/hooks/useComments.js`**
```javascript
import { useState, useCallback } from 'react';
import { api } from '../api';

export function useComments() {
  const [comments, setComments] = useState([]);

  const loadComments = useCallback(async (postId) => {
    try {
      const res = await api.getComments(postId);
      setComments(res.data || []);
      return res.data;
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }, []);

  const addComment = useCallback(async (postId, text) => {
    try {
      const res = await api.addComment(postId, { text });
      setComments(prev => [...prev, res.data]);
      return true;
    } catch (error) {
      alert('Error adding comment');
      return false;
    }
  }, []);

  return { comments, setComments, loadComments, addComment };
}
```

### Step 2: Create Components
**File: `src/components/Comments/CommentList.jsx`**
```javascript
export function CommentList({ comments }) {
  return (
    <div className="comment-list">
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <strong>{comment.author}</strong>
          <p>{comment.text}</p>
          <small>{comment.created_at}</small>
        </div>
      ))}
    </div>
  );
}
```

**File: `src/components/Comments/CommentForm.jsx`**
```javascript
import { useState, useCallback } from 'react';

export function CommentForm({ onSubmit }) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  }, [text, onSubmit]);

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a comment..."
      />
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

### Step 3: Integrate into App.jsx
```javascript
import { useComments } from './hooks/useComments';
import { CommentList } from './components/Comments/CommentList';
import { CommentForm } from './components/Comments/CommentForm';

function App() {
  const comments = useComments();
  
  // Load comments when post opens
  useEffect(() => {
    if (selectedPost) {
      comments.loadComments(selectedPost.id);
    }
  }, [selectedPost]);

  return (
    // ... existing components ...
    {view === 'postDetail' && selectedPost && (
      <>
        <PostDetail {...props} />
        <CommentList comments={comments.comments} />
        <CommentForm 
          onSubmit={(text) => comments.addComment(selectedPost.id, text)} 
        />
      </>
    )}
  );
}
```

## Benefits of This Approach

### ✅ Scalability
- Adding features doesn't bloat App.jsx
- Each feature stays in its own directory
- Easy to find related code

### ✅ Reusability
- Hooks can be used by multiple components
- Components are independent and composable
- Logic can be shared across the app

### ✅ Maintainability
- Changes to one feature don't affect others
- Easier to debug and test
- Clear file organization mirrors feature structure

### ✅ Collaboration
- Multiple developers can work on different features
- Clear separation prevents merge conflicts
- Easy to understand what each file does

## Common Patterns

### Pattern 1: Feature Hook + Components
```
Feature: Notifications
├── hooks/
│   └── useNotifications.js      (State & logic)
├── components/
│   ├── NotificationList.jsx     (Display)
│   ├── NotificationItem.jsx     (Single item)
│   └── NotificationBell.jsx     (Trigger)
└── Integrate into App.jsx
```

### Pattern 2: Feature View + Sub-components
```
Feature: User Profile
├── views/
│   └── ProfileView.jsx          (Main page)
├── components/
│   ├── ProfileHeader.jsx        (Profile info)
│   ├── ProfilePosts.jsx         (User's posts)
│   └── ProfileStats.jsx         (Statistics)
└── hooks/
    └── useProfile.js            (Profile data)
```

### Pattern 3: Complex Feature
```
Feature: Search System
├── hooks/
│   ├── useSearch.js             (Search logic)
│   └── useSearchFilters.js      (Filter management)
├── components/
│   ├── SearchBar.jsx            (Input)
│   ├── SearchResults.jsx        (Results grid)
│   ├── SearchFilters.jsx        (Filter panel)
│   └── SearchResultItem.jsx     (Single result)
├── utils/
│   └── searchUtils.js           (Helper functions)
└── views/
    └── SearchView.jsx           (Full page)
```

## Tips for Maintaining Code Quality

1. **Keep Hooks Focused** - Each hook should do one thing
2. **Use Meaningful Names** - `useComments` not `useData`
3. **Document Props** - Add JSDoc comments to components
4. **Avoid Prop Drilling** - Consider Context for deeply nested props
5. **Extract Reusable Logic** - Move common patterns to utilities
6. **Test Independently** - Hooks and components are easy to test

## Performance Optimization Tips

### Memoization
```javascript
import { useMemo, useCallback } from 'react';

export function CommentList({ comments }) {
  const sorted = useMemo(() => 
    [...comments].sort((a, b) => b.date - a.date),
    [comments]
  );
  
  return <div>{/* ... */}</div>;
}
```

### Component Optimization
```javascript
import { memo } from 'react';

export const CommentItem = memo(function CommentItem({ comment }) {
  return <div>{/* ... */}</div>;
});
```

### Lazy Loading
```javascript
import { lazy, Suspense } from 'react';

const CommentsSection = lazy(() => 
  import('./components/Comments/CommentsSection')
);

export function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CommentsSection />
    </Suspense>
  );
}
```

---

🎉 **Your modular architecture makes extension easy and scalable!**
