import { IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

interface VerificationBadgeProps {
  isVerified: boolean;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  className?: string;
  showTooltip?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  verifiedAt,
  verifiedBy,
  className = '',
  showTooltip = true
}) => {
  const tooltipContent = isVerified
    ? `Verified${verifiedAt ? ` on ${new Date(verifiedAt).toLocaleDateString()}` : ''}${
        verifiedBy ? ` by ${verifiedBy}` : ''
      }`
    : 'Not verified';

  return (
    <div
      className={`inline-flex items-center ${className}`}
      title={showTooltip ? tooltipContent : undefined}
    >
      <IonIcon
        icon={isVerified ? checkmarkCircle : closeCircle}
        className={`w-5 h-5 ${
          isVerified ? 'text-green-500 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
        }`}
      />
      {showTooltip && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {isVerified ? 'Verified' : 'Not Verified'}
        </span>
      )}
    </div>
  );
};
