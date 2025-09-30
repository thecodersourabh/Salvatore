import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { Card } from '../../components/ui/card';
import BillingPaymentGrid from '../../components/BillingPaymentGrid';
import BillingInfoForm from '../../components/BillingInfoForm';
import PaymentMethods from '../../components/PaymentMethods';
import { apiService } from '../../services/ApiService';

const PaymentPage = () => {
  const { userContext: user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('billing-payment');

  useEffect(() => {
    const initializeUserContext = async () => {
      if (user && !apiService.getUserContext()) {
        try {
          const actualUserId = localStorage.getItem(`auth0_${user.sub}`);
          if (!actualUserId) {
            setError('User not found. Please try signing out and back in.');
            setLoading(false);
            return;
          }

          apiService.setUserContext({
            id: actualUserId,
            email: user.email,
            name: user.name
          });
        } catch (err) {
          setError('Failed to initialize user context. Please try again.');
        }
      }
      setLoading(false);
    };

    initializeUserContext();
  }, [user]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p>{error}</p>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 right-0 p-4"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments & Billing</h1>
      
      <div className="w-full">
        <div className="overflow-x-auto">
          <IonSegment
            value={activeTab}
            onIonChange={e => setActiveTab(e.detail.value as string)}
            className="w-full max-w-full whitespace-nowrap dark:text-white"
            scrollable={true}
            color="primary"
            style={{
              '--background': 'transparent',
              '--background-checked': 'var(--ion-color-primary)',
              '--color': 'var(--ion-text-color)',
              '--color-checked': '#fff'
            }}
          >
            <IonSegmentButton value="billing-payment" className="min-w-[140px] dark:text-white">
              <IonLabel className="dark:text-white">Billing & Payment</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="billing-info" className="min-w-[120px] dark:text-white">
              <IonLabel className="dark:text-white">Billing Info</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="balance" className="min-w-[100px] dark:text-white">
              <IonLabel className="dark:text-white">Balance</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="payment-methods" className="min-w-[140px] dark:text-white">
              <IonLabel className="dark:text-white">Payment Methods</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        <div className="mt-4">
          {activeTab === 'billing-payment' && (
            <Card className="p-4">
              <BillingPaymentGrid />
            </Card>
          )}

          {activeTab === 'billing-info' && (
            <Card className="p-4">
              <BillingInfoForm />
            </Card>
          )}

          {activeTab === 'balance' && (
            <Card className="p-4">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Available Balances</h3>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Wallet Balance</h4>
                    <p className="text-2xl font-bold text-green-600">₹0.00</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Credits from Canceled Orders</h4>
                    <p className="text-2xl font-bold text-blue-600">₹0.00</p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Total Credits</h4>
                  <p className="text-2xl font-bold text-purple-600">₹0.00</p>
                  <p className="text-sm text-gray-600 mt-2">Use for purchases.</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Like to earn some credits?</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Refer people you know and everyone benefits!
                  </p>
                  <button className="mt-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">
                    Refer Friends
                  </button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'payment-methods' && (
            <Card className="p-4">
              <PaymentMethods />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;