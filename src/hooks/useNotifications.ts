import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  updateNotification,
  addTestNotification,
  setIsNotificationPanelOpen,
  Notification,
} from '../store/slices/notificationSlice';
import { useMemo, useCallback } from 'react';

// Custom hook that provides notification functionality using Redux
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.notifications?.notifications || []);
  const isNotificationPanelOpen = useAppSelector(state => state.notifications?.isNotificationPanelOpen || false);
  const unreadCount = useAppSelector(state => 
    (state.notifications?.notifications || []).filter(n => !n.isRead).length
  );

  // Note: Event listeners are handled by NotificationProvider, not here
  
  const markNotificationAsRead = useCallback((id: string) => {
    dispatch(markAsRead(id));
  }, [dispatch]);

  const markAllNotificationsAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const deleteNotificationById = useCallback((id: string) => {
    dispatch(deleteNotification(id));
  }, [dispatch]);

  const clearNotifications = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  const updateNotificationById = useCallback((id: string, patch: Partial<Notification>) => {
    dispatch(updateNotification({ id, patch }));
  }, [dispatch]);

  const addTestNotificationHandler = useCallback((type: Notification['type'], title: string, message: string) => {
    dispatch(addTestNotification({ type, title, message }));
  }, [dispatch]);

  const setNotificationPanelOpen = useCallback((isOpen: boolean) => {
    dispatch(setIsNotificationPanelOpen(isOpen));
  }, [dispatch]);

  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter((n: Notification) => n.type === type);
  }, [notifications]);

  return useMemo(() => ({
    notifications,
    isNotificationPanelOpen,
    unreadCount,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: deleteNotificationById,
    clearAllNotifications: clearNotifications,
    updateNotification: updateNotificationById,
    addTestNotification: addTestNotificationHandler,
    setIsNotificationPanelOpen: setNotificationPanelOpen,
    getNotificationsByType,
  }), [
    notifications,
    isNotificationPanelOpen,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotificationById,
    clearNotifications,
    updateNotificationById,
    addTestNotificationHandler,
    setNotificationPanelOpen,
    getNotificationsByType,
  ]);
};