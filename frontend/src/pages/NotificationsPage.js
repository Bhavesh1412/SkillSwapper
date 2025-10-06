import React, { useEffect, useMemo, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { matchAPI, getImageUrl } from '../services/api';
import { Bell, Check, X, Trash2, User, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const connectionRequests = useMemo(
    () => notifications.filter((n) => n.type === 'connection_request'),
    [notifications]
  );

  const others = useMemo(
    () => notifications.filter((n) => n.type !== 'connection_request'),
    [notifications]
  );

  const handleAccept = async (notification) => {
    const fromUserId = notification?.data?.fromUser?.id || notification.from_user_id;
    if (!fromUserId) return;
    try {
      setActionLoadingId(notification.id);
      await matchAPI.accept(fromUserId);
      toast.success('Connection request accepted');
      // Mark this notification read and refresh
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      await fetchNotifications();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to accept request';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecline = async (notification) => {
    const fromUserId = notification?.data?.fromUser?.id || notification.from_user_id;
    if (!fromUserId) return;
    try {
      setActionLoadingId(notification.id);
      await matchAPI.decline(fromUserId);
      toast.success('Connection request declined');
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }
      await fetchNotifications();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to decline request';
      toast.error(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderNotification = (n) => {
    return (
      <div key={n.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Bell className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-semibold text-gray-900">{n.title || 'Notification'}</h4>
                {!n.is_read && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">NEW</span>
                )}
              </div>
              <p className="text-sm text-gray-700 mt-1">{n.message}</p>

              {n.from_user_name && (
                <div className="flex items-center space-x-2 mt-2">
                  {n.from_user_pic ? (
                    <img
                      src={getImageUrl(n.from_user_pic)}
                      alt={n.from_user_name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-600" />
                    </div>
                  )}
                  <span className="text-xs text-gray-500">from {n.from_user_name}</span>
                </div>
              )}

              {/* Connection request actions */}
              {n.type === 'connection_request' && (
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => handleAccept(n)}
                    disabled={actionLoadingId === n.id}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(n)}
                    disabled={actionLoadingId === n.id}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {actionLoadingId === n.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-1" />
                    )}
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!n.is_read && (
              <button
                onClick={() => markAsRead(n.id)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark read
              </button>
            )}
            <button
              onClick={() => deleteNotification(n.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Bell className="h-6 w-6 mr-2 text-primary-500" /> Notifications
          </h2>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                {unreadCount} unread
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading notifications...
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-500" /> Connection Requests
              </h3>
              {connectionRequests.length === 0 ? (
                <div className="p-6 bg-white rounded-xl border border-gray-200 text-center text-gray-500">
                  No connection requests
                </div>
              ) : (
                <div className="space-y-3">
                  {connectionRequests.map(renderNotification)}
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary-500" /> Other Notifications
              </h3>
              {others.length === 0 ? (
                <div className="p-6 bg-white rounded-xl border border-gray-200 text-center text-gray-500">
                  Nothing here yet
                </div>
              ) : (
                <div className="space-y-3">
                  {others.map(renderNotification)}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;


