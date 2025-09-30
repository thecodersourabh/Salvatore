import { useState, useCallback } from 'react';

interface BillingInfo {
  fullName: string;
  companyName: string;
  country: string;
  state: string;
  street: string;
  city: string;
  postalCode: string;
  isGstRegistered: boolean;
  gstNumber?: string;
}

const BillingInfoForm = () => {
  const [formData, setFormData] = useState<BillingInfo>({
    fullName: '',
    companyName: '',
    country: 'India', // Default to India as per requirements
    state: '',
    street: '',
    city: '',
    postalCode: '',
    isGstRegistered: false,
    gstNumber: '',
  });

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
    'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry'
  ];

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  }, [formData]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* Country - Disabled as it's fixed to India */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value="India"
            disabled
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50 dark:border-gray-600 dark:bg-gray-600"
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            State/Union Territory
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="">Select a state</option>
            {indianStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Street */}
        <div className="md:col-span-2">
          <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Street Address
          </label>
          <input
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* Postal Code */}
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Postal Code
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleInputChange}
            required
            pattern="[0-9]{6}"
            title="Please enter a valid 6-digit postal code"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* GST Registration */}
        <div className="md:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isGstRegistered"
              name="isGstRegistered"
              checked={formData.isGstRegistered}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <label htmlFor="isGstRegistered" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Are you registered for India GST?
            </label>
          </div>
          
          {formData.isGstRegistered && (
            <div className="mt-4">
              <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                GST Number
              </label>
              <input
                type="text"
                id="gstNumber"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                required
                pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
                title="Please enter a valid GST number"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-rose-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        >
          Save Billing Information
        </button>
      </div>
    </form>
  );
};

export default BillingInfoForm;