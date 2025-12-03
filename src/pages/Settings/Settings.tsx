import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { translations } from '../../utils/translations';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonList, IonNote, IonSelect, IonSelectOption, IonToggle } from '@ionic/react';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../hooks/useAuth';
import { UserService } from '../../services';


export const Settings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const t = translations[language];
  const { currency, setCurrency } = useCurrency();
  const navigate = useNavigate();
  const auth = useAuth();

  const [notifSettings, setNotifSettings] = useState<{ email: boolean; push: boolean; sms: boolean }>({
    email: true,
    push: true,
    sms: true
  });

  const categoryList: { key: string; label: string }[] = [
    { key: 'inboxMessages', label: 'Inbox messages' },
    { key: 'orderMessages', label: 'Order messages' },
    { key: 'orderUpdates', label: 'Order updates' },
    { key: 'ratingReminders', label: 'Rating reminders' },
    { key: 'buyerBriefs', label: 'Buyer briefs' },
    { key: 'accountUpdates', label: 'Account updates' },
    { key: 'realtime', label: 'Real-time notifications' }
  ];

  const [categorySettings, setCategorySettings] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const apiUser = auth.apiUser;
    if (apiUser && apiUser.preferences && apiUser.preferences.notificationSettings) {
      const ns = apiUser.preferences.notificationSettings as any;
      setNotifSettings({
        email: !!ns.email,
        push: !!ns.push,
        sms: !!ns.sms
      });
      // Initialize per-category boolean settings. Support nested `categories` or flat keys.
      const catsNested = ns?.categories;
      const mapped: Record<string, boolean> = {};
      if (catsNested && typeof catsNested === 'object') {
        Object.keys(catsNested).forEach(k => {
          const c = catsNested[k];
          // treat category as enabled if any channel is enabled
          mapped[k] = !!(c?.email || c?.push || c?.sms);
        });
      }
      // also pick up flattened boolean fields if present
      categoryList.forEach(c => {
        const flat = ns[c.key];
        mapped[c.key] = typeof flat === 'boolean' ? flat : (mapped[c.key] ?? true);
      });
      setCategorySettings(mapped);
    }
  }, [auth.apiUser]);

  const saveNotificationPreferences = async (settings: { email: boolean; push: boolean; sms: boolean }, categories?: Record<string, boolean>) => {
    try {
      if (!auth.user?.email) return;
      // Build flattened notificationSettings: global channels + per-category booleans
      const notificationSettings: any = { ...settings };
      const catsToUse = categories || categorySettings;
      Object.keys(catsToUse || {}).forEach(k => {
        notificationSettings[k] = catsToUse[k];
      });
      await UserService.updateUser(auth.user.email, {
        preferences: {
          notificationSettings,
          visibility: auth.apiUser?.preferences?.visibility || { public: true, searchable: true }
        }
      });
      // Update local state (already set by caller) and optionally request a refresh elsewhere
      console.log('Notification preferences saved');
    } catch (error) {
      console.error('Failed to save notification preferences', error);
    }
  };

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
 
  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t.settings.title}</h1>
      <IonAccordionGroup expand="inset" multiple={true} value={["general", "notifications", "realtime"]}>
          {/* General Panel */}
          <IonAccordion value="general" className="mb-4">
            <IonItem slot="header" className="bg-gray-100 dark:bg-gray-800">
              <IonLabel className="font-semibold text-lg text-gray-900 dark:text-white">General</IonLabel>
            </IonItem>
            <div className="ion-padding bg-white dark:bg-gray-900" slot="content">
              <IonList lines="full">
                  <IonSelect 
                    label={t.settings.language}
                    value={language}
                    placeholder={t.settings.selectLanguage}
                    className="w-full"
                    onIonChange={e => setLanguage(e.detail.value as 'en' | 'hi')}
                  >
                    <IonSelectOption value="en">{t.settings.english}</IonSelectOption>
                    <IonSelectOption value="hi">{t.settings.hindi}</IonSelectOption>
                  </IonSelect>
                
                  <IonSelect
                    label={t.settings.theme}
                    value={theme}
                    className="w-full"
                    placeholder="Select Theme"
                    onIonChange={e => setTheme(e.detail.value as 'light' | 'dark')}
                  >
                    <IonSelectOption value="light">{t.settings.themeLight}</IonSelectOption>
                    <IonSelectOption value="dark">{t.settings.themeDark}</IonSelectOption>
                  </IonSelect>

                  {/* Currency Selector */}
                  <IonSelect
                    label="Currency"
                    value={currency}
                    className="w-full mt-2"
                    onIonChange={e => setCurrency(e.detail.value as 'USD' | 'INR')}
                  >
                    <IonSelectOption value="INR">INR - ₹</IonSelectOption>
                    <IonSelectOption value="USD">USD - $</IonSelectOption>
                  </IonSelect>
              </IonList>
            </div>
          </IonAccordion>

          {/* Notifications Panel */}
          <IonAccordion className="mb-4" value="notifications">
            <IonItem slot="header" className="bg-gray-100 dark:bg-gray-800">
              <IonLabel className="font-semibold text-lg text-gray-900 dark:text-white">Notifications</IonLabel>
            </IonItem>
            <div className="ion-padding bg-white dark:bg-gray-900" slot="content">
              <IonNote className="block mb-4 text-sm text-gray-500 dark:text-gray-400">
                Select the notifications you want and how you'd like to receive them. When necessary, we'll send essential account and order notifications.
              </IonNote>
              <IonList lines="full" className="rounded-lg border border-gray-200 dark:border-gray-700">
                <IonItem className="border-b border-gray-100 dark:border-gray-800">
                  <IonLabel>Email</IonLabel>
                  <IonToggle slot="end" color="primary" checked={notifSettings.email} onIonChange={e => {
                    const v = !!e.detail.checked;
                    const newSettings = { ...notifSettings, email: v };
                    setNotifSettings(newSettings);
                    saveNotificationPreferences(newSettings);
                  }} />
                </IonItem>
                <IonItem className="border-b border-gray-100 dark:border-gray-800">
                  <IonLabel>Push</IonLabel>
                  <IonToggle slot="end" color="primary" checked={notifSettings.push} onIonChange={e => {
                    const v = !!e.detail.checked;
                    const newSettings = { ...notifSettings, push: v };
                    setNotifSettings(newSettings);
                    saveNotificationPreferences(newSettings);
                  }} />
                </IonItem>
                <IonItem className="border-b border-gray-100 dark:border-gray-800">
                  <IonLabel>SMS</IonLabel>
                  <IonToggle slot="end" color="primary" checked={notifSettings.sms} onIonChange={e => {
                    const v = !!e.detail.checked;
                    const newSettings = { ...notifSettings, sms: v };
                    setNotifSettings(newSettings);
                    saveNotificationPreferences(newSettings);
                  }} />
                </IonItem>
                {categoryList.map(cat => {
                  const enabled = !!categorySettings[cat.key];
                  return (
                    <IonItem key={cat.key} className="border-b border-gray-100 dark:border-gray-800">
                      <IonLabel>{cat.label}</IonLabel>
                      <IonToggle slot="end" color="primary" checked={enabled} onIonChange={e => {
                        const v = !!e.detail.checked;
                        const newCats = { ...categorySettings, [cat.key]: v };
                        setCategorySettings(newCats);
                        saveNotificationPreferences(notifSettings, newCats);
                      }} />
                    </IonItem>
                  );
                })}
              </IonList>
            </div>
          </IonAccordion>

          {/* Real-time Notifications Panel */}
          <IonAccordion value="realtime">
            <IonItem slot="header" className="bg-gray-100 dark:bg-gray-800">
              <IonLabel className="font-semibold text-lg text-gray-900 dark:text-white">Real-time notifications</IonLabel>
            </IonItem>
            <div className="ion-padding bg-white dark:bg-gray-900" slot="content">
              <IonNote className="block mb-4 text-sm text-gray-500 dark:text-gray-400">
                Receive on-screen updates, announcements, and more while online.
              </IonNote>
              <IonList lines="full">
                <IonItem>
                  <IonLabel>Real-time notifications</IonLabel>
                  <IonToggle slot="end" color="primary" />
                </IonItem>
                <IonItem>
                  <IonLabel>Sound effects</IonLabel>
                  <IonToggle slot="end" color="primary" />
                </IonItem>
              </IonList>
            </div>
          </IonAccordion>
       </IonAccordionGroup>
    </div>
  );
};