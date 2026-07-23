import { useState, useCallback } from 'react';
import { api } from '../api';

export function useTags() {
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagSearch, setTagSearch] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const loadTags = useCallback(async () => {
    try {
      const res = await api.getTags();
      setTags(res.data || []);
      return res.data;
    } catch (error) {
      console.error('Error loading tags:', error);
      return [];
    }
  }, []);

  const parseTagTokens = useCallback((s) => {
    if (!s) return [];
    return s.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  }, []);

  const tagExistsInSearch = useCallback((tagName, searchString) => {
    return parseTagTokens(searchString).includes(tagName.toLowerCase());
  }, [parseTagTokens]);

  const appendTagToSearch = useCallback((currentSearch, tagName) => {
    if (tagExistsInSearch(tagName, currentSearch)) {
      return currentSearch;
    }
    const base = currentSearch.trim();
    if (!base) return `${tagName},`;
    if (base.endsWith(',')) return `${base}${tagName},`;
    return `${base},${tagName},`;
  }, [tagExistsInSearch]);

  const replaceIncompleteTag = useCallback((currentSearch, tagName) => {
    const parts = currentSearch.split(',');
    parts.pop();
    parts.push(tagName);
    return parts.join(',') + ',';
  }, []);

  const getSidebarTags = useCallback((currentView, selectedPost) => {
    if (currentView === 'postDetail' && selectedPost) {
      return (selectedPost.tags || []).map((tagName, idx) => ({
        id: idx,
        tag_name: tagName,
        post_count: 0
      }));
    }
    return tags.slice(0, 20);
  }, [tags]);

  return {
    tags,
    setTags,
    selectedTag,
    setSelectedTag,
    tagSearch,
    setTagSearch,
    tagSearchQuery,
    setTagSearchQuery,
    loadTags,
    parseTagTokens,
    tagExistsInSearch,
    appendTagToSearch,
    replaceIncompleteTag,
    getSidebarTags,
  };
}
