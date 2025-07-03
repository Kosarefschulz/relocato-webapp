import { useEffect, useState, useCallback } from 'react';
import { realtimeService, UserPresence, RealtimeEvent } from '../services/realtimeService';

// Hook for online users presence
export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial online users
    realtimeService.getOnlineUsers().then(users => {
      setOnlineUsers(users);
      setLoading(false);
    });

    // Subscribe to presence updates
    const unsubscribe = realtimeService.onPresenceUpdate((users) => {
      setOnlineUsers(users);
    });

    return unsubscribe;
  }, []);

  return { onlineUsers, loading };
}

// Hook for customer real-time updates
export function useCustomerRealtime(customerId: string | undefined) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!customerId) return;

    const unsubscribe = realtimeService.subscribeToCustomerUpdates(
      customerId,
      (payload) => {
        setLastUpdate(new Date());
        // You can handle the update here or pass a callback
      }
    );

    return unsubscribe;
  }, [customerId]);

  return { lastUpdate };
}

// Hook for quote real-time updates
export function useQuoteRealtime(quoteId: string | undefined) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!quoteId) return;

    const unsubscribe = realtimeService.subscribeToQuoteUpdates(
      quoteId,
      (payload) => {
        setLastUpdate(new Date());
      }
    );

    return unsubscribe;
  }, [quoteId]);

  return { lastUpdate };
}

// Hook for team locations
export function useTeamLocations() {
  const [teamLocations, setTeamLocations] = useState<any[]>([]);

  const broadcastLocation = useCallback(async (teamId: string, location: { lat: number; lng: number }) => {
    await realtimeService.broadcastTeamLocation(teamId, location);
  }, []);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToTeamLocations((locations) => {
      setTeamLocations(locations);
    });

    return unsubscribe;
  }, []);

  return { teamLocations, broadcastLocation };
}

// Hook for app events
export function useRealtimeEvents(eventType?: string) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  const broadcastEvent = useCallback(async (event: RealtimeEvent) => {
    await realtimeService.broadcastEvent(event);
  }, []);

  useEffect(() => {
    if (!eventType) return;

    const unsubscribe = realtimeService.onEvent(eventType, (event) => {
      setEvents(prev => [...prev, event].slice(-50)); // Keep last 50 events
    });

    return unsubscribe;
  }, [eventType]);

  return { events, broadcastEvent };
}

// Hook for notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const sendNotification = useCallback(async (
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      data?: any;
    }
  ) => {
    await realtimeService.sendNotification(userId, notification);
  }, []);

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      setNotifications(prev => [...prev, {
        ...event.detail,
        id: Date.now(),
        timestamp: new Date()
      }]);
    };

    window.addEventListener('app-notification', handleNotification as any);
    
    return () => {
      window.removeEventListener('app-notification', handleNotification as any);
    };
  }, []);

  const dismissNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return { notifications, sendNotification, dismissNotification };
}

// Hook for presence tracking
export function usePresence(userId: string, userName: string) {
  useEffect(() => {
    realtimeService.initialize(userId, userName);

    const handlePageChange = () => {
      realtimeService.updatePresence({
        currentPage: window.location.pathname
      });
    };

    // Track page changes
    window.addEventListener('popstate', handlePageChange);
    handlePageChange(); // Initial page

    // Track visibility changes
    const handleVisibilityChange = () => {
      realtimeService.updatePresence({
        status: document.hidden ? 'away' : 'online'
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('popstate', handlePageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      realtimeService.disconnect();
    };
  }, [userId, userName]);
}

// Hook for analytics
export function useAnalytics() {
  const trackEvent = useCallback(async (eventType: string, properties?: any) => {
    await realtimeService.trackEvent(eventType, properties);
  }, []);

  useEffect(() => {
    // Track page views
    trackEvent('page_view', {
      path: window.location.pathname,
      referrer: document.referrer
    });
  }, [trackEvent]);

  return { trackEvent };
}