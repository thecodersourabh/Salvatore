import { Link } from "react-router-dom";
import { Scissors, User, Search, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { usePlatform } from "../hooks/usePlatform";
import { useLocationRedux } from "../hooks/useLocationRedux";
import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar/Sidebar";
import { NotificationBell } from "./ui/NotificationBell";
import { NotificationPanel } from "./NotificationPanel";


export function Navigation() {
  const { isAuthenticated, userContext: user, loginWithRedirect, currentRole } = useAuth();
  const { unreadCount, setIsNotificationPanelOpen } = useNotifications();
  const { isAndroid, isIOS, isNative } = usePlatform();
  const { city, requestLocationWithAddress, loading: locationLoading, error: locationError } = useLocationRedux();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic classes for mobile safe area
  const navClasses = `
    bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 shadow-md
    ${isNative ? 'pt-safe pb-3' : 'py-3'}
    ${isAndroid ? 'android-status-bar' : ''}
    ${isIOS ? 'ios-status-bar' : ''}
  `.trim().replace(/\s+/g, ' ');

  useEffect(() => {
    // Only request location once when authenticated, not cached, and not loading
    if (isAuthenticated && !city.includes('Getting') && !city.includes('Error') && !locationLoading) {
      // Location already available, no need to fetch
      return;
    }
    
    if (isAuthenticated && (city.includes('Getting') || city.includes('Error')) && !locationLoading) {
      requestLocationWithAddress();
    }
  }, [isAuthenticated]);

  const currentCity = city;

  // Keep nav in normal flow but ensure it appears above ion-page content
  const finalNavClasses = `${navClasses} relative z-20 w-full`;

  return (
    <nav className={finalNavClasses}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo and links */}
        <div className="flex items-center space-x-2 sm:space-x-6 flex-shrink-0">
          <Link to="/" className="flex items-center">
            <Scissors className="h-6 w-6 text-rose-600" />
          </Link>
          <div className="hidden lg:flex space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white text-sm">
              About
            </Link>
          </div>
        </div>

        {/* Search Bar - Only visible for authenticated customers */}
        {isAuthenticated && currentRole === 'customer' && (
          <div className="flex-1 max-w-xl sm:max-w-2xl lg:max-w-4xl mx-2 sm:mx-4">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-12 pr-16 sm:pr-20 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-gray-600 dark:text-gray-300">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium" title={locationError ? 'Unable to get location' : `Current location: ${currentCity}`}>
                  {currentCity}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right side items */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Notification Bell */}
          <NotificationBell
            count={unreadCount}
            color="primary"
            onClick={() => setIsNotificationPanelOpen(true)}
            ariaLabel={`${unreadCount} unread notifications`}
          />

          {isAuthenticated ? (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
            >
              <img
                src={(user as any)?.picture}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-rose-200 dark:border-rose-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden xl:inline">{(user as any)?.name}</span>
            </button>
          ) : (
            <button
              onClick={() => loginWithRedirect()}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center space-x-1"
            >
              <User className="h-5 w-5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Notification Panel */}
      <NotificationPanel />
    </nav>
  );
}

