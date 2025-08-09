import { ReactNode } from 'react';
import { usePlatform } from '../hooks/usePlatform';

interface PlatformWrapperProps {
  children: ReactNode;
  webClassName?: string;
  mobileClassName?: string;
}

export const PlatformWrapper = ({ 
  children, 
  webClassName = '', 
  mobileClassName = '' 
}: PlatformWrapperProps) => {
  const { isNative } = usePlatform();
  
  return (
    <div className={isNative ? mobileClassName : webClassName}>
      {children}
    </div>
  );
};
