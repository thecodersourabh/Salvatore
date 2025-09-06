import { Link } from "react-router-dom";
import { Scissors, Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { ProfilePanel } from "./ProfilePanel/ProfilePanel";

export function Navigation() {
  const { setIsCartOpen, items } = useCart();
  const { isAuthenticated, userContext: user, loginWithRedirect, loading: loading } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Log authentication state changes
  useEffect(() => {
    console.log('🧭 Navigation: Auth state changed:', {
      isAuthenticated,
      loading,
      userEmail: (user as any)?.email,
      userName: (user as any)?.name,
    });
  }, [isAuthenticated, user, loading]);

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <Scissors className="h-6 w-6 text-rose-600" />
            <span className="text-xl font-semibold">FabricCraft</span>
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Home
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link to="/design" className="text-gray-600 hover:text-gray-900">
              Create Own Design
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <button className="text-gray-600 hover:text-gray-900">
            <Heart className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-gray-600 hover:text-gray-900 relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </button>
          {isAuthenticated ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center space-x-2 hover:opacity-75 transition-opacity"
            >
              <img
                src={(user as any)?.picture}
                className="h-8 w-8 rounded-full border-2 border-rose-200"
              />
              <span className="text-sm text-gray-700 hidden md:inline">{(user as any)?.name}</span>
            </button>
          ) : (
            <button
              onClick={() => loginWithRedirect()}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Profile Panel */}
          <ProfilePanel
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      </div>
    </nav>
  );
}
