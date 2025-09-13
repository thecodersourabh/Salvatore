import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { User } from '../../types/user';

interface IProfileCompletionAlertProps {
  onClose: () => void;
  completion?: number;
  profile?: User | null;
}

export const ProfileCompletionAlert = ({ onClose, completion, profile }: IProfileCompletionAlertProps) => {
  const navigate = useNavigate();

  const handleStartProfileSetup = () => {
    navigate('/profile');
  };

  return (
    <div className="bg-rose-50 border-b border-rose-200">
      <div className="max-w-7xl mx-auto py-3 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-rose-600" />
              </div>
            </div>
            <div className="flex-1 flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-rose-800">
                  Complete your profile to unlock all features
                </p>
                <p className="text-sm text-rose-600">
                  {profile ? 
                    `Complete your profile to improve visibility (${completion}% done)` :
                    'Set up your service provider profile to start receiving requests'
                  }
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                  {completion}% Complete
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={handleStartProfileSetup}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 shadow-sm"
                >
                  {profile ? 'Complete Profile' : 'Create Profile'}
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex items-center p-1.5 border border-rose-200 rounded-md text-rose-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  aria-label="Close alert"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
