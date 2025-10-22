import { 
  User, 
  LogIn, 
  Zap, 
  Wrench, 
  Scissors, 
  Building2, 
  Star, 
  Users, 
  CheckCircle,
  Smartphone,
  Shield,
  Clock
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import bannerImage from "../assets/banner.png";

export const Home = () => {
  const { loginWithRedirect } = useAuth0();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div
        className="relative min-h-screen lg:h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${bannerImage})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/80 via-rose-800/70 to-purple-900/60" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rose-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 pt-safe pb-safe">
          <div className="text-center text-white max-w-5xl">
            {/* Main heading with gradient text */}
            <div className="mb-6 space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="block bg-gradient-to-r from-white via-rose-100 to-purple-100 bg-clip-text text-transparent">
                  Welcome to
                </span>
                <span className="block text-white drop-shadow-lg">
                  Salvatore
                </span>
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl md:text-3xl mb-6 font-medium text-rose-100">
              Your One-Stop Platform for Professional Services
            </p>
            
            <p className="text-base sm:text-lg md:text-xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Connect with skilled professionals, manage your service business, and grow your client base.
              Join our thriving network of trusted service providers.
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-10 text-sm text-rose-100">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>10,000+ Service Providers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>4.9 Average Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span>Verified Professionals</span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <button
                onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' }})}
                className="group bg-gradient-to-r from-rose-600 to-rose-700 text-white px-8 py-4 rounded-xl hover:from-rose-700 hover:to-rose-800 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <User className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Join as Service Provider</span>
              </button>
              <button
                onClick={() => loginWithRedirect()}
                className="group bg-white/95 backdrop-blur-sm text-rose-700 px-8 py-4 rounded-xl hover:bg-white transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl border border-white/20"
              >
                <LogIn className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Sign In to Continue</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        {/* <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
            </div>
            <span className="text-xs font-medium">Scroll to explore</span>
          </div>
        </div>*/}
      </div> 

      {/* Features Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-rose-600">Salvatore</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to grow your service business and connect with clients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mobile-First Design</h3>
              <p className="text-gray-600 leading-relaxed">
                Optimized for mobile and web with a responsive design that works seamlessly across all devices.
              </p>
            </div>
            
            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Secure & Verified</h3>
              <p className="text-gray-600 leading-relaxed">
                All service providers are verified and background-checked for your safety and peace of mind.
              </p>
            </div>

            {/* Split trusted-professional attributes into separate cards */}
            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h3>
              <p className="text-gray-600 leading-relaxed">Significant experience working in relevant professional fields.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Deliveries</h3>
              <p className="text-gray-600 leading-relaxed">Impressive previous work, portfolio, and notable clients.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Work & Education</h3>
              <p className="text-gray-600 leading-relaxed">Relevant work experience and accredited expertise.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Client Satisfaction</h3>
              <p className="text-gray-600 leading-relaxed">Track record of positive client feedback.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Active Digital Presence</h3>
              <p className="text-gray-600 leading-relaxed">Up-to-date profiles across relevant networks following platform guidelines.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Language Proficiency</h3>
              <p className="text-gray-600 leading-relaxed">Fluent communication in English and/or Hindi.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-rose-400 to-rose-500 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">High Motivation</h3>
              <p className="text-gray-600 leading-relaxed">Professionally motivated to work with businesses and deliver results.</p>
            </div>

            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h3>
              <p className="text-gray-600 leading-relaxed">Top ratings and reviews demonstrating consistent excellence.</p>
            </div>
            
            <div className="group flex flex-col items-center text-center p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-rose-200">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">24/7 Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Round-the-clock customer support to help you with any questions or issues you may have.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Popular <span className="text-rose-600">Services</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with skilled professionals across various service categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="group flex flex-col items-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-300 cursor-pointer">
              <div className="bg-yellow-500 p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-center">Electrician</h3>
              <p className="text-sm text-gray-600 text-center mt-2">Electrical repairs & installations</p>
            </div>
            
            <div className="group flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 cursor-pointer">
              <div className="bg-blue-500 p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-center">Plumber</h3>
              <p className="text-sm text-gray-600 text-center mt-2">Plumbing & water solutions</p>
            </div>
            
            <div className="group flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 cursor-pointer">
              <div className="bg-purple-500 p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-center">Tailor</h3>
              <p className="text-sm text-gray-600 text-center mt-2">Custom tailoring services</p>
            </div>
            
            <div className="group flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 cursor-pointer">
              <div className="bg-orange-500 p-4 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-center">Carpenter</h3>
              <p className="text-sm text-gray-600 text-center mt-2">Woodwork & furniture</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-rose-600 to-purple-700 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="text-white">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">10K+</div>
              <div className="text-rose-100 text-sm sm:text-base">Service Providers</div>
            </div>
            <div className="text-white">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">50K+</div>
              <div className="text-rose-100 text-sm sm:text-base">Happy Customers</div>
            </div>
            <div className="text-white">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">100K+</div>
              <div className="text-rose-100 text-sm sm:text-base">Jobs Completed</div>
            </div>
            <div className="text-white">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">4.9★</div>
              <div className="text-rose-100 text-sm sm:text-base">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join thousands of service providers and customers who trust Salvatore for their service needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <button
              onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' }})}
              className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-8 py-4 rounded-xl hover:from-rose-700 hover:to-rose-800 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <User className="h-5 w-5" />
              <span className="font-semibold">Start Your Business</span>
            </button>
            <button
              onClick={() => loginWithRedirect()}
              className="bg-white text-rose-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl border border-gray-200"
            >
              <LogIn className="h-5 w-5" />
              <span className="font-semibold">Find Services</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
