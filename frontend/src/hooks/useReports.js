import { useState, useCallback } from 'react';
import { api } from '../api';

export function useReports() {
  const [summary, setSummary] = useState(null);
  const [activityReport, setActivityReport] = useState(null);
  const [postsReport, setPostsReport] = useState(null);
  const [poolsReport, setPoolsReport] = useState(null);
  const [tagsReport, setTagsReport] = useState(null);
  const [uploadersReport, setUploadersReport] = useState(null);
  const [activityLog, setActivityLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummaryReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReportSummary();
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load summary report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivityReport = useCallback(async (period = 'day') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getActivityReport(period);
      setActivityReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load activity report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPostsReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPostsReport();
      setPostsReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load posts report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPoolsReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPoolsReport();
      setPoolsReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load pools report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTagsReport = useCallback(async (limit = 20) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTagsReport(limit);
      setTagsReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tags report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUploadersReport = useCallback(async (limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTopUploadersReport(limit);
      setUploadersReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load uploaders report');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadActivityLog = useCallback(async (limit = 100, actionType = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getActivityLog(limit, actionType);
      setActivityLog(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    summary,
    activityReport,
    postsReport,
    poolsReport,
    tagsReport,
    uploadersReport,
    activityLog,
    loading,
    error,
    loadSummaryReport,
    loadActivityReport,
    loadPostsReport,
    loadPoolsReport,
    loadTagsReport,
    loadUploadersReport,
    loadActivityLog,
  };
}
