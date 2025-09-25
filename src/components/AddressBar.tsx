import { MapPin, Home, Building2, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Address } from '../types/user';
import { AddressService } from '../services/addressService';
import { useState, useEffect } from 'react';

interface AddressBarProps {
  userId?: string;
}

export const AddressBar = ({ userId: userId }: AddressBarProps) => {
  const [address, setAddress] = useState<Address | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAddress = async () => {
      if (!userId) {
        return;
      }

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

    loadAddress();
  }, [userId]);

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