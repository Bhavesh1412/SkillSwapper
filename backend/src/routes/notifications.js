// Notification routes

const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', getUnreadCount);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', markAsRead);

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put('/mark-all-read', markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', deleteNotification);

module.exports = router;

