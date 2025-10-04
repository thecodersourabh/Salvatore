import { Link } from 'react-router-dom';
import { X, Package, MessageSquare, CreditCard, Star, AlertCircle, CheckCircle, Bell, Trash2, CheckCheck } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { usePlatform } from '../hooks/usePlatform';
import { Notification } from '../services/notificationService';

export const NotificationPanel = () => {
  const {
    notifications,
    isNotificationPanelOpen,
    setIsNotificationPanelOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addTestNotification,
    unreadCount
  } = useNotification();
  const { isNative } = usePlatform();

  if (!isNotificationPanelOpen) return null;

  // Get notification icon with better styling
  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { className: 'h-5 w-5' };
    switch (type) {
      case 'order': return <Package {...iconProps} className="h-5 w-5 text-emerald-500" />;
      case 'message': return <MessageSquare {...iconProps} className="h-5 w-5 text-blue-500" />;
      case 'payment': return <CreditCard {...iconProps} className="h-5 w-5 text-purple-500" />;
      case 'review': return <Star {...iconProps} className="h-5 w-5 text-yellow-500" />;
      case 'system': return <AlertCircle {...iconProps} className="h-5 w-5 text-gray-500" />;
      default: return <AlertCircle {...iconProps} className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get notification badge color
  const getBadgeColor = (type: Notification['type']) => {
    switch (type) {
      case 'order': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      case 'message': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'payment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'system': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop with animation */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={() => setIsNotificationPanelOpen(false)}
      />

      {/* Notification panel - full screen on mobile, sidebar on desktop */}
      <div className={`
        relative ml-auto w-full sm:w-96 bg-white dark:bg-gray-900 h-full shadow-2xl 
        flex flex-col animate-in slide-in-from-right-full duration-300
        ${isNative ? 'pt-safe' : ''}
      `}>
        {/* Modern Header */}
        <div className="relative p-6 bg-gradient-to-r from-rose-600 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="text-rose-100 text-sm">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationPanelOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Quick Action Bar */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {notifications.length} total
              </span>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-full transition-colors"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={clearAllNotifications}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Clear all</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications content */}
        {notifications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-xs mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/20 dark:to-red-900/20 rounded-full flex items-center justify-center">
                <Bell className="h-12 w-12 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No notifications yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Stay tuned! You'll receive notifications here when you get orders, messages, or important updates.
              </p>
              <button
                onClick={() => addTestNotification('order', '🎯 New Order Received', 'You have a new tailoring order from John Doe')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm font-medium rounded-lg hover:from-rose-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Package className="h-4 w-4" />
                <span>Add Test Notification</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`group relative p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                      !notification.isRead 
                        ? 'bg-gradient-to-r from-rose-50 via-white to-red-50 dark:from-rose-900/10 dark:via-gray-800 dark:to-red-900/10 border-l-4 border-l-rose-500 shadow-sm' 
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.3s ease-out'
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Icon with background */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'order' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        notification.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        notification.type === 'payment' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        notification.type === 'review' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Type badge */}
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(notification.type)}`}>
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                              </span>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            
                            {/* Title */}
                            <h4 className={`text-sm font-semibold mb-1 ${
                              notification.isRead 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            
                            {/* Message */}
                            <p className={`text-sm leading-relaxed ${
                              notification.isRead 
                                ? 'text-gray-500 dark:text-gray-400' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            
                            {/* Timestamp */}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </p>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex flex-col items-center space-y-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-gray-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className={`border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 ${isNative ? 'pb-safe' : ''}`}>
              <Link
                to="/notification-test"
                onClick={() => setIsNotificationPanelOpen(false)}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Bell className="h-4 w-4" />
                <span>View All Notifications</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};