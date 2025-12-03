import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { setupIonicReact } from '@ionic/react';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Import notification service for initial setup
import { initNotificationService } from './services/notificationService';

// AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Ionic styles
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './styles/ionic-overrides.css';
import './index.css';

// Initialize Ionic React
setupIonicReact();

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Initialize Capacitor for mobile platforms
if (Capacitor.isNativePlatform()) {
  console.log('Running on native platform:', Capacitor.getPlatform());
  
  // Initialize notification service immediately for first-time installation
  (async () => {
    console.log('🔔 MAIN: Initializing notification service for first-time setup...');
    try {
      const result = await initNotificationService();
      if (result.success) {
        console.log('🔔 MAIN: Notification service initialized successfully');
      } else {
        console.warn('🔔 MAIN: Notification initialization failed:', result.error?.message);
        // Don't block app startup even if notifications fail
      }
    } catch (error) {
      console.error('🔔 MAIN: Notification initialization error:', error);
      // Don't block app startup even if notifications fail
    }
  })();
}

const AppComponent = App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppComponent />
    </ErrorBoundary>
  </StrictMode>
);
