import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Zap,
  MessageCircle,
  Star,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  Heart,
  Award,
  Sparkles,
  Loader,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSectorTranslation } from '../hooks/useSectorTranslation';
import { useFilterPersistence } from '../hooks/useFilterPersistence';
import { ProductCard } from '../components/ProductCard';
import { EnhancedFilters } from '../components/EnhancedFilters';
import { ClientProductService, ProductFilters, ClientProductResponse } from '../services/clientProductService';
import sectorServices from '../config/sectorServices.json';

export const ClientHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { translateSector } = useSectorTranslation();
  
  // Enhanced filters with persistence
  const {
    filters,
    updateFilters,
    clearFilters: clearPersistedFilters,
    getActiveFilterCount
  } = useFilterPersistence({
    searchQuery: searchParams.get('search') || undefined,
    priceRange: { min: 0, max: 200000 }
  });
  
  // Legacy state for backward compatibility
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSector, setSelectedSector] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEnhancedFilters, setShowEnhancedFilters] = useState(false);
  
  // Product data state
  const [products, setProducts] = useState<ClientProductResponse[]>([]);
  const [recentProducts, setRecentProducts] = useState<ClientProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Ref for category scroll container
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref for recent services scroll container
  const recentServicesScrollRef = useRef<HTMLDivElement>(null);
  const recentScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for search parameter changes
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [searchParams]);

  // Extract sectors from config
  const sectors = Object.keys(sectorServices);

  // Fetch products with enhanced filters
  const fetchProducts = async (customFilters?: ProductFilters) => {
    try {
      setError(null);
      const requestFilters = customFilters || {
        ...filters,
        searchQuery: searchQuery || undefined,
        limit: 20
      };
      
      const response = await ClientProductService.getProducts(requestFilters);
      setProducts(response.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load services. Please try again.');
    }
  };

  // Fetch recent products
  const fetchRecentProducts = async () => {
    try {
      const response = await ClientProductService.getRecentProducts({ limit: 8 });
      setRecentProducts(response.products);
    } catch (err) {
      console.error('Failed to fetch recent products:', err);
    }
  };

  // Handle enhanced filters change
  const handleFiltersChange = (newFilters: ProductFilters) => {
    updateFilters(newFilters);
    fetchProducts(newFilters);
    
    // Update legacy state for backward compatibility
    if (newFilters.category) {
      setSelectedSector(newFilters.category);
    }
    if (newFilters.searchQuery) {
      setSearchQuery(newFilters.searchQuery);
    }
    if (newFilters.priceRange) {
      setPriceRange([newFilters.priceRange.min || 0, newFilters.priceRange.max || 200000]);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchRecentProducts()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh data when filters change
  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [selectedSector, searchQuery, priceRange]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchRecentProducts()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter providers based on search and filters
  const filteredProviders = useMemo(() => {
    return products.filter(product => {
      // Exclude user's own products when browsing as customer
      const currentUserId = localStorage.getItem('x-user-id');
      const userEmail = user?.email;
      const userSub = (user as any)?.sub;
      
      const isOwnProduct = product.createdBy && (
        product.createdBy === currentUserId ||
        product.createdBy === userEmail ||
        product.createdBy === userSub ||
        product.createdByName === userEmail
      );
      
      // Skip own products in customer view
      if (isOwnProduct) {
        return false;
      }
      
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSector = selectedSector === 'All' || product.category === selectedSector.toLowerCase();
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesSector && matchesPrice;
    });
  }, [products, searchQuery, selectedSector, priceRange, user]);

  const getSectorIcon = (sector: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Technology': <Zap className="h-5 w-5" />,
      'Electrician': <Zap className="h-5 w-5" />,
      'Plumber': <Award className="h-5 w-5" />,
      'Cleaner': <Sparkles className="h-5 w-5" />,
      'Carpenter': <Award className="h-5 w-5" />,
      'Beautician': <Heart className="h-5 w-5" />
    };
    return icons[sector] || <Star className="h-5 w-5" />;
  };

  const getCategoryImage = (sector: string) => {
    const images: Record<string, string> = {
      'Technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=100&h=100&fit=crop&crop=center',
      'Electrician': 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=100&h=100&fit=crop&crop=center',
      'Plumber': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=100&h=100&fit=crop&crop=center',
      'Cleaner': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=100&h=100&fit=crop&crop=center',
      'Carpenter': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100&h=100&fit=crop&crop=center',
      'Beautician': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100&h=100&fit=crop&crop=center'
    };
    return images[sector] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center';
  };

  // Auto-scroll functions for hover with proper circular infinite scroll
  const startAutoScrollLeft = () => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      if (categoryScrollRef.current) {
        const container = categoryScrollRef.current;
        container.scrollLeft -= 2;
        
        // Seamless infinite scroll: when we reach the beginning of the first set,
        // jump to the equivalent position in the middle set
        const totalWidth = container.scrollWidth / 3;
        if (container.scrollLeft <= 0) {
          container.scrollLeft = totalWidth;
        }
      }
    }, 16);
  };

  const startAutoScrollRight = () => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      if (categoryScrollRef.current) {
        const container = categoryScrollRef.current;
        container.scrollLeft += 2;
        
        // Seamless infinite scroll: when we reach the end of the second set,
        // jump back to the equivalent position in the middle set
        const totalWidth = container.scrollWidth / 3;
        if (container.scrollLeft >= totalWidth * 2) {
          container.scrollLeft = totalWidth;
        }
      }
    }, 16);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (recentScrollIntervalRef.current) {
        clearInterval(recentScrollIntervalRef.current);
      }
    };
  }, []);

  // Initialize scroll positions to middle set for seamless infinite scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      if (categoryScrollRef.current && sectors.length > 0) {
        const container = categoryScrollRef.current;
        const totalWidth = container.scrollWidth / 3;
        container.scrollLeft = totalWidth;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [sectors]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (recentServicesScrollRef.current && recentProducts.length > 0) {
        const container = recentServicesScrollRef.current;
        const totalWidth = container.scrollWidth / 3;
        container.scrollLeft = totalWidth;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [recentProducts]);

  // Auto-scroll functions for recent services with proper circular infinite scroll
  const startAutoScrollRecentLeft = () => {
    if (recentScrollIntervalRef.current) return;
    recentScrollIntervalRef.current = setInterval(() => {
      if (recentServicesScrollRef.current && recentProducts.length > 0) {
        const container = recentServicesScrollRef.current;
        container.scrollLeft -= 2;
        
        // Seamless infinite scroll: when we reach the beginning of the first set,
        // jump to the equivalent position in the middle set
        const totalWidth = container.scrollWidth / 3;
        if (container.scrollLeft <= 0) {
          container.scrollLeft = totalWidth;
        }
      }
    }, 16);
  };

  const startAutoScrollRecentRight = () => {
    if (recentScrollIntervalRef.current) return;
    recentScrollIntervalRef.current = setInterval(() => {
      if (recentServicesScrollRef.current && recentProducts.length > 0) {
        const container = recentServicesScrollRef.current;
        container.scrollLeft += 2;
        
        // Seamless infinite scroll: when we reach the end of the second set,
        // jump back to the equivalent position in the middle set
        const totalWidth = container.scrollWidth / 3;
        if (container.scrollLeft >= totalWidth * 2) {
          container.scrollLeft = totalWidth;
        }
      }
    }, 16);
  };

  const stopAutoScrollRecent = () => {
    if (recentScrollIntervalRef.current) {
      clearInterval(recentScrollIntervalRef.current);
      recentScrollIntervalRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-purple-800 text-white">
       
      </div>

      {/* Quick Actions - Desktop only: Quick Service and Prime Solution */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="hidden md:grid md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate('/quick-service')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-center border border-gray-200 dark:border-gray-700"
          >
            <div className="bg-rose-100 dark:bg-rose-900/20 p-3 rounded-full w-fit mx-auto mb-3">
              <Zap className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Quick Service</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Immediate help</p>
          </button>

          <button
            onClick={() => navigate('/solution-query')}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 text-center border border-gray-200 dark:border-gray-700"
          >
            <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full w-fit mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Get Solution</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Complex problems</p>
          </button>
        </div>

        {/* Recent Services - Ribbon Pattern */}
        {recentProducts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Recent Services</h2>
              <button 
                onClick={() => navigate('/orders')}
                className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            {/* Desktop Ribbon Layout */}
            <div className="hidden md:block relative">
              {/* Hidden Left Hover Zone */}
              <div
                onMouseEnter={startAutoScrollRecentLeft}
                onMouseLeave={stopAutoScrollRecent}
                className="absolute left-0 top-0 bottom-0 w-20 z-10 cursor-pointer"
              />
              
              {/* Hidden Right Hover Zone */}
              <div
                onMouseEnter={startAutoScrollRecentRight}
                onMouseLeave={stopAutoScrollRecent}
                className="absolute right-0 top-0 bottom-0 w-20 z-10 cursor-pointer"
              />

              <div 
                ref={recentServicesScrollRef}
                className="flex items-center justify-center space-x-8 py-8 overflow-x-auto scrollbar-hide px-6"
                style={{ scrollBehavior: 'auto' }}
              >
                {recentProducts.length > 0 && (
                  <>
                    {/* Create triple set for seamless infinite scroll: [All items] + [All items] + [All items] */}
                    {[...Array(3)].map((_, setIndex) => 
                      recentProducts.slice(0, 6).map((product, index) => (
                        <div
                          key={`set${setIndex}-${product.id}-${index}`}
                          className="relative group cursor-pointer flex-shrink-0"
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-0.5 shadow-lg group-hover:shadow-xl transition-all group-hover:scale-110">
                              <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center group-hover:bg-gray-50 dark:group-hover:bg-gray-700 transition-colors overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                  <img 
                                    src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url} 
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <>
                                    <div className="text-blue-600 dark:text-blue-400 mb-1">
                                      {getSectorIcon(product.category || 'service')}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                        {product.providerInfo?.rating?.toFixed(1) || '5.0'}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Mobile Horizontal Ribbon */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recentProducts.slice(0, 8).map((product) => (
                  <div
                    key={product.id}
                    className="flex-shrink-0 group cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-0.5 shadow-lg group-hover:shadow-xl transition-all group-active:scale-95">
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <>
                            <div className="text-blue-600 dark:text-blue-400 mb-1">
                              {getSectorIcon(product.category || 'service')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-2.5 w-2.5 text-yellow-400 fill-current" />
                              <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                {product.providerInfo?.rating?.toFixed(1) || '5.0'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-center max-w-20">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{product.providerInfo?.name || product.createdBy}</p>
                    </div>
                  </div>
                ))}
                
                {/* View More Circle */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => navigate('/orders')}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    <div className="text-gray-600 dark:text-gray-300">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  </button>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white text-center mt-2 max-w-20">View All</p>
                </div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
              <div className="absolute top-8 left-8 w-20 h-20 bg-blue-500 rounded-full blur-2xl"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 bg-purple-500 rounded-full blur-2xl"></div>
            </div>
          </div>
        )}

        {/* Filters and Services */}
        <div id="services-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Available Services
              <span className="ml-2 text-base font-normal text-gray-500 dark:text-gray-400">
                ({filteredProviders.length} found)
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEnhancedFilters(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-rose-300 dark:hover:border-rose-600 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-xs font-medium">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>

              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Service Providers Grid/List */}
          {loading ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                    <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error loading services</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
              >
                {refreshing ? <Loader className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Try Again
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredProviders.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => {}} // Clients can't edit products
                  onDelete={() => {}} // Clients can't delete products
                  onToggleActive={() => {}} // Clients can't toggle active state
                  onView={() => navigate(`/products/${product.id}`)}
                  showActions={false} // Hide edit/delete actions for clients
                />
              ))}
            </div>
          )}

          {filteredProviders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No services found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Try adjusting your search criteria or location
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSector('All');
                  setPriceRange([0, 200000]);
                  clearPersistedFilters();
                  fetchProducts({});
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Filters Modal */}
      <EnhancedFilters
        isOpen={showEnhancedFilters}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClose={() => setShowEnhancedFilters(false)}
        sectors={sectors}
      />
    </div>
  );
};