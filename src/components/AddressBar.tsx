import { MapPin } from 'lucide-react';
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
    switch(addr.type) {
      case 'home':
        return `Home: ${addr.street}, ${addr.city}`;
      case 'office':
        return `Office: ${addr.street}, ${addr.city}`;
      case 'work':
        return `Work: ${addr.street}, ${addr.city}`;
      default:
        return `${addr.street}, ${addr.city}`;
    }
  };

  return (
    <div 
      className="bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50"
      onClick={handleAddressClick}
    >
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-rose-600" />
          <span className="text-gray-600 flex-1 truncate">
            {address ? formatAddress(address) : 'Select your delivery address'}
          </span>
          <span className="text-rose-600 font-medium">Change</span>
        </div>
      </div>
    </div>
  );
};