import * as notificationService from '../services/notificationService.js';
import { successResponse } from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const list = await notificationService.getNotifications(req.user.id);
    return successResponse(res, 'Notifications retrieved successfully', list);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notif = await notificationService.markAsRead(req.user.id, req.params.id);
    return successResponse(res, 'Notification marked as read', notif);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, result.message || 'All notifications marked as read', result);
  } catch (error) {
    next(error);
  }
};
