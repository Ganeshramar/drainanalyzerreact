import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, analyticsRes, historyRes] = await Promise.all([
        api.get('/subscriptions?active=true'),
        api.get('/analytics/dashboard'),
        api.get('/analytics/history'),
      ]);
      setSubscriptions(subRes.data.subscriptions);
      setAnalytics(analyticsRes.data);
      setHistory(historyRes.data.history);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addSubscription = async (data) => {
    const res = await api.post('/subscriptions', data);
    await fetchAll(); // Refresh analytics
    return res.data.subscription;
  };

  const updateSubscription = async (id, data) => {
    const res = await api.patch(`/subscriptions/${id}`, data);
    await fetchAll();
    return res.data.subscription;
  };

  const deleteSubscription = async (id) => {
    await api.delete(`/subscriptions/${id}`);
    await fetchAll();
  };

  const logUsage = async (id, data = {}) => {
    const res = await api.post(`/subscriptions/${id}/log-usage`, data);
    await fetchAll();
    return res.data.subscription;
  };

  return {
    subscriptions,
    analytics,
    history,
    loading,
    error,
    refetch: fetchAll,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    logUsage,
  };
};
