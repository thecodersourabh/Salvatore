import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

const QuickActions = memo(() => {
  const navigate = useNavigate();
  const { currency } = useCurrency();

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/orders')}
            className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer"
          >
            <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-rose-600" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">View Bookings</h4>
            <p className="text-gray-600 dark:text-gray-300 text-xs">Check your upcoming appointments and schedule</p>
          </div>
          
          <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
            <div onClick={() => navigate('/payments')}
            className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-rose-600" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Analytics</h4>
            <p className="text-gray-600 dark:text-gray-300 text-xs">Track your performance and earnings</p>
          </div>
          
          <div className="text-center p-4 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
            <div onClick={() => navigate('/payments')}
            className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              {currency === 'USD' ? (
                <DollarSign className="h-6 w-6 text-rose-600" />
              ) : (
                <div className="text-rose-600 font-semibold text-lg">₹</div>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Payments</h4>
            <p className="text-gray-600 dark:text-gray-300 text-xs">Manage your earnings and payments</p>
          </div>
        </div>
      </div>
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;