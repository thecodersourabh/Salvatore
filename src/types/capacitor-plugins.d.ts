declare module '@capacitor/push-notifications' {
  export interface PushNotificationPlugin {
    register(): Promise<void>;
    unregister(): Promise<void>;
    getDeliveredNotifications(): Promise<{ notifications: DeliveredNotification[] }>;
    removeDeliveredNotifications(delivered: { notifications: DeliveredNotification[] }): Promise<void>;
    removeAllDeliveredNotifications(): Promise<void>;
    createChannel(channel: NotificationChannel): Promise<void>;
    deleteChannel(args: { id: string }): Promise<void>;
    listChannels(): Promise<{ channels: NotificationChannel[] }>;
    checkPermissions(): Promise<PermissionStatus>;
    requestPermissions(): Promise<PermissionStatus>;
    addListener(eventName: 'registration', listenerFunc: (token: Token) => void): Promise<PluginListenerHandle>;
    addListener(eventName: 'registrationError', listenerFunc: (error: any) => void): Promise<PluginListenerHandle>;
    addListener(eventName: 'pushNotificationReceived', listenerFunc: (notification: PushNotificationSchema) => void): Promise<PluginListenerHandle>;
    addListener(eventName: 'pushNotificationActionPerformed', listenerFunc: (notification: ActionPerformed) => void): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
  }
  
  export const PushNotifications: PushNotificationPlugin;
  
  export interface Token {
    value: string;
  }
  
  export interface PushNotificationSchema {
    title?: string;
    body?: string;
    id: string;
    badge?: number;
    notification?: any;
    data: any;
    click_action?: string;
    link?: string;
    group?: string;
    groupSummary?: boolean;
  }
  
  export interface ActionPerformed {
    actionId: string;
    inputValue?: string;
    notification: PushNotificationSchema;
  }
  
  export interface DeliveredNotification {
    id?: string;
    tag?: string;
    title?: string;
    body?: string;
    group?: string;
    groupSummary?: boolean;
    data?: any;
  }
  
  export interface NotificationChannel {
    id: string;
    name: string;
    description?: string;
    sound?: string;
    importance: 1 | 2 | 3 | 4 | 5;
    visibility?: 0 | 1 | -1;
    lights?: boolean;
    lightColor?: string;
    vibration?: boolean;
  }
  
  export interface PermissionStatus {
    receive: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';
  }
  
  export interface PluginListenerHandle {
    remove(): Promise<void>;
  }
}

declare module '@capacitor/local-notifications' {
  export interface LocalNotificationPlugin {
    schedule(options: { notifications: LocalNotificationSchema[] }): Promise<LocalNotificationScheduleResult>;
    getPending(): Promise<{ notifications: LocalNotificationRequest[] }>;
    registerActionTypes(options: { types: NotificationActionType[] }): Promise<void>;
    cancel(options: { notifications: LocalNotificationRequest[] }): Promise<void>;
    areEnabled(): Promise<{ value: boolean }>;
    createChannel(channel: NotificationChannel): Promise<void>;
    deleteChannel(channel: { id: string }): Promise<void>;
    listChannels(): Promise<{ channels: NotificationChannel[] }>;
    checkPermissions(): Promise<PermissionStatus>;
    requestPermissions(): Promise<PermissionStatus>;
    addListener(eventName: 'localNotificationReceived', listenerFunc: (notification: LocalNotificationSchema) => void): Promise<PluginListenerHandle>;
    addListener(eventName: 'localNotificationActionPerformed', listenerFunc: (notification: ActionPerformed) => void): Promise<PluginListenerHandle>;
    removeAllListeners(): Promise<void>;
  }
  
  export const LocalNotifications: LocalNotificationPlugin;
  
  export interface LocalNotificationSchema {
    title: string;
    body: string;
    id: number;
    schedule?: ScheduleOptions;
    sound?: string;
    attachments?: NotificationAttachment[];
    actionTypeId?: string;
    extra?: any;
    threadIdentifier?: string;
    summaryArgument?: string;
    group?: string;
    groupSummary?: boolean;
    channelId?: string;
    ongoing?: boolean;
    autoCancel?: boolean;
    largeBody?: string;
    summaryText?: string;
    smallIcon?: string;
    largeIcon?: string;
    iconColor?: string;
  }
  
  export interface LocalNotificationRequest {
    id: number;
  }
  
  export interface LocalNotificationScheduleResult {
    notifications: LocalNotificationRequest[];
  }
  
  export interface ScheduleOptions {
    at?: Date;
    repeats?: boolean;
    allowWhileIdle?: boolean;
    on?: ScheduleOn;
    every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute' | 'second';
    count?: number;
  }
  
  export interface ScheduleOn {
    year?: number;
    month?: number;
    day?: number;
    hour?: number;
    minute?: number;
    second?: number;
  }
  
  export interface NotificationAttachment {
    id: string;
    url: string;
    options?: NotificationAttachmentOptions;
  }
  
  export interface NotificationAttachmentOptions {
    iosUNNotificationAttachmentOptionsTypeHintKey?: string;
    iosUNNotificationAttachmentOptionsThumbnailHiddenKey?: string;
    iosUNNotificationAttachmentOptionsThumbnailClippingRectKey?: string;
    iosUNNotificationAttachmentOptionsThumbnailTimeKey?: string;
  }
  
  export interface NotificationActionType {
    id: string;
    actions?: NotificationAction[];
    iosHiddenPreviewsBodyPlaceholder?: string;
    iosCustomDismissAction?: boolean;
    iosAllowInCarPlay?: boolean;
    iosHiddenPreviewsShowTitle?: boolean;
    iosHiddenPreviewsShowSubtitle?: boolean;
  }
  
  export interface NotificationAction {
    id: string;
    title: string;
    requiresAuthentication?: boolean;
    foreground?: boolean;
    destructive?: boolean;
    input?: boolean;
    inputButtonTitle?: string;
    inputPlaceholder?: string;
  }
}
