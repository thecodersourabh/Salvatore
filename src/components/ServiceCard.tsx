import { LucideIcon } from "lucide-react";

interface ServiceItem {
  name: string;
  description: string;
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
  skills = []
}: ServiceCardProps) {
  console.log(`ServiceCard ${title} received skills:`, skills);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-50 rounded-lg">
            <Icon className="h-5 w-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{category}</p>
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
            <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      
      {skills && skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 relative group">
            {skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-gray-50 text-gray-600 rounded-full border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200 transform hover:scale-105"
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
                <div className="absolute left-0 top-full mt-2 p-2 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-10 w-48">
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
