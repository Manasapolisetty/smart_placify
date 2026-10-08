import * as studentNotificationService from '../services/studentNotificationService.js';
import { successResponse } from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await studentNotificationService.getNotifications(req.user.id);
    return successResponse(res, 'Notifications retrieved successfully', notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await studentNotificationService.markNotificationAsRead(req.user.id, req.params.id);
    return successResponse(res, 'Notification marked as read', notification);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await studentNotificationService.markAllNotificationsAsRead(req.user.id);
    return successResponse(res, result.message, result);
  } catch (error) {
    next(error);
  }
};
