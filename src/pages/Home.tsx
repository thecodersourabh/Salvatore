import { User, LogIn } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";

export const Home = () => {
  const { loginWithRedirect } = useAuth0();
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1528578950694-9f79b45a3397?auto=format&fit=crop&q=80")',
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-6xl font-bold mb-6">
              Welcome to Salvatore
            </h1>
            <p className="text-2xl mb-8">
              Your One-Stop Platform for Professional Services
            </p>
            <p className="text-xl mb-12 text-gray-200">
              Connect with skilled professionals, manage your service business, and grow your client base.
              Join our network of electricians, plumbers, tailors, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' }})}
                className="bg-rose-600 text-white px-8 py-4 rounded-lg hover:bg-rose-700 transition flex items-center justify-center space-x-2"
              >
                <User className="h-5 w-5" />
                <span>Register as Service Provider</span>
              </button>
              <button
                onClick={() => loginWithRedirect()}
                className="bg-white text-rose-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition flex items-center justify-center space-x-2"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign In to Your Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Salvatore?</h2>
            <p className="text-xl text-gray-600">Everything you need to grow your service business</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-rose-100 p-4 rounded-full mb-6">
                <User className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Professional Profile</h3>
              <p className="text-gray-600">Build your professional presence with a customized profile that showcases your expertise and services.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-rose-100 p-4 rounded-full mb-6">
                <LogIn className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Easy Management</h3>
              <p className="text-gray-600">Manage bookings, client communications, and service scheduling all in one place.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="bg-rose-100 p-4 rounded-full mb-6">
                <User className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Client Growth</h3>
              <p className="text-gray-600">Connect with new clients and grow your business through our platform's network.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
