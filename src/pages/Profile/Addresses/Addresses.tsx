import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
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

interface Address {
  id?: string;
  type: 'home' | 'office' | 'work' | 'other';
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export const Addresses = () => {
  const { user, isAuthenticated } = useAuth0();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Address>>({
    type: 'home',
    name: user?.name || user?.email || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    isDefault: false
  });

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
        
        setAddresses(userAddresses.map((addr: ApiAddress) => ({
          id: addr.addressId,
          type: addr.type as 'home' | 'office' | 'work' | 'other',
          name: user?.name || user?.email || '',
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zipCode: addr.zipCode,
          country: addr.country,
          phone: addr.phone,
          isDefault: addr.isDefault
        })));
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
        country: formData.country || 'United States',
        phone: formData.phone || '',
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
        setAddresses(prev => prev.map(addr => 
          addr.id === editingAddress.id 
            ? { 
                ...addr, 
                type: formData.type || addr.type,
                name: user?.name || user?.email || '',
                street: formData.street || addr.street,
                city: formData.city || addr.city,
                state: formData.state || addr.state,
                zipCode: formData.zipCode || addr.zipCode,
                country: formData.country || addr.country,
                phone: formData.phone || addr.phone,
                isDefault: formData.isDefault !== undefined ? formData.isDefault : addr.isDefault
              } as Address
            : addr
        ));
      } else {
        // Create new address
        savedAddress = await AddressService.createAddress(addressData);
        const newAddress: Address = {
          id: savedAddress.addressId,
          type: savedAddress.type as 'home' | 'office' | 'work' | 'other',
          name: formData.name || '',
          street: savedAddress.street,
          city: savedAddress.city,
          state: savedAddress.state,
          zipCode: savedAddress.zipCode,
          country: savedAddress.country,
          phone: savedAddress.phone,
          isDefault: formData.isDefault || false
        };
        setAddresses(prev => [...prev, newAddress]);
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

    try {
      await AddressService.deleteAddress(id);
      
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
      country: 'United States',
      phone: '',
      isDefault: false
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Saved Addresses</h1>
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
                  country: 'United States',
                  phone: '',
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600"></div>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No addresses saved</h3>
              <p className="mt-1 text-sm sm:text-base text-gray-500">
                Add a new address to save it for future purchases
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
              {addresses.map((address) => {
                return (
                <div
                  key={address.id}
                  className="relative bg-white sm:bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-gray-300 transition-colors shadow-sm hover:shadow"
                >
                  {address.isDefault && (
                    <div className="absolute right-0 top-0 p-3">
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
                        Default
                      </span>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <div className="mt-1 text-gray-500 flex-shrink-0">
                      {getAddressIcon(address.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-gray-900 truncate pr-16">{address.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 break-words">{address.street}</p>
                      <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                      <p className="mt-2 text-sm text-gray-600">Phone: {address.phone}</p>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => {
                            setEditingAddress(address);
                            setFormData(address);
                            setIsAddModalOpen(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
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
                              className="inline-flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700 rounded-md hover:bg-red-50"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                            <button
                              onClick={() => handleSetDefault(address.id!)}
                              className="inline-flex items-center px-2 py-1 text-sm text-rose-600 hover:text-rose-700 rounded-md hover:bg-rose-50"
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
            <div className="relative inline-block w-full transform overflow-hidden rounded-t-xl bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:rounded-xl sm:align-middle">
              <div className="bg-white">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-semibold text-gray-900">
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

                  <form onSubmit={handleSubmit} className="mt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address Type
                      </label>
                      <select
                        value={formData.type || 'home'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as Address['type'] })}
                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                        required
                      >
                        <option value="home">Home</option>
                        <option value="office">Office</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={formData.street || ''}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                        placeholder="Enter street address"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city || ''}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          State
                        </label>
                        <input
                          type="text"
                          value={formData.state || ''}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                          placeholder="Enter state"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={formData.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-rose-500 focus:border-rose-500 text-base"
                        placeholder="Enter ZIP code"
                        required
                      />
                    </div>

                    {!editingAddress?.isDefault && (
                      <div className="flex items-center pt-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault || false}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="h-5 w-5 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-base text-gray-900">
                          Set as default address
                        </label>
                      </div>
                    )}

                    <div className="mt-6 sm:mt-8 border-t border-gray-200 pt-4">
                      <div className="flex flex-col-reverse sm:flex-row sm:space-x-3">
                        <button
                          type="button"
                          onClick={cleanupForm}
                          className="mt-3 sm:mt-0 w-full sm:w-1/2 inline-flex justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving || !formData.street || !formData.city || !formData.state}
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
