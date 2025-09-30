import { useState } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
}

const PaymentMethods = () => {
  // This will be replaced with API data when integrated
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    id: string;
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    isDefault: boolean;
  }>>([
    {
      id: '1',
      cardNumber: '**** **** **** 1234',
      cardHolder: 'John Doe',
      expiryDate: '12/25',
      isDefault: true,
    },
    // Add more sample cards as needed
  ]);

  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically make an API call to add the card
    const formattedCard: PaymentMethod = {
      id: Date.now().toString(),
      cardNumber: '**** **** **** ' + newCard.cardNumber.slice(-4),
      cardHolder: newCard.cardHolder,
      expiryDate: newCard.expiryDate,
      isDefault: paymentMethods.length === 0
    };

    setPaymentMethods(prev => [...prev, formattedCard]);
    setShowAddCard(false);
    setNewCard({ cardNumber: '', cardHolder: '', expiryDate: '', cvv: '' });
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  const handleDeleteCard = (id: string) => {
    setPaymentMethods(prev => {
      const filtered = prev.filter(method => method.id !== id);
      // If we deleted the default card and there are other cards, make the first one default
      if (filtered.length > 0 && prev.find(m => m.id === id)?.isDefault) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing Payment Methods */}
      <div className="space-y-4">
        {paymentMethods.map(method => (
          <div
            key={method.id}
            className={`p-4 border rounded-lg ${
              method.isDefault ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium">{method.cardNumber}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {method.cardHolder} • Expires {method.expiryDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400"
                  >
                    Set as Default
                  </button>
                )}
                {!method.isDefault && (
                  <button
                    onClick={() => handleDeleteCard(method.id)}
                    className="text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Card Button/Form */}
      {!showAddCard ? (
        <button
          onClick={() => setShowAddCard(true)}
          className="flex items-center space-x-2 text-rose-600 hover:text-rose-700"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Card</span>
        </button>
      ) : (
        <form onSubmit={handleAddCard} className="space-y-4 border rounded-lg p-4">
          <h3 className="font-medium">Add New Card</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                value={newCard.cardNumber}
                onChange={e => setNewCard(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="1234 5678 9012 3456"
                required
                pattern="[0-9]{16}"
                maxLength={16}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div>
              <label htmlFor="cardHolder" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Card Holder Name
              </label>
              <input
                type="text"
                id="cardHolder"
                value={newCard.cardHolder}
                onChange={e => setNewCard(prev => ({ ...prev, cardHolder: e.target.value }))}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Expiry Date
              </label>
              <input
                type="text"
                id="expiryDate"
                value={newCard.expiryDate}
                onChange={e => setNewCard(prev => ({ ...prev, expiryDate: e.target.value }))}
                placeholder="MM/YY"
                required
                pattern="(0[1-9]|1[0-2])\/([0-9]{2})"
                maxLength={5}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div>
              <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                CVV
              </label>
              <input
                type="password"
                id="cvv"
                value={newCard.cvv}
                onChange={e => setNewCard(prev => ({ ...prev, cvv: e.target.value }))}
                required
                pattern="[0-9]{3,4}"
                maxLength={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-rose-500 focus:outline-none focus:ring-rose-500 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddCard(false)}
              className="px-4 py-2 text-gray-700 hover:text-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              Add Card
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PaymentMethods;