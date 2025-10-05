import { Link } from "react-router-dom";
import { Scissors, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import { usePlatform } from "../hooks/usePlatform";
import { useState } from "react";
import { Sidebar } from "./Sidebar/Sidebar";
import { NotificationBell } from "./ui/NotificationBell";
import { NotificationPanel } from "./NotificationPanel";


export function Navigation() {
  //const { setIsCartOpen, items } = useCart();
  const { isAuthenticated, userContext: user, loginWithRedirect } = useAuth();
  const { unreadCount, setIsNotificationPanelOpen } = useNotification();
  const { isAndroid, isIOS, isNative } = usePlatform();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dynamic classes for mobile safe area
  const navClasses = `
    bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 shadow-md
    ${isNative ? 'pt-safe pb-3' : 'py-3'}
    ${isAndroid ? 'android-status-bar' : ''}
    ${isIOS ? 'ios-status-bar' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <Scissors className="h-6 w-6 text-rose-600" />
            <span className="text-xl font-semibold dark:text-white">FabricCraft</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              About
            </Link>
            
          </div>
        </div>
        <div className="flex items-center space-x-6">
          {/* <button className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            <Heart className="h-5 w-5" />
          </button> */}
          
         
          
          {/* <button
            onClick={() => setIsCartOpen(true)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button> */}
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
                className="h-8 w-8 rounded-full border-2 border-rose-200 dark:border-rose-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 hidden md:inline">{(user as any)?.name}</span>
            </button>
          ) : (
            <button
              onClick={() => loginWithRedirect()}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center space-x-1"
            >
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel />
    </nav>
  );
}
