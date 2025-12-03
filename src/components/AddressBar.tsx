import { MapPin, Home, Building2, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Address } from '../types/user';
import { AddressService } from '../services/addressService';
import { useState, useEffect } from 'react';
import { useAuth } from '../store/useAuth';

export const AddressBar = () => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [address, setAddress] = useState<Address | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.sub) {
      const mappedId = localStorage.getItem(`auth0_${user.sub}`);
      setUserId(mappedId);
    } else {
      setUserId(null);
    }
  }, [user?.sub]);

  const loadAddress = async () => {
    if (!userId) return;
    try {
      const addresses = await AddressService.getUserAddresses(userId);
      const defaultAddress = addresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        setAddress(defaultAddress);
      }
    } catch (error) {
      console.error('AddressBar - Error loading addresses:', error);
    }
  };

  useEffect(() => {
    loadAddress();
  }, [userId]);

  // Listen for address default changes from Addresses component
  useEffect(() => {
    const handleAddressDefaultChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string; address: any }>;
      console.log('AddressBar - Default address changed:', customEvent.detail);
      
      // Refresh address data to get the latest default address
      loadAddress();
    };

    // Add event listener
    window.addEventListener('addressDefaultChanged', handleAddressDefaultChanged);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('addressDefaultChanged', handleAddressDefaultChanged);
    };
  }, [userId]); // Include userId as dependency to ensure loadAddress has access to current userId

  // Listen for address selection from Cart and update the bar immediately
  useEffect(() => {
    const handleAddressSelected = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const addr = customEvent.detail;
      if (addr) setAddress(addr);
    };

    window.addEventListener('addressSelected', handleAddressSelected as EventListener);
    return () => window.removeEventListener('addressSelected', handleAddressSelected as EventListener);
  }, []);

  if (!userId) return null;

  const handleAddressClick = () => {
    navigate('/addresses');
  };

  const formatAddress = (addr: Address) => {
    const type = addr.type.charAt(0).toUpperCase() + addr.type.slice(1);
    return (
      <>
        <span className="font-semibold text-gray-800">{type}: </span>
        <span className="font-normal text-gray-800">{addr.street}</span>
        <span className="font-normal text-gray-800">, {addr.city}</span>
      </>
    );
  };

  const getAddressIcon = (type?: string) => {
    switch(type) {
      case 'home':
        return <Home className="h-4 w-4 text-rose-600" />;
      case 'office':
        return <Building2 className="h-4 w-4 text-rose-600" />;
      case 'work':
        return <Briefcase className="h-4 w-4 text-rose-600" />;
      default:
        return <MapPin className="h-4 w-4 text-rose-600" />;
    }
  };

  return (
    <div 
      className="bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50"
      onClick={handleAddressClick}
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center space-x-2 text-sm">
          {getAddressIcon(address?.type)}
          <div className="text-sm flex-1 truncate">
            {address ? formatAddress(address) : (
              <span className="text-gray-600">Select your delivery address</span>
            )}
          </div>
          <span className="text-rose-600 font-medium">Change</span>
        </div>
      </div>
    </div>
  );
};