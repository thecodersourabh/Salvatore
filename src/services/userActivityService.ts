/**
 * User Activity Service
 * 
 * Hybrid approach for online status detection:
 * - Combines WebSocket connection status
 * - Tracks last message timestamps
 * - Polls for recent activity to simulate online presence
 */

export interface UserActivity {
  userId: string;
  lastSeen: Date;
  lastMessage?: Date;
  isConnected: boolean;
  status: 'online' | 'recently-active' | 'away' | 'offline';
}

export interface ActivityConfig {
  onlineThresholdMinutes: number; // Consider online if active within X minutes
  recentlyActiveThresholdMinutes: number; // Consider recently active if active within X minutes
  pollingIntervalMs: number; // How often to check activity
}

const DEFAULT_CONFIG: ActivityConfig = {
  onlineThresholdMinutes: 5, // Online if active in last 5 minutes
  recentlyActiveThresholdMinutes: 30, // Recently active if active in last 30 minutes
  pollingIntervalMs: 60000, // Poll every minute
};

export class UserActivityService {
  private static instance: UserActivityService;
  private activities: Map<string, UserActivity> = new Map();
  private config: ActivityConfig = DEFAULT_CONFIG;
  private pollingInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(activities: Map<string, UserActivity>) => void> = new Set();

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): UserActivityService {
    if (!UserActivityService.instance) {
      UserActivityService.instance = new UserActivityService();
    }
    return UserActivityService.instance;
  }

  /**
   * Start activity monitoring
   */
  start(config?: Partial<ActivityConfig>): void {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // Listen for new messages to track activity
    window.addEventListener('new-messages', this.handleNewMessage);

    // Listen for WebSocket connection changes
    window.addEventListener('user-status-change', this.handleStatusChange);

    // Start periodic polling
    this.startPolling();
  }

  /**
   * Stop activity monitoring
   */
  stop(): void {
    window.removeEventListener('new-messages', this.handleNewMessage);
    window.removeEventListener('user-status-change', this.handleStatusChange);

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Handle new message event
   */
  private handleNewMessage = (event: Event) => {
    const customEvent = event as CustomEvent;
    const messages = customEvent.detail.messages || [];

    messages.forEach((message: any) => {
      if (message.senderId) {
        this.updateUserActivity(message.senderId, {
          lastMessage: new Date(message.timestamp || Date.now()),
          lastSeen: new Date(),
        });
      }
    });
  };

  /**
   * Handle status change event (WebSocket connection)
   */
  private handleStatusChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { userId, status } = customEvent.detail;

    if (userId) {
      const isConnected = status === 'online';
      this.updateUserActivity(userId, {
        isConnected,
        lastSeen: isConnected ? new Date() : undefined,
      });
    }
  };

  /**
   * Update user activity
   */
  updateUserActivity(userId: string, updates: Partial<Omit<UserActivity, 'userId' | 'status'>>): void {
    const existing = this.activities.get(userId) || {
      userId,
      lastSeen: new Date(),
      isConnected: false,
      status: 'offline' as const,
    };

    const updated: UserActivity = {
      ...existing,
      ...updates,
      status: this.calculateStatus({
        ...existing,
        ...updates,
      }),
    };

    this.activities.set(userId, updated);
    this.notifyListeners();
  }

  /**
   * Calculate user status based on activity
   */
  private calculateStatus(activity: Omit<UserActivity, 'status'>): UserActivity['status'] {
    const now = new Date();
    const lastSeenMinutes = (now.getTime() - activity.lastSeen.getTime()) / (1000 * 60);
    const lastMessageMinutes = activity.lastMessage
      ? (now.getTime() - activity.lastMessage.getTime()) / (1000 * 60)
      : Infinity;

    // If WebSocket is connected and recently active, consider online
    if (activity.isConnected && lastSeenMinutes <= this.config.onlineThresholdMinutes) {
      return 'online';
    }

    // If recent message activity, consider recently active
    if (lastMessageMinutes <= this.config.onlineThresholdMinutes) {
      return 'online';
    }

    // If somewhat recent activity, consider recently active
    if (lastMessageMinutes <= this.config.recentlyActiveThresholdMinutes || 
        lastSeenMinutes <= this.config.recentlyActiveThresholdMinutes) {
      return 'recently-active';
    }

    // If connected but no recent activity, consider away
    if (activity.isConnected) {
      return 'away';
    }

    // Otherwise offline
    return 'offline';
  }

  /**
   * Start periodic polling to update statuses
   */
  private startPolling(): void {
    this.pollingInterval = setInterval(() => {
      let hasUpdates = false;

      // Recalculate all statuses based on current time
      for (const activity of this.activities.values()) {
        const newStatus = this.calculateStatus(activity);
        if (newStatus !== activity.status) {
          activity.status = newStatus;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        this.notifyListeners();
      }
    }, this.config.pollingIntervalMs);
  }

  /**
   * Subscribe to activity updates
   */
  subscribe(listener: (activities: Map<string, UserActivity>) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of activity updates
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(new Map(this.activities));
      } catch (error) {
        console.error('Error in activity listener:', error);
      }
    });
  }

  /**
   * Get current user activities
   */
  getActivities(): Map<string, UserActivity> {
    return new Map(this.activities);
  }

  /**
   * Get activity for specific user
   */
  getUserActivity(userId: string): UserActivity | null {
    return this.activities.get(userId) || null;
  }

  /**
   * Manually mark user as active (for current user actions)
   */
  markUserActive(userId: string): void {
    this.updateUserActivity(userId, {
      lastSeen: new Date(),
      isConnected: true,
    });
  }

  /**
   * Get online user count
   */
  getOnlineCount(): number {
    let count = 0;
    for (const activity of this.activities.values()) {
      if (activity.status === 'online') {
        count++;
      }
    }
    return count;
  }

  /**
   * Clear old activities (cleanup)
   */
  clearOldActivities(olderThanDays = 7): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const userIdsToRemove: string[] = [];
    
    for (const [userId, activity] of this.activities.entries()) {
      if (activity.lastSeen < cutoff) {
        userIdsToRemove.push(userId);
      }
    }

    userIdsToRemove.forEach(userId => {
      this.activities.delete(userId);
    });

    if (userIdsToRemove.length > 0) {
      this.notifyListeners();
    }
  }
}

// Export singleton instance
export const userActivityService = UserActivityService.getInstance();