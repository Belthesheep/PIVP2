import { useState, useCallback } from 'react';
import { api } from '../api';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  const loadUserFavorites = useCallback(async (userId) => {
    if (!userId) return [];
    try {
      const res = await api.getUserFavorites(userId);
      setFavorites(res.data || []);
      return res.data;
    } catch (error) {
      console.error('Error loading favorites:', error);
      return [];
    }
  }, []);

  const toggleFavorite = useCallback(async (postId) => {
    try {
      const res = await api.toggleFavorite(postId);
      return res.data;
    } catch (error) {
      alert('Error toggling favorite');
      return null;
    }
  }, []);

  return {
    favorites,
    setFavorites,
    loadUserFavorites,
    toggleFavorite,
  };
}
