import { useCallback, useMemo } from 'react';

export function Sidebar({
  tags,
  selectedTag,
  tagSearch,
  onTagSearchChange,
  onTagSearchSubmit,
  onSidebarTagClick,
  onSuggestionClick,
  currentView,
  selectedPost,
  parseTagTokens,
}) {
  const getSidebarTags = useCallback(() => {
    if (currentView === 'postDetail' && selectedPost) {
      return (selectedPost.tags || []).map((tagName, idx) => ({
        id: idx,
        tag_name: tagName,
        post_count: 0
      }));
    }
    return tags.slice(0, 20);
  }, [tags, currentView, selectedPost]);

  const suggestions = useMemo(() => {
    const parts = tagSearch.split(',');
    const current = parts[parts.length - 1].trim().toLowerCase();
    const tokens = parseTagTokens(tagSearch);
    return current.length > 0
      ? tags.filter(t => t.tag_name.toLowerCase().includes(current) && !tokens.includes(t.tag_name.toLowerCase()))
      : [];
  }, [tagSearch, tags, parseTagTokens]);

  const sidebarTags = getSidebarTags();

  return (
    <aside className="sidebar">
      <h3>Tags</h3>
      <div style={{ marginBottom: 8, position: 'relative' }}>
        <input
          placeholder="Search tags (comma-separated)"
          value={tagSearch}
          onChange={(e) => onTagSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onTagSearchSubmit();
            }
          }}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(20,40,80,0.06)' }}
        />

        {suggestions.length > 0 && (
          <div className="suggestion-list" style={{ marginTop: 6 }}>
            {suggestions.map(s => (
              <button
                key={s.id}
                className="suggestion-btn"
                onClick={() => onSuggestionClick(s.tag_name)}
              >
                {s.tag_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="tag-list">
        {sidebarTags.map(tag => (
          <button
            key={tag.id}
            className="tag-sidebar-btn"
            onClick={() => onSidebarTagClick(tag.tag_name)}
          >
            {tag.tag_name}
            {tag.post_count > 0 && (
              <small style={{ marginLeft: 8, color: '#666' }}>({tag.post_count})</small>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
