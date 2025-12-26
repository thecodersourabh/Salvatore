import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useAuth0 } from '@auth0/auth0-react';
import { IonInput, IonSelect, IonSelectOption } from '@ionic/react';
import { 
  MapPin, 
  Plus, 
  Home, 
  Building2, 
  Briefcase,
  Edit, 
  Trash,
  X
} from 'lucide-react';
import { AddressService } from '../../../services';
import { Address as ApiAddress, CreateAddressRequest, UpdateAddressRequest } from '../../../types/user';
import { CountrySelect } from '../../../components/ui';
import { countries, Country, getCountryByCode, getCountryByPhoneCode } from '../../../data/countries';

interface Address {
  id?: string;
  type: 'home' | 'office' | 'work' | 'other';
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  countryCode: string;
  phone: string;
  phoneCode: string;
  isDefault: boolean;
}

export const Addresses = () => {
  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Android back button
  useEffect(() => {
    let backButtonListener: any = null;

    const setupBackButtonHandler = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Listen for the hardware back button
        backButtonListener = await CapacitorApp.addListener('backButton', () => {
          // Navigate back to dashboard
          navigate('/', { replace: true });
        });
      } catch (error) {
        console.error('Failed to setup back button handler:', error);
      }
    };

    setupBackButtonHandler();

    // Cleanup listener when component unmounts
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [navigate]);
  
  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'home',
    name: user?.name || user?.email || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    countryCode: 'IN',
    phone: '',
    phoneCode: '+91',
    isDefault: false
  });

  // Detect browser autofill and update form state
  useEffect(() => {
    const detectAutofill = () => {
      // Check for autofilled values after a short delay
      setTimeout(() => {
        const inputs = [
          { id: 'address-name', field: 'name' },
          { id: 'address-street', field: 'street' },
          { id: 'address-city', field: 'city' },
          { id: 'address-state', field: 'state' },
          { id: 'address-zipcode', field: 'zipCode' },
          { id: 'address-phone', field: 'phone' }
        ];

        const updates: Partial<Address> = {};
        let hasUpdates = false;

        inputs.forEach(({ id, field }) => {
          const input = document.getElementById(id) as HTMLInputElement;
          if (input?.value && input.value !== (formData as any)[field]) {
            (updates as any)[field] = input.value;
            hasUpdates = true;
          }
        });

        if (hasUpdates) {
          setFormData(prev => ({ ...prev, ...updates }));
        }
      }, 100);
    };

    // Multiple event listeners for better autofill detection
    const events = ['input', 'change', 'blur', 'focus'];
    const handleAutofillEvents = () => {
      detectAutofill();
    };

    // Add event listeners to form inputs
    const addListeners = () => {
      const formElement = document.querySelector('form');
      if (formElement) {
        events.forEach(event => {
          formElement.addEventListener(event, handleAutofillEvents, true);
        });
      }
    };

    // Add listeners after component mounts
    setTimeout(addListeners, 100);

    // Also check on window focus (helps with browser autofill)
    window.addEventListener('focus', handleAutofillEvents);
    
    // Cleanup
    return () => {
      const formElement = document.querySelector('form');
      if (formElement) {
        events.forEach(event => {
          formElement.removeEventListener(event, handleAutofillEvents, true);
        });
      }
      window.removeEventListener('focus', handleAutofillEvents);
    };
  }, [formData]);

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated || !user?.sub) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get the actual user ID from our mapping
        const actualUserId = localStorage.getItem(`auth0_${user.sub}`);
        if (!actualUserId) {
          setError('User not found. Please try signing out and back in.');
          setLoading(false);
          return;
        }
        
        const userAddresses = await AddressService.getUserAddresses(actualUserId);
        
        setAddresses(userAddresses.map((addr: ApiAddress) => {
          // Parse phone to separate country code and number if stored together
          let phoneCode = '+91';
          let phone = addr.phone || '';
          
          // If phone already has country code, try to separate it
          if (phone.startsWith('+')) {
            const phoneMatch = phone.match(/^(\+\d{1,4})\s?(.*)$/);
            if (phoneMatch) {
              phoneCode = phoneMatch[1];
              phone = phoneMatch[2];
            }
          }
          
          // Find country by phone code or default to India
          const country = getCountryByPhoneCode?.(phoneCode) || getCountryByCode('IN')!;
          
          console.log('🔍 Loading address from API:', {
            original: addr,
            parsedPhone: { phoneCode, phone },
            detectedCountry: country,
            finalCountry: addr.country || country.name
          });
          
          return {
            id: addr.addressId,
            type: addr.type as 'home' | 'office' | 'work' | 'other',
            name: user?.name || user?.email || '',
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country || country.name,
            countryCode: country.code,
            phone: phone,
            phoneCode: phoneCode,
            isDefault: addr.isDefault
          };
        }));
        setError(null);
      } catch (err) {
        console.error('Failed to load addresses:', err);
        // Check if this is a CORS error
        if (err instanceof Error && (
            err.message.includes('Failed to fetch') ||
            err.message.includes('CORS') ||
            err.message.includes('Network request failed')
        )) {
          setError('Unable to connect to server. This is a known issue that will be fixed soon. The address functionality is temporarily unavailable.');
        } else {
          setError('Failed to load addresses. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [isAuthenticated, user]);

  // Update form data when user becomes available
  useEffect(() => {
    if (user && !editingAddress) {
      setFormData(prev => ({
        ...prev,
        name: user.name || user.email || ''
      }));
    }
  }, [user, editingAddress]);

  const getAddressIcon = (type: Address['type']) => {
    switch (type) {
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'office':
      case 'work':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const handleSave = async () => {
    if (!user?.sub || !formData.street || !formData.city || !formData.state) {
      setError('Please fill in all required fields');
      return;
    }

    // Get the actual user ID from our mapping
    const actualUserId = localStorage.getItem(`auth0_${user.sub}`);
    if (!actualUserId) {
      setError('User not found. Please try signing out and back in.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const addressData: CreateAddressRequest = {
        userId: actualUserId,
        type: formData.type || 'home',
        street: formData.street!,
        city: formData.city!,
        state: formData.state!,
        zipCode: formData.zipCode || '',
        country: formData.country || 'India',
        phone: `${formData.phoneCode || '+91'} ${formData.phone || ''}`.trim(),
        isDefault: formData.isDefault || false
      };

      let savedAddress: ApiAddress;
      if (editingAddress?.id) {
        // Update existing address
        const updateData: UpdateAddressRequest = {
          id: editingAddress.id,
          ...addressData
        };
        savedAddress = await AddressService.updateAddress(updateData);
        const updatedAddress = { 
          ...addresses.find(a => a.id === editingAddress.id)!,
          type: formData.type || addresses.find(a => a.id === editingAddress.id)!.type,
          name: user?.name || user?.email || '',
          street: formData.street || addresses.find(a => a.id === editingAddress.id)!.street,
          city: formData.city || addresses.find(a => a.id === editingAddress.id)!.city,
          state: formData.state || addresses.find(a => a.id === editingAddress.id)!.state,
          zipCode: formData.zipCode || addresses.find(a => a.id === editingAddress.id)!.zipCode,
          country: formData.country || addresses.find(a => a.id === editingAddress.id)!.country,
          phone: formData.phone || addresses.find(a => a.id === editingAddress.id)!.phone,
          isDefault: formData.isDefault !== undefined ? formData.isDefault : addresses.find(a => a.id === editingAddress.id)!.isDefault
        } as Address;
        
        // Update addresses with proper default handling
        setAddresses(prev => prev.map(addr => {
          if (addr.id === editingAddress.id) {
            return updatedAddress;
          }
          // If setting current address as default, remove default from others
          return {
            ...addr,
            isDefault: formData.isDefault ? false : addr.isDefault
          };
        }));
        
        // If this address was set as default, notify other components
        if (formData.isDefault) {
          window.dispatchEvent(new CustomEvent('addressDefaultChanged', { 
            detail: { id: editingAddress.id, address: updatedAddress } 
          }));
        }
      } else {
        // Create new address
        savedAddress = await AddressService.createAddress(actualUserId, addressData);
        
        // Parse phone for display
        let phoneCode = formData.phoneCode || '+91';
        let phone = formData.phone || '';
        
        const newAddress: Address = {
          id: savedAddress.addressId,
          type: savedAddress.type as 'home' | 'office' | 'work' | 'other',
          name: formData.name || '',
          street: savedAddress.street,
          city: savedAddress.city,
          state: savedAddress.state,
          zipCode: savedAddress.zipCode,
          country: formData.country || savedAddress.country,
          countryCode: formData.countryCode || 'IN',
          phone: phone,
          phoneCode: phoneCode,
          isDefault: formData.isDefault || false
        };
        
        // Add new address and handle default properly
        setAddresses(prev => {
          const updatedAddresses = newAddress.isDefault 
            // If new address is default, remove default from existing addresses
            ? prev.map(addr => ({ ...addr, isDefault: false }))
            : prev;
          return [...updatedAddresses, newAddress];
        });
        
        // If this new address was set as default, notify other components
        if (newAddress.isDefault && newAddress.id) {
          window.dispatchEvent(new CustomEvent('addressDefaultChanged', { 
            detail: { id: newAddress.id, address: newAddress } 
          }));
        }
      }

      // Reset form and close modal
      cleanupForm();
      
    } catch (error) {
      console.error('❌ Error saving address:', error);
      setError('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;

    // Get the actual user ID from our mapping
    const actualUserId = localStorage.getItem(`auth0_${user?.sub}`);
    if (!actualUserId) {
      setError('User not found. Please try signing out and back in.');
      return;
    }

    try {
      await AddressService.deleteAddress(actualUserId, id);
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    } catch {
      setError('Failed to delete address. Please try again.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Update the address to be default
      const addressToUpdate = addresses.find(addr => addr.id === id);
      if (!addressToUpdate) return;

      // Get the actual user ID from our mapping
      const actualUserId = localStorage.getItem(`auth0_${user?.sub}`);
      if (!actualUserId) {
        setError('User not found. Please try signing out and back in.');
        return;
      }

      const updatedAddress = { ...addressToUpdate, isDefault: true };
      
      const updateData: UpdateAddressRequest = {
        id: id,
        userId: actualUserId,
        type: updatedAddress.type,
        street: updatedAddress.street,
        city: updatedAddress.city,
        state: updatedAddress.state,
        zipCode: updatedAddress.zipCode,
        country: updatedAddress.country,
        phone: updatedAddress.phone,
        isDefault: true
      };
      
      await AddressService.updateAddress(updateData);
      
      // Notify other components (e.g. AddressBar) that default address changed
      window.dispatchEvent(new CustomEvent('addressDefaultChanged', { 
        detail: { id, address: updatedAddress } 
      }));
      
      setAddresses(prev => prev.map(address => ({
        ...address,
        isDefault: address.id === id
      })));
    } catch {
      setError('Failed to set default address. Please try again.');
    }
  };

  const cleanupForm = () => {
    setIsAddModalOpen(false);
    setEditingAddress(null);
    setFormData({
      type: 'home',
      name: user?.name || user?.email || '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      countryCode: 'IN',
      phone: '',
      phoneCode: '+91',
      isDefault: false
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-safe">
    <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Saved Addresses</h1>
            </div>
            <button
              onClick={() => {
                setFormData({
                  type: 'home',
                  name: user?.name || user?.email || '',
                  street: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  country: 'India',
                  countryCode: 'IN',
                  phone: '',
                  phoneCode: '+91',
                  isDefault: false
                });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
  <div className="px-4 sm:px-6 py-4 sm:py-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No addresses saved</h3>
              <p className="mt-1 text-sm sm:text-base text-gray-500 dark:text-gray-300">
                Add a new address to save it for future purchases
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
              {addresses.map((address) => {
                return (
                <div
                  key={address.id}
                  className="relative bg-white dark:bg-gray-800 sm:bg-gray-50 dark:sm:bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-colors shadow-sm hover:shadow"
                >
                  {address.isDefault && (
                    <div className="absolute right-0 top-0 p-3">
                      <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-full">
                        Default
                      </span>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {getAddressIcon(address.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white truncate pr-16">{address.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 break-words">{address.street}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{address.city}, {address.state} {address.zipCode}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                          <span>{getCountryByCode(address.countryCode)?.flag || '🌍'}</span>
                          <span>{address.country}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300">
                          <span>📞</span>
                          <span>{address.phoneCode} {address.phone}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => {
                            setEditingAddress(address);
                            
                            // Properly set country data for editing
                            let countryCode = address.countryCode || 'IN';
                            let phoneCode = address.phoneCode || '+91';
                            
                            // If we don't have proper country data, try to detect from stored country name
                            if (!address.countryCode && address.country) {
                              const detectedCountry = countries.find(c => c.name === address.country);
                              if (detectedCountry) {
                                countryCode = detectedCountry.code;
                                phoneCode = detectedCountry.phoneCode;
                              }
                            }
                            
                            setFormData({
                              ...address,
                              countryCode: countryCode,
                              phoneCode: phoneCode,
                              // Ensure we have proper country name
                              country: getCountryByCode(countryCode)?.name || address.country || 'India'
                            });
                            setIsAddModalOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        {!address.isDefault && address.id && (
                          <>
                            <button
                              onClick={() => {
                                handleDelete(address.id!);
                              }}
                              className="inline-flex items-center px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-md hover:bg-red-50 dark:hover:bg-red-900"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                            <button
                              onClick={() => handleSetDefault(address.id!)}
                              className="inline-flex items-center px-2 py-1 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Set as Default
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      {(isAddModalOpen || editingAddress) && (
  <div className="fixed inset-0 z-50 overflow-hidden">
    <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" 
        aria-hidden="true"
        onClick={cleanupForm}
      />
      {/* Center modal on desktop */}
      <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
      {/* Modal panel */}
      <div className="relative inline-block w-full transform overflow-hidden rounded-t-xl bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:rounded-xl sm:align-middle">
        <div className="bg-white dark:bg-gray-800">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <button
                onClick={cleanupForm}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <span className="sr-only">Close</span>
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-3 space-y-4" autoComplete="on">
              <div>
                <input
                  type="text"
                  name="name"
                  id="address-name"
                  autoComplete="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              {/* Country Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country
                </label>
                {/* Hidden input for browser autofill */}
                <input
                  type="hidden"
                  name="country"
                  autoComplete="country"
                  value={formData.country || 'India'}
                  readOnly
                />
                <CountrySelect
                  value={formData.countryCode || 'IN'}
                  onChange={(country: Country) => {
                    setFormData({
                      ...formData,
                      country: country.name,
                      countryCode: country.code,
                      phoneCode: country.phoneCode
                    });
                  }}
                  placeholder="Select country"
                  disabled={saving}
                  className=""
                />
              </div>
              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                {/* Hidden full phone number input for autofill */}
                <input
                  type="hidden"
                  name="tel"
                  autoComplete="tel"
                  value={`${formData.phoneCode || '+91'} ${formData.phone || ''}`.trim()}
                  readOnly
                />
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 flex-shrink-0">
                    <span className="text-base">{getCountryByCode(formData.countryCode || 'IN')?.flag || '🇮🇳'}</span>
                    <span>{formData.phoneCode || '+91'}</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="address-phone"
                    autoComplete="tel-national"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              <div>
                <IonSelect
                  value={formData.type || 'home'}
                  onIonChange={(e: CustomEvent) => setFormData({ ...formData, type: (e.detail as any).value as Address['type'] })}
                  className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500"
                  interface="popover"
                  required
                  placeholder="Address Type"
                >
                  <IonSelectOption value="home">Home</IonSelectOption>
                  <IonSelectOption value="office">Office</IonSelectOption>
                  <IonSelectOption value="other">Other</IonSelectOption>
                </IonSelect>
              </div>
              <div>
                <input
                  type="text"
                  name="street"
                  id="address-street"
                  autoComplete="street-address"
                  value={formData.street || ''}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street Address"
                  className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="city"
                    id="address-city"
                    autoComplete="address-level2"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="state"
                    id="address-state"
                    autoComplete="address-level1"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              <div>
                <input
                  type="text"
                  name="zipCode"
                  id="address-zipcode"
                  autoComplete="postal-code"
                  value={formData.zipCode || ''}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="ZIP Code"
                  className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-base text-gray-900 dark:text-white focus:ring-rose-500 focus:border-rose-500 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              {!editingAddress?.isDefault && (
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault || false}
                    onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-base text-gray-900 dark:text-white">
                    Set as default address
                  </label>
                </div>
              )}
              <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4">
                <div className="flex flex-col-reverse sm:flex-row sm:space-x-3">
                  <button
                    type="button"
                    onClick={cleanupForm}
                    className="mt-3 sm:mt-0 w-full sm:w-1/2 inline-flex justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-base font-medium rounded-lg text-gray-700 dark:text-white bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.street || !formData.city || !formData.state || !formData.phone}
                    className="w-full sm:w-1/2 inline-flex justify-center px-4 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : (editingAddress ? 'Save Changes' : 'Add Address')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
      )}
    </div>
  );
};
