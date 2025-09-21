// Notification controller for managing user notifications

const { Notification, User } = require('../models/database');

/**
 * Get user's notifications
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;

        // Validate pagination parameters
        const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const offsetNum = Math.max(parseInt(offset) || 0, 0);

        const notifications = await Notification.getByUserId(userId, {
            limit: limitNum,
            offset: offsetNum,
            unreadOnly: unreadOnly === 'true'
        });

        // Get unread count
        const unreadCount = await Notification.getUnreadCount(userId);

        // Process notifications to parse JSON data
        const processedNotifications = notifications.map(notification => ({
            ...notification,
            data: notification.data ? JSON.parse(notification.data) : null,
            timeAgo: getTimeAgo(notification.created_at)
        }));

        res.json({
            success: true,
            data: {
                notifications: processedNotifications,
                unreadCount,
                pagination: {
                    limit: limitNum,
                    offset: offsetNum,
                    hasMore: notifications.length === limitNum
                }
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await Notification.getUnreadCount(userId);

        res.json({
            success: true,
            data: { unreadCount }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        if (isNaN(notificationId) || notificationId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        await Notification.markAsRead(notificationId, userId);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.markAllAsRead(userId);

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        if (isNaN(notificationId) || notificationId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        await Notification.delete(notificationId, userId);

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Create a notification (internal use)
 * @param {Object} notificationData - Notification data
 * @returns {Promise<number>} Notification ID
 */
const createNotification = async (notificationData) => {
    try {
        const notificationId = await Notification.create(notificationData);
        return notificationId;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

/**
 * Create connection request notification
 * @param {number} fromUserId - User who sent the request
 * @param {number} toUserId - User who receives the request
 * @param {Object} matchData - Match data
 * @returns {Promise<number>} Notification ID
 */
const createConnectionRequestNotification = async (fromUserId, toUserId, matchData) => {
    try {
        const fromUser = await User.findById(fromUserId);
        if (!fromUser) {
            throw new Error('From user not found');
        }

        const notificationData = {
            user_id: toUserId,
            from_user_id: fromUserId,
            type: 'connection_request',
            title: 'New Connection Request',
            message: `${fromUser.name} wants to connect with you for skill swapping!`,
            data: {
                matchData,
                fromUser: {
                    id: fromUser.id,
                    name: fromUser.name,
                    profile_pic: fromUser.profile_pic
                }
            }
        };

        return await createNotification(notificationData);
    } catch (error) {
        console.error('Create connection request notification error:', error);
        throw error;
    }
};

/**
 * Helper function to get time ago string
 * @param {Date} date - Date to compare
 * @returns {string} Time ago string
 */
const getTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return notificationDate.toLocaleDateString();
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    createConnectionRequestNotification
};

