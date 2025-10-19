import React from 'react';

export const StatSkeleton: React.FC<{ widthClass?: string }> = ({ widthClass = 'w-16' }) => {
  return (
    <div className="inline-flex items-center space-x-2">
      <div className={`h-6 ${widthClass} skeleton rounded`} />
    </div>
  );
};

export default StatSkeleton;
