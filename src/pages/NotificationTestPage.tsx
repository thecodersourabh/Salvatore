
// This component provides a comprehensive testing interface for Firebase push notifications

import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonItem, IonLabel, IonIcon, IonBadge, IonButtons, IonInput, IonText } from '@ionic/react';
import { close } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  showLocalNotification, 
  checkNotificationStatus,
  onNotificationAction,
  onPushToken,
  getLastPushToken,
  registerDevice,
  registerForWebPushNotifications,
  enableNotificationsManually,
  testNotificationFunctionality,
  areNotificationsEnabled
} from '../services/notificationService';
import { orderService } from '../services/orderService';

const NotificationTestPage: React.FC = () => {
  const { idToken, userContext } = useAuth();
  const navigate = useNavigate();
  const [notificationStatus, setNotificationStatus] = useState<any>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [userId, setUserId] = useState<string>('6abc3caa-a411-49ff-9ff7-c142a002033c');
  const [apiResults, setApiResults] = useState<any>(null);
  
  // Firebase Web Push specific state
  const [firebaseStatus, setFirebaseStatus] = useState<{
    enabled: boolean;
    token?: string;
    isLoading: boolean;
    error?: string;
  }>({
    enabled: false,
    isLoading: false
  });
  const [firebaseResult, setFirebaseResult] = useState<any>(null);

  const handleClose = () => {
    navigate('/');
  };

  useEffect(() => {
    // Check notification status
    checkNotificationStatus().then(setNotificationStatus);
    
    // Get current push token
    const token = getLastPushToken();
    setPushToken(token);

    // Check Firebase notification status
    checkFirebaseStatus();

    // Listen for new tokens
    const unsubscribeToken = onPushToken((token) => {
      setPushToken(token);
      console.log('New push token received:', token);
    });

    // Listen for notification actions
    const unsubscribeAction = onNotificationAction((payload) => {
      setLastNotification(payload);
      console.log('Notification action:', payload);
    });

    return () => {
      unsubscribeToken();
      unsubscribeAction();
    };
  }, []);

  const checkFirebaseStatus = async () => {
    try {
      const enabled = await areNotificationsEnabled();
      setFirebaseStatus(prev => ({ ...prev, enabled }));
    } catch (error) {
      console.error('Error checking Firebase notification status:', error);
    }
  };

  // Auto-populate auth token from context
  useEffect(() => {
    if (idToken && !authToken) {
      setAuthToken(idToken);
    }
    if (userContext?.sub && userId === '6abc3caa-a411-49ff-9ff7-c142a002033c') {
      setUserId(userContext.sub);
    }
  }, [idToken, userContext, authToken, userId]);

  const testBasicNotification = async () => {
    console.log('🧪 Testing basic notification...');
    const result = await showLocalNotification(
      'Test Notification',
      'This is a basic test notification',
      { testId: Date.now() }
    );
    console.log('Basic notification result:', result);
  };

  const testDirectEvent = () => {
    console.log('🧪 Testing direct event dispatch to notification bell...');
    
    const eventDetail = {
      title: '🧪 Direct Test Notification',
      body: 'This notification was dispatched directly to test the bell',
      data: { 
        testType: 'direct-event',
        timestamp: Date.now(),
        source: 'manual-test'
      }
    };
    
    console.log('🧪 Dispatching event with detail:', eventDetail);
    
    window.dispatchEvent(new CustomEvent('local-notification', {
      detail: eventDetail
    }));
    
    console.log('🧪 Direct event dispatched - check notification bell!');
  };

  const testOrderNotification = async (status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'processing' | 'in-progress' | 'ready' | 'completed') => {
    const orderId = `ORD-${Date.now()}`;
    const result = await orderService.showOrderNotification(
      orderId,
      status,
      'John Doe'
    );
    console.log('Order notification result:', result);
  };

  const testOrderReceived = () => testOrderNotification('pending');
  const testOrderAccepted = () => testOrderNotification('confirmed');
  const testOrderRejected = () => testOrderNotification('rejected');
  const testOrderCancelled = () => testOrderNotification('cancelled');
  const testOrderStatusUpdate = () => testOrderNotification('processing');

  const refreshStatus = async () => {
    const status = await checkNotificationStatus();
    setNotificationStatus(status);
    await checkFirebaseStatus();
  };

  // Firebase Web Push handler functions
  const handleEnableFirebaseNotifications = async () => {
    setFirebaseStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
    
    try {
      const result = await enableNotificationsManually();
      
      setFirebaseResult(result);
      setFirebaseStatus(prev => ({
        ...prev,
        enabled: result.success,
        isLoading: false,
        error: result.success ? undefined : result.error
      }));

      if (result.success) {
        await showLocalNotification(
          '🎉 Firebase Notifications Enabled!',
          'You can now receive Firebase push notifications from Salvatore.',
          { type: 'firebase-success' }
        );
      } else if ((result as any).permissionState === 'denied') {
        setFirebaseStatus(prev => ({
          ...prev,
          error: 'Permission denied - see recovery instructions below'
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setFirebaseStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  const handleTestFirebaseNotification = async () => {
    setFirebaseStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await testNotificationFunctionality();
      setFirebaseResult(result);
      
      setFirebaseStatus(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setFirebaseStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  const handleRegisterFirebasePush = async () => {
    const token = authToken || idToken;
    if (!token) {
      setFirebaseStatus(prev => ({
        ...prev,
        error: 'Authentication token required for Firebase registration'
      }));
      return;
    }

    setFirebaseStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await registerForWebPushNotifications(userId, token);
      setFirebaseResult(result);
      
      setFirebaseStatus(prev => ({
        ...prev,
        token: result.token,
        isLoading: false,
        error: result.success ? undefined : result.error?.message
      }));

      if (result.success) {
        await showLocalNotification(
          '🚀 Firebase Registration Complete!',
          `Firebase Web Push token registered successfully.`,
          { type: 'firebase-success', token: result.token }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setFirebaseStatus(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  // API Test Functions
  const testDeviceRegistration = async () => {
    const token = authToken || idToken;
    if (!token) {
      setApiResults({ error: 'No Auth0 JWT token available. Please login first.' });
      return;
    }

    console.log('Testing device registration...');
    const result = await registerDevice(userId, pushToken || undefined, token);
    setApiResults({ 
      type: 'Device Registration',
      result,
      timestamp: new Date().toISOString()
    });
    console.log('Device registration result:', result);
  };

  const testCreateOrder = async () => {
    const token = authToken || idToken;
    if (!token) {
      setApiResults({ error: 'No Auth0 JWT token available. Please login first.' });
      return;
    }

    console.log('Testing order creation...');
    const result = await orderService.createTestOrder(userId, token);
    setApiResults({ 
      type: 'Create Order',
      result,
      timestamp: new Date().toISOString()
    });
    console.log('Create order result:', result);
  };

  const testCreateCustomOrder = async () => {
    const token = authToken || idToken;
    if (!token) {
      setApiResults({ error: 'No Auth0 JWT token available. Please login first.' });
      return;
    }

    console.log('Testing custom order creation...');
    const result = await orderService.createOrderWithData({
      serviceProviderId: userId,
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@test.com',
      customerPhone: '+1-555-987-6543',
      serviceName: 'Notification Test Service',
      serviceDescription: 'Testing push notifications through order creation',
      price: 41.30,
      authToken: token
    });
    setApiResults({ 
      type: 'Create Custom Order',
      result,
      timestamp: new Date().toISOString()
    });
    console.log('Create custom order result:', result);
  };

  const testFetchOrders = async () => {
    const token = authToken || idToken;
    if (!token) {
      setApiResults({ error: 'No Auth0 JWT token available. Please login first.' });
      return;
    }

    console.log('Testing fetch orders...');
    const result = await orderService.fetchOrdersViaAPI(userId, token);
    setApiResults({ 
      type: 'Fetch Orders',
      result,
      timestamp: new Date().toISOString()
    });
    console.log('Fetch orders result:', result);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notification Testing</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        
        {/* Status Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Notification Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {notificationStatus && (
              <>
                <IonItem>
                  <IonLabel>Platform</IonLabel>
                  <IonBadge color="primary">
                    {navigator.userAgent.includes('Mobile') ? 'Mobile Web' : 'Desktop Web'}
                  </IonBadge>
                </IonItem>
                <IonItem>
                  <IonLabel>Local Notifications</IonLabel>
                  <IonBadge color={notificationStatus.localEnabled ? 'success' : 'warning'}>
                    {notificationStatus.localEnabled ? 'Available' : 'Not Available'}
                  </IonBadge>
                </IonItem>
                <IonItem>
                  <IonLabel>In-App Notifications</IonLabel>
                  <IonBadge color="success">
                    Always Available
                  </IonBadge>
                </IonItem>
                <IonItem>
                  <IonLabel>Push Notifications (FCM)</IonLabel>
                  <IonBadge color={pushToken ? 'success' : 'warning'}>
                    {pushToken ? 'Token Available' : 'Web - Not Required'}
                  </IonBadge>
                </IonItem>
                {pushToken && (
                  <IonItem>
                    <IonLabel>FCM Token</IonLabel>
                    <IonLabel className="ion-text-wrap" style={{ fontSize: '0.8em' }}>
                      {pushToken.substring(0, 20) + '...'}
                    </IonLabel>
                  </IonItem>
                )}
              </>
            )}
            <IonButton fill="outline" size="small" onClick={refreshStatus}>
              Refresh Status
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Test Actions */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Test Notifications</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton expand="block" onClick={testBasicNotification} className="ion-margin-bottom">
              Test Basic Notification
            </IonButton>
            
            <IonButton expand="block" fill="outline" onClick={testDirectEvent} className="ion-margin-bottom" color="secondary">
              🧪 Test Direct Bell Event
            </IonButton>
            
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Order Status Notifications:</h4>
              <div className="space-y-2">
                <IonButton expand="block" fill="outline" onClick={testOrderReceived} className="ion-margin-bottom">
                  Test Order Received
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={testOrderAccepted} className="ion-margin-bottom">
                  Test Order Accepted
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={testOrderRejected} className="ion-margin-bottom">
                  Test Order Rejected
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={testOrderCancelled} className="ion-margin-bottom">
                  Test Order Cancelled
                </IonButton>
                <IonButton expand="block" fill="outline" onClick={testOrderStatusUpdate} className="ion-margin-bottom">
                  Test Order Status Update
                </IonButton>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Last Notification */}
        {lastNotification && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Last Notification Action</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel>Title</IonLabel>
                <IonLabel>{lastNotification.title || 'N/A'}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>Body</IonLabel>
                <IonLabel>{lastNotification.body || 'N/A'}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>Action ID</IonLabel>
                <IonLabel>{lastNotification.actionId || 'N/A'}</IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>Data</IonLabel>
                <IonLabel className="ion-text-wrap">
                  {JSON.stringify(lastNotification.data)}
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>
        )}

        {/* Notification Bell Component Examples */}
        {/* <IonCard>
          <IonCardHeader>
            <IonCardTitle>Notification Bell Components</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <NotificationBucketList />
          </IonCardContent>
        </IonCard> */}

        {/* Enhanced Firebase Web Push Demo */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🔥 Firebase Web Push Demo</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Current Status */}
            <IonItem>
              <IonLabel>Notifications Enabled</IonLabel>
              <IonBadge color={firebaseStatus.enabled ? 'success' : 'warning'}>
                {firebaseStatus.enabled ? 'Yes' : 'No'}
              </IonBadge>
            </IonItem>

            {firebaseStatus.token && (
              <IonItem>
                <IonLabel>Firebase Token</IonLabel>
                <IonText style={{ fontSize: '0.8em' }}>
                  {firebaseStatus.token.substring(0, 20)}...
                </IonText>
              </IonItem>
            )}

            {firebaseStatus.error && (
              <IonItem color="danger">
                <IonLabel>
                  <h3>Error</h3>
                  <p>{firebaseStatus.error}</p>
                </IonLabel>
              </IonItem>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <IonButton 
                expand="block" 
                onClick={handleEnableFirebaseNotifications}
                disabled={firebaseStatus.isLoading}
                color={firebaseStatus.enabled ? 'success' : 'primary'}
              >
                {firebaseStatus.isLoading ? 'Processing...' : (firebaseStatus.enabled ? '✅ Notifications Enabled' : '🔔 Enable Notifications')}
              </IonButton>

              {firebaseStatus.enabled && (
                <IonButton 
                  expand="block" 
                  fill="outline"
                  onClick={handleTestFirebaseNotification}
                  disabled={firebaseStatus.isLoading}
                >
                  {firebaseStatus.isLoading ? 'Testing...' : '🧪 Test Notification'}
                </IonButton>
              )}

              {firebaseStatus.enabled && (authToken || idToken) && (
                <IonButton 
                  expand="block" 
                  color="secondary"
                  onClick={handleRegisterFirebasePush}
                  disabled={firebaseStatus.isLoading || !!firebaseStatus.token}
                >
                  {firebaseStatus.isLoading ? 'Registering...' : (firebaseStatus.token ? '✅ Firebase Registered' : '🚀 Register Firebase Push')}
                </IonButton>
              )}

              {/* Retry button for denied permissions */}
              {!firebaseStatus.enabled && firebaseResult && (firebaseResult as any).canRetry && (
                <IonButton 
                  expand="block" 
                  fill="outline"
                  color="warning"
                  onClick={handleEnableFirebaseNotifications}
                  disabled={firebaseStatus.isLoading}
                >
                  🔄 Try Again
                </IonButton>
              )}
            </div>

            {/* Permission Denied Instructions */}
            {firebaseResult && (firebaseResult as any).permissionState === 'denied' && (firebaseResult as any).instructions && (
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '8px', 
                border: '1px solid #ffeaa7' 
              }}>
                <IonText>
                  <h4 style={{ color: '#856404', marginBottom: '8px' }}>📋 How to Enable Notifications:</h4>
                  <pre style={{ 
                    fontSize: '0.85em', 
                    whiteSpace: 'pre-wrap', 
                    color: '#856404',
                    fontFamily: 'inherit',
                    margin: 0
                  }}>
                    {(firebaseResult as any).instructions}
                  </pre>
                </IonText>
              </div>
            )}

            {/* Last Result Debug Info */}
            {firebaseResult && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <IonText>
                  <h4>Last Firebase Result:</h4>
                  <pre style={{ fontSize: '0.75em', overflow: 'auto' }}>
                    {JSON.stringify(firebaseResult, null, 2)}
                  </pre>
                </IonText>
              </div>
            )}

            {/* Usage Instructions */}
            <div style={{ marginTop: '16px' }}>
              <IonText color="medium">
                <h4>Quick Firebase Test Steps:</h4>
                <ol style={{ paddingLeft: '20px', fontSize: '0.9em' }}>
                  <li>Click "Enable Notifications" (browser will ask for permission)</li>
                  <li>Click "Test Notification" to verify it works</li>
                  <li>Click "Register Firebase Push" to connect to your API</li>
                </ol>
              </IonText>
            </div>
          </IonCardContent>
        </IonCard>

       

        {/* API Integration Tests */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>🚀 Production API Integration</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              {/* Auth Token Input */}
              <div>
                <IonLabel className="font-semibold">
                  Auth0 JWT Token: 
                  {idToken && <span className="text-green-600 text-sm ml-2">✅ Auto-detected</span>}
                </IonLabel>
                <IonInput 
                  value={authToken}
                  onIonInput={(e) => setAuthToken(e.detail.value!)}
                  placeholder={idToken ? "Using authenticated session token..." : "Paste your Auth0 JWT token here..."}
                  className="mt-2"
                  fill="outline"
                  readonly={!!idToken}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {idToken 
                    ? "Token automatically detected from your login session" 
                    : "Get this from browser dev tools → Network → Authorization header after login"
                  }
                </p>
              </div>

              {/* User ID Input */}
              <div>
                <IonLabel className="font-semibold">
                  User/Service Provider ID:
                  {userContext?.sub && <span className="text-green-600 text-sm ml-2">✅ Auto-detected</span>}
                </IonLabel>
                <IonInput 
                  value={userId}
                  onIonInput={(e) => setUserId(e.detail.value!)}
                  placeholder="6abc3caa-a411-49ff-9ff7-c142a002033c"
                  className="mt-2"
                  fill="outline"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {userContext?.email && `Logged in as: ${userContext.email}`}
                </p>
              </div>

              {/* API Test Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={testDeviceRegistration}
                  disabled={!authToken && !idToken}
                >
                  📱 Register Device
                </IonButton>
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={testCreateOrder}
                  disabled={!authToken && !idToken}
                >
                  📦 Create Test Order
                </IonButton>
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={testCreateCustomOrder}
                  disabled={!authToken && !idToken}
                >
                  🎯 Create Custom Order
                </IonButton>
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  onClick={testFetchOrders}
                  disabled={!authToken && !idToken}
                >
                  📋 Fetch Orders
                </IonButton>
              </div>

              {/* API Results */}
              {apiResults && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    {apiResults.error ? '❌ Error' : '✅ Success'} - {apiResults.type}
                  </h4>
                  <pre className="text-xs bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto">
                    {JSON.stringify(apiResults.result || apiResults.error, null, 2)}
                  </pre>
                  {apiResults.timestamp && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(apiResults.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Instructions */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Notification Types & Setup</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ Currently Working (No Firebase needed):</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li><strong>• Local Notifications:</strong> Click test buttons above - works in browser and mobile apps</li>
                  <li><strong>• In-App Notifications:</strong> Real-time updates while app is open (see navigation bell)</li>
                  <li><strong>• Notification Bell UI:</strong> Interactive dropdown with notification management</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-amber-600 mb-2">🔧 Push Notifications (Optional - Requires Firebase):</h4>
                <ul className="text-sm space-y-1 ml-4">
                  <li><strong>• Remote Push:</strong> Notifications when app is closed/background</li>
                  <li><strong>• Setup needed:</strong> Firebase project + web app configuration</li>
                  <li><strong>• Use case:</strong> Marketing, urgent alerts, offline notifications</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🎯 Recommendation:</h4>
                <p className="text-sm">
                  Your current setup handles 90% of notification needs. Only add Firebase if you specifically 
                  need to send notifications when users aren't actively using the app.
                </p>
              </div>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default NotificationTestPage;