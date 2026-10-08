import { query } from '../config/database.js';

/**
 * 1. GET NOTIFICATIONS
 * Retrieve notifications for the authenticated user only
 */
export const getNotifications = async (userId) => {
  const res = await query(
    `SELECT id, user_id as "userId", title, message, notification_type as "notificationType",
            is_read as "isRead", created_at as "createdAt", read_at as "readAt"
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return res.rows;
};

/**
 * 2. MARK NOTIFICATION AS READ
 * Strict ownership enforcement: Users can only mark their own notifications as read
 */
export const markAsRead = async (userId, notificationId) => {
  const check = await query('SELECT id, user_id FROM notifications WHERE id = $1', [notificationId]);

  if (check.rows.length === 0) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].user_id !== userId) {
    const err = new Error("Access denied: You cannot access or modify another user's notification.");
    err.statusCode = 403;
    throw err;
  }

  const updateRes = await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id as "userId", title, message, notification_type as "notificationType",
               is_read as "isRead", created_at as "createdAt", read_at as "readAt"`,
    [notificationId, userId]
  );

  return updateRes.rows[0];
};

/**
 * 3. MARK ALL NOTIFICATIONS AS READ
 * Marks all pending unread notifications for the authenticated user as read
 */
export const markAllAsRead = async (userId) => {
  const updateRes = await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING id`,
    [userId]
  );

  return {
    success: true,
    message: 'All notifications marked as read successfully.',
    updatedCount: updateRes.rowCount,
  };
};

/**
 * 4. DISPATCH NOTIFICATION HELPER
 * Utility to create a notification for any user
 */
export const createNotification = async ({ userId, title, message, type = 'GENERAL' }) => {
  const res = await query(
    `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
     VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
     RETURNING id, user_id as "userId", title, message, notification_type as "notificationType",
               is_read as "isRead", created_at as "createdAt"`,
    [userId, title, message, type]
  );
  return res.rows[0];
};
