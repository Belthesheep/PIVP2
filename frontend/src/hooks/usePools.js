import { useState, useCallback } from 'react';
import { api } from '../api';

export function usePools() {
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [poolSearch, setPoolSearch] = useState('');

  const loadPools = useCallback(async () => {
    try {
      const res = await api.getPools();
      setPools(res.data || []);
      return res.data;
    } catch (e) {
      console.error('Error loading pools', e);
      return [];
    }
  }, []);

  const handleCreatePool = useCallback(async (name, description) => {
    try {
      await api.createPool(name, description);
      await loadPools();
      return true;
    } catch (e) {
      alert('Error creating pool');
      return false;
    }
  }, [loadPools]);

  const openPool = useCallback(async (poolId) => {
    try {
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
      return res.data;
    } catch (e) {
      alert('Error loading pool');
      return null;
    }
  }, []);

  const addPostToPool = useCallback(async (poolId, postId) => {
    try {
      await api.addPostToPool(poolId, postId);
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
      alert('Post added to pool');
      return true;
    } catch (e) {
      alert('Error adding post to pool');
      return false;
    }
  }, []);

  const removePostFromPool = useCallback(async (poolId, postId) => {
    try {
      await api.removePostFromPool(poolId, postId);
      const res = await api.getPool(poolId);
      setSelectedPool(res.data);
      return true;
    } catch (e) {
      alert('Error removing post from pool');
      return false;
    }
  }, []);

  const poolPostCount = useCallback((pool) => {
    if (!pool) return 0;
    if (Array.isArray(pool.posts)) return pool.posts.length;
    if (typeof pool.post_count === 'number') return pool.post_count;
    if (typeof pool.postCount === 'number') return pool.postCount;
    if (typeof pool.count === 'number') return pool.count;
    if (typeof pool.size === 'number') return pool.size;
    return 0;
  }, []);

  return {
    pools,
    setPools,
    selectedPool,
    setSelectedPool,
    poolSearch,
    setPoolSearch,
    loadPools,
    handleCreatePool,
    openPool,
    addPostToPool,
    removePostFromPool,
    poolPostCount,
  };
}
