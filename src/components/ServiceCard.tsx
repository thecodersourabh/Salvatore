import { LucideIcon } from "lucide-react";

interface ServiceItem {
  name: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images?: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  tags?: string[];
}

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  category: string;
  rating: number;
  totalJobs: number;
  isActive: boolean;
  onToggle: () => void;
  services: ServiceItem[];
  skills?: string[];
  products?: Product[];
}

export function ServiceCard({ 
  title, 
  description, 
  icon: Icon, 
  category, 
  rating, 
  totalJobs, 
  isActive,
  onToggle,
  services,
  skills = [],
  products = []
}: ServiceCardProps) {
  // Use services to prevent unused variable warning
  const serviceCount = services?.length || 0;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <Icon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {category} {serviceCount > 0 && `• ${serviceCount} service${serviceCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={onToggle}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 dark:peer-focus:ring-rose-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600 dark:peer-checked:bg-rose-500"></div>
          </label>
        </div>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
      
      {skills && skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 relative group">
            {skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-700 transition-all duration-200 transform hover:scale-105"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <div className="relative inline-block">
                <span
                  className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-200 cursor-pointer hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200"
                >
                  +{skills.length - 4}
                </span>
                <div className="absolute left-0 top-full mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 hidden group-hover:block z-10 w-48">
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {skills.slice(4).map((skill, index) => (
                      <span
                        key={index + 4}
                        className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
          <span>Your Products</span>
          <span className="text-rose-600 font-medium">{Array.isArray(products) ? products.length : 0}</span>
        </h4>
        
        {Array.isArray(products) && products.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {products.slice(0, 3).map((product, index) => (
              <div key={product.id || index} className="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                {product.images?.[0] && (
                  <img 
                    src={product.images[0].url} 
                    alt={product.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                      {product.currency === 'USD' ? '$' : '₹'}{product.price}
                    </p>
                    {product.tags && product.tags.length > 0 && (
                      <span className="text-xs text-gray-400 truncate ml-2">
                        {product.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {products.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 bg-gray-50 dark:bg-gray-700 rounded-md">
                +{products.length - 3} more products
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              No products yet. Create your first service product!
            </p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs border-t pt-3">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-rose-600 font-medium">
            ★ {rating.toFixed(1)}
          </span>
          <span className="text-gray-500">
            {totalJobs} jobs completed
          </span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-rose-50 text-rose-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
    </div>
  );
}
