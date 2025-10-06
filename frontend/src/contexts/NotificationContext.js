import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError('');
      
      const res = await notificationAPI.getNotifications({
        limit: options.limit || 20,
        offset: options.offset || 0,
        unreadOnly: options.unreadOnly || false
      });
      // res is the parsed server JSON: { success, data: { notifications, unreadCount, ... } }
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch notifications';
      setError(msg);
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await notificationAPI.getUnreadCount();
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Fetch unread count error:', err);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to mark notification as read';
      setError(msg);
      console.error('Mark as read error:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to mark all notifications as read';
      setError(msg);
      console.error('Mark all as read error:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete notification';
      setError(msg);
      console.error('Delete notification error:', err);
    }
  }, [notifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-fetch notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    } else {
      // Clear notifications when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setError('');
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Poll for new notifications every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

