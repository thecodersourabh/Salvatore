import { IonIcon } from '@ionic/react';
import { homeOutline, personOutline, home, person, chatbubbleOutline, chatbubble } from 'ionicons/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface MobileNavBarProps {
  className?: string;
}

export function MobileNavBar({ 
  className = ""
}: MobileNavBarProps) {
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userContext } = useAuth();
  

  // Don't show footer if user is not logged in
  if (!isAuthenticated) {
    return null;
  }

  const handleNavigation = (path: string) => {
    // Close ChatBot if it's open when navigating to other sections
    const closeChatEvent = new CustomEvent('closeChatBot');
    window.dispatchEvent(closeChatEvent);
    navigate(path);
  };

  const handleProfileNavigation = () => {
    // Close ChatBot if it's open when navigating to profile
    const closeChatEvent = new CustomEvent('closeChatBot');
    window.dispatchEvent(closeChatEvent);
    
    if (isAuthenticated && userContext?.userName) {
      navigate(`/profile/${userContext.userName}`);
    } else if (isAuthenticated) {
      navigate('/profile');
    } else {
      navigate('/auth');
    }
  };

  const handleChatNavigation = () => {
    // Trigger the floating ChatBot component
    const chatEvent = new CustomEvent('openChatBot');
    window.dispatchEvent(chatEvent);
  };

  const isActive = (path: string) => {
    if (path === '/profile') {
      return location.pathname === '/profile' || location.pathname.startsWith('/profile/');
    }
    if (path === '/chat') {
      // Chat doesn't have a route, so we can't detect if it's "active"
      // For now, never show as active since it's a floating component
      return false;
    }
    return location.pathname === path;
  };

  return (
    <footer className={`
      fixed bottom-0 left-0 right-0 z-50 
      bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
      border-t border-gray-200 dark:border-gray-700
      px-3 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]
      md:hidden
      ${className}
    `.trim().replace(/\s+/g, ' ')}>
      <div className="max-w-sm mx-auto">
        <div className="flex items-center justify-around">
          
          {/* Home Button */}
          <button
            onClick={() => handleNavigation('/')}
            className={`
              flex flex-col items-center justify-center
              px-2 py-1 rounded-lg 
              transition-colors duration-200
              ${isActive('/') 
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
              }
            `.trim().replace(/\s+/g, ' ')}
            aria-label="Go to home"
          >
            <IonIcon 
              icon={isActive('/') ? home : homeOutline} 
              className="w-5 h-5 mb-0.5" 
            />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Chat Button */}
          <button
            onClick={handleChatNavigation}
            className={`
              flex flex-col items-center justify-center
              px-2 py-1 rounded-lg 
              transition-colors duration-200
              ${isActive('/chat') 
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
              }
            `.trim().replace(/\s+/g, ' ')}
            aria-label="Go to chat"
          >
            <IonIcon 
              icon={isActive('/chat') ? chatbubble : chatbubbleOutline} 
              className="w-5 h-5 mb-0.5" 
            />
            <span className="text-xs font-medium">Chat</span>
          </button>

          {/* Profile Button */}
          <button
            onClick={handleProfileNavigation}
            className={`
              flex flex-col items-center justify-center
              px-2 py-1 rounded-lg 
              transition-colors duration-200
              ${isActive('/profile') 
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' 
                : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
              }
            `.trim().replace(/\s+/g, ' ')}
            aria-label="Go to profile"
          >
            <IonIcon 
              icon={isActive('/profile') ? person : personOutline} 
              className="w-5 h-5 mb-0.5" 
            />
            <span className="text-xs font-medium">
              {isAuthenticated ? 'Profile' : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}