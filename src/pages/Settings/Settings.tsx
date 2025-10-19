import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { translations } from '../../utils/translations';
import { IonAccordion, IonAccordionGroup, IonItem, IonLabel, IonList, IonNote, IonSelect, IonSelectOption, IonToggle } from '@ionic/react';
import { useCurrency } from '../../context/CurrencyContext';

export const Settings: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const t = translations[language];
  const { currency, setCurrency } = useCurrency();
 
  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-gray-900 min-h-screen">
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
                    <IonSelectOption value="USD">USD - $</IonSelectOption>
                    <IonSelectOption value="INR">INR - ₹</IonSelectOption>
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
                {["Inbox messages", "Order messages", "Order updates", "Rating reminders", "Buyer briefs", "Account updates"].map(label => (
                  <IonItem key={label} className="border-b border-gray-100 dark:border-gray-800">
                    <IonLabel>{label}</IonLabel>
                    <IonToggle slot="end" color="primary" />
                  </IonItem>
                ))}
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