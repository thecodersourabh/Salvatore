import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { usePlatform } from '../hooks/usePlatform';
import { useAuth } from '../context/AuthContext';
import { AddressService } from '../services/addressService';
import { orderService } from '../services/orderService';

export const Cart = () => {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen } = useCart();
  const { isNative } = usePlatform();

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Cart panel */}
      <div className={`relative w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-xl flex flex-col ${isNative ? 'pt-safe' : ''}`}>
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 dark:text-gray-300" />
            <h2 className="text-lg font-semibold dark:text-white">Shopping Cart</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 border-b pb-4"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className={`border-t p-4 space-y-4 ${isNative ? 'pb-safe' : ''}`}>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <CheckoutFlow />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

async function submitOrder(
  customer: any,
  items: any[],
  clearCart: () => void,
  setIsCartOpen: (open: boolean) => void,
  idToken?: string | null
) {
  if (!items || items.length === 0) return { success: false, error: 'Your cart is empty' };

  const providerIds = Array.from(new Set(items.map(i => i.providerId).filter(Boolean)));
  if (providerIds.length > 1) {
    return { success: false, error: 'Orders can only contain items from one service provider at a time.' };
  }

  const providerId = providerIds[0] || items[0].providerId || '';
  const payload = {
    serviceProviderId: providerId || '',
    customer,
    status: 'pending' as const,
    items: items.map(i => ({
      name: i.name,
      description: i.description || i.name,
      quantity: i.quantity,
      unitPrice: i.price
    }))
  };

  try {
    // If multiple providers are present, create separate orders per provider
    const grouped = items.reduce((acc: Record<string, any[]>, it) => {
      const pid = it.providerId || '';
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(it);
      return acc;
    }, {} as Record<string, any[]>);

    const providerIdsKeys = Object.keys(grouped).filter(k => k);

    const orderResults: Array<any> = [];

    // If no provider id (''), treat as single provider order
    if (providerIdsKeys.length === 0) {
      const result = await orderService.createOrderViaAPI(payload as any, idToken || undefined);
      if ((result as any).success) {
        const res = result as any;
        const raw = res.raw || {};
        const orderId = res.orderId || raw.data?.id || raw.data?.orderId || raw.id || raw.orderId;
        const orderNumber = raw.data?.orderNumber || raw.orderNumber || undefined;
        try { orderService.showOrderNotification(orderId || orderNumber, 'pending', customer?.contactInfo?.name || 'Customer'); } catch (nerr) { console.warn('Failed to trigger local order notification', nerr); }
        clearCart();
        setIsCartOpen(false);
        return { success: true, orderId, orderNumber };
      }
      return { success: false, error: (result as any).error || 'Order failed' };
    }

    // Multiple providers: create an order per provider
    for (const pid of providerIdsKeys) {
      const providerItems = grouped[pid];
      const payloadPerProvider = {
        serviceProviderId: pid,
        customer,
        status: 'pending' as const,
        items: providerItems.map(i => ({ name: i.name, description: i.description || i.name, quantity: i.quantity, unitPrice: i.price }))
      };

      try {
        const r = await orderService.createOrderViaAPI(payloadPerProvider as any, idToken || undefined);
        if ((r as any).success) {
          const res = r as any;
          const raw = res.raw || {};
          const orderId = res.orderId || raw.data?.id || raw.data?.orderId || raw.id || raw.orderId;
          const orderNumber = raw.data?.orderNumber || raw.orderNumber || undefined;
          try { orderService.showOrderNotification(orderId || orderNumber, 'pending', customer?.contactInfo?.name || 'Customer'); } catch (nerr) { console.warn('Failed to trigger local order notification', nerr); }
          orderResults.push({ success: true, providerId: pid, orderId, orderNumber });
        } else {
          orderResults.push({ success: false, providerId: pid, error: (r as any).error || 'Order failed' });
        }
      } catch (err) {
        orderResults.push({ success: false, providerId: pid, error: err instanceof Error ? err.message : String(err) });
      }
    }

    // Clear cart if at least one succeeded
    const anySuccess = orderResults.some(r => r.success);
    if (anySuccess) {
      clearCart();
      setIsCartOpen(false);
    }

    return { success: orderResults.every(r => r.success), results: orderResults };
  } catch (err) {
    console.error('submitOrder error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function CheckoutFlow() {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { apiUser } = useAuth();
  
  // Move hooks to component level - NOT inside event handlers!
  const { items, clearCart, setIsCartOpen } = useCart();
  const { idToken } = useAuth();

  // Addresses & selection state for inline selector
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);

  const handleSelectAddress = (addr: any) => {
    setSelectedAddress(addr);
    // Dispatch an event so AddressBar or other components can react
    try {
      window.dispatchEvent(new CustomEvent('addressSelected', { detail: addr }));
    } catch (e) {
      // ignore
    }
  };

  // load addresses for selector
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (apiUser && (apiUser as any).addresses && (apiUser as any).addresses.length > 0) {
          const addrs = (apiUser as any).addresses;
          if (!mounted) return;
          setAddresses(addrs);
          const def = addrs.find((a: any) => a.isDefault) || addrs[0];
          if (def) setSelectedAddress(def);
          return;
        }

        if (apiUser && (apiUser as any).id) {
          const addrs = await AddressService.getUserAddresses((apiUser as any).id);
          if (!mounted) return;
          setAddresses(addrs);
          const def = addrs.find((a: any) => a.isDefault) || addrs[0];
          if (def) setSelectedAddress(def);
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, [apiUser]);

  const handleStart = () => setIsCheckingOut(true);
  const handleCancel = () => setIsCheckingOut(false);

  const handlePlace = async () => {
    // build customer from selectedAddress
    const selected = selectedAddress;
    const customer = {
      contactInfo: { name: selected?.contactName || selected?.name || (apiUser as any)?.name || '', email: selected?.email || (apiUser as any)?.email || '', phone: selected?.phone || '' },
      address: {
        street: selected?.street || '',
        city: selected?.city || '',
        state: selected?.state || '',
        zipCode: selected?.zipCode || selected?.zip || '',
        country: selected?.country || ''
      }
    };
    // Use the hooks that were called at component level
    const result = await submitOrder(customer, items, clearCart, setIsCartOpen, idToken);
    if (result.success) {
      // Order placed successfully — consider replacing this with a toast/notification UI
      console.log('Order placed', { orderId: result.orderId, orderNumber: result.orderNumber });
    } else {
      console.error('Place order failed:', result.error);
    }
    setIsCheckingOut(false);
  };

  if (!isCheckingOut) {
    return (
      <button 
        onClick={handleStart} 
        className="w-full bg-rose-600 dark:bg-rose-700 text-white py-3 rounded-full hover:bg-rose-700 dark:hover:bg-rose-800 transition-colors duration-200 font-medium shadow-sm"
      >
        Checkout
      </button>
    );
  }
  // Address selection UI
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {addresses.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No saved addresses. Please add one in your profile.</div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr: any) => (
              <label 
                key={addr.addressId || addr.id} 
                className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddress && (selectedAddress.addressId || selectedAddress.id) === (addr.addressId || addr.id) 
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700' 
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-rose-200 dark:hover:border-rose-800'
                }`}
              >
                <input 
                  type="radio" 
                  name="selectedAddress" 
                  checked={selectedAddress && (selectedAddress.addressId || selectedAddress.id) === (addr.addressId || addr.id)} 
                  onChange={() => handleSelectAddress(addr)}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-sm flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {addr.type ? addr.type.charAt(0).toUpperCase() + addr.type.slice(1) : 'Address'}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 mt-1">
                    {addr.street}, {addr.city} {addr.state} {addr.zipCode || addr.zip}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-2 pt-2">
        <button 
          onClick={handlePlace} 
          disabled={!selectedAddress} 
          className="flex-1 bg-rose-600 dark:bg-rose-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2.5 rounded-lg hover:bg-rose-700 dark:hover:bg-rose-800 disabled:hover:bg-gray-300 dark:disabled:hover:bg-gray-600 transition-colors duration-200 font-medium shadow-sm"
        >
          Place Order
        </button>
        <button 
          onClick={handleCancel} 
          className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

