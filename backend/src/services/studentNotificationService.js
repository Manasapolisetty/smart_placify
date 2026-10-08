import { query } from '../config/database.js';

/**
 * 10. GET NOTIFICATIONS
 * Returns notifications belonging exclusively to the authenticated student
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
 * 10. PUT NOTIFICATION READ
 * Marks a specific notification as read with strict user ownership validation
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  const check = await query('SELECT id, user_id FROM notifications WHERE id = $1', [notificationId]);

  if (check.rows.length === 0) {
    const err = new Error('Notification not found.');
    err.statusCode = 404;
    throw err;
  }

  if (check.rows[0].user_id !== userId) {
    const err = new Error('Access denied: You do not have permission to access this notification.');
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
 * 10. PUT ALL NOTIFICATIONS READ
 * Marks all pending unread notifications for the user as read
 */
export const markAllNotificationsAsRead = async (userId) => {
  const updateRes = await query(
    `UPDATE notifications
     SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING id`,
    [userId]
  );

  return {
    message: 'All notifications marked as read successfully.',
    updatedCount: updateRes.rowCount,
  };
};
