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
  const { userContext: user, logout, isAuthenticated, loading: loading } = useAuth();
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className={`relative w-full max-w-md bg-white h-full shadow-xl flex flex-col ${isNative ? 'pt-safe' : ''}`}>
        {/* Header */}        
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-rose-600" />
            <h2 className="text-lg font-semibold">My Profile</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Profile Info */}
          <Link 
            to="/profile" 
            onClick={onClose}
            className="block p-4 border-b bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              {picture && (
                <img 
                  src={picture} 
                  alt={name || "Profile"} 
                  className="w-12 h-12 rounded-full border-2 border-rose-200"
                />
              )}
              <div className="ml-4">
                <h3 className="font-medium text-gray-900">{name}</h3>
                <p className="text-sm text-gray-600">{email}</p>
              </div>
            </div>
          </Link>          
          {/* Menu Items - Scrollable */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {menuItems.map((item) => (
                <li key={item.label}>
                  {item.action ? (
                    <button
                      onClick={item.action}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <Link 
                      to={item.link}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className={`border-t p-4 ${isNative ? 'pb-safe' : ''}`}>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
