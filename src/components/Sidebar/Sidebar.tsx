import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { usePlatform } from "../../hooks/usePlatform";
import { 
  User, 
  Package, 
  Heart, 
  CreditCard, 
  MapPin, 
  Settings, 
  LogOut, 
  X,
  ShoppingBag,
  ShoppingCart
} from "lucide-react";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  picture?: string;
  name?: string;
  email?: string;
  // Add other properties as needed
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { userContext: user, logout } = useAuth();
  const { setIsCartOpen } = useCart();
  const { isNative } = usePlatform();

  const { picture, name, email } = (user || {}) as UserProfile;

  // Track sidebar state changes
  

  const handleCartClick = () => {
    onClose(); // Close sidebar
    setIsCartOpen(true); // Open cart panel
  };

  const handleLogout = () => {
    onClose(); // Close sidebar before logout
    logout(); // This will now use the configured logout URL from AuthContext
  };

  const menuItems = [
    {
      icon: ShoppingCart,
      label: "Shopping Cart",
      action: handleCartClick
    },
    {
      icon: Package,
      label: "My Orders",
      link: "/orders"
    },
    {
      icon: ShoppingBag,
      label: "My Designs",
      link: "/profile/my-designs"
    },
    {
      icon: Heart,
      label: "Wishlist",
      link: "/wishlist"
    },
    {
      icon: CreditCard,
      label: "Payment Methods",
      link: "/profile/payments"
    },
    {
      icon: MapPin,
      label: "Saved Addresses",
      link: "/addresses"
    },
    {
      icon: Settings,
      label: "Account Settings",
      link: "/profile/settings"
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="sidebar-overlay">
      {/* Backdrop */}
      <div
        className="sidebar-backdrop"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`sidebar-container bg-white h-full shadow-xl flex flex-col ${isNative ? 'sidebar-safe-top' : ''}`}>
        {/* Header */}        
        <div className="p-4 sm:p-6 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="sidebar-icon-mobile text-rose-600" />
            <h2 className="text-xl sm:text-lg font-semibold text-gray-900">My Profile</h2>
          </div>
          <button 
            onClick={onClose}
            className="sidebar-close-btn text-gray-500 hover:text-gray-700 transition-colors sidebar-focusable"
          >
            <X className="sidebar-icon-mobile" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Profile Info */}
          <Link 
            to="/profile" 
            onClick={onClose}
            className="sidebar-profile block p-4 sm:p-6 border-b bg-gray-50 hover:bg-gray-100 transition-colors sidebar-focusable"
          >
            <div className="flex items-center">
              {picture && (
                <img 
                  src={picture} 
                  alt={name || "Profile"} 
                  className="w-14 h-14 sm:w-12 sm:h-12 rounded-full border-2 border-rose-200"
                />
              )}
              <div className="ml-4">
                <h3 className="font-medium text-gray-900 text-base sm:text-sm">{name}</h3>
                <p className="text-sm sm:text-xs text-gray-600">{email}</p>
              </div>
            </div>
          </Link>          
          {/* Menu Items - Scrollable */}
          <nav className="sidebar-nav flex-1 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {menuItems.map((item) => (
                <li key={item.label}>
                  {item.action ? (
                    <button
                      onClick={item.action}
                      className="sidebar-menu-item flex items-center space-x-3 w-full px-4 sm:px-6 py-4 sm:py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left sidebar-focusable"
                    >
                      <item.icon className="sidebar-icon-mobile text-gray-600" />
                      <span className="text-base sm:text-sm font-medium">{item.label}</span>
                    </button>
                  ) : (
                    <Link 
                      to={item.link}
                      className="sidebar-menu-item flex items-center space-x-3 px-4 sm:px-6 py-4 sm:py-3 text-gray-700 hover:bg-gray-50 transition-colors sidebar-focusable"
                      onClick={onClose}
                    >
                      <item.icon className="sidebar-icon-mobile text-gray-600" />
                      <span className="text-base sm:text-sm font-medium">{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className={`border-t p-4 sm:p-6 ${isNative ? 'sidebar-safe-bottom' : ''}`}>
            <button
              onClick={handleLogout}
              className="sidebar-button flex items-center justify-center space-x-2 w-full px-4 py-3 sm:py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg sm:rounded-md transition-colors font-medium text-base sm:text-sm sidebar-focusable"
            >
              <LogOut className="sidebar-icon-mobile" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
