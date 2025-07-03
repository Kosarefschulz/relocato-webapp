import { supabase } from '../config/supabase';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

export interface UserPresence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentPage?: string;
  lastSeen: Date;
  deviceInfo?: any;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface RealtimeEvent {
  type: 'customer_update' | 'quote_update' | 'team_location' | 'notification';
  payload: any;
  userId: string;
  timestamp: Date;
}

class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceCallbacks: Map<string, (state: any) => void> = new Map();
  private eventCallbacks: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private currentUser: UserPresence | null = null;

  // Initialize real-time service
  async initialize(userId: string, userName: string) {
    console.log('🚀 Initializing Realtime Service...');
    
    this.currentUser = {
      userId,
      userName,
      status: 'online',
      lastSeen: new Date()
    };

    // Update presence in database
    await this.updatePresence(this.currentUser);

    // Set up main channels
    this.setupMainChannel();
    this.setupPresenceChannel();
    this.setupNotificationChannel();
    
    // Set up heartbeat
    this.startHeartbeat();
    
    console.log('✅ Realtime Service initialized');
  }

  // Main broadcast channel for app-wide events
  private setupMainChannel() {
    const channel = supabase.channel('main-room', {
      config: {
        broadcast: {
          self: true
        }
      }
    });

    channel
      .on('broadcast', { event: 'app-event' }, (payload) => {
        this.handleAppEvent(payload);
      })
      .subscribe();

    this.channels.set('main', channel);
  }

  // Presence channel for online users
  private setupPresenceChannel() {
    const channel = supabase.channel('presence-room', {
      config: {
        presence: {
          key: this.currentUser?.userId || 'anonymous'
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        this.handlePresenceSync(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && this.currentUser) {
          await channel.track({
            user_id: this.currentUser.userId,
            user_name: this.currentUser.userName,
            online_at: new Date().toISOString(),
            status: this.currentUser.status
          });
        }
      });

    this.channels.set('presence', channel);
  }

  // Notification channel for real-time alerts
  private setupNotificationChannel() {
    const channel = supabase.channel('notifications', {
      config: {
        broadcast: {
          self: false
        }
      }
    });

    channel
      .on('broadcast', { event: 'notification' }, (payload) => {
        this.handleNotification(payload);
      })
      .subscribe();

    this.channels.set('notifications', channel);
  }

  // Update user presence
  async updatePresence(presence: Partial<UserPresence>) {
    if (!this.currentUser) return;

    this.currentUser = { ...this.currentUser, ...presence };
    
    // Note: Supabase Edge Functions for user_presence not implemented yet
    // For now, we'll just log the operation instead of calling the RPC
    console.log('📍 User presence update (RPC disabled):', {
      userId: this.currentUser.userId,
      userName: this.currentUser.userName,
      status: this.currentUser.status,
      currentPage: this.currentUser.currentPage
    });

    // Update in presence channel (this still works)
    const presenceChannel = this.channels.get('presence');
    if (presenceChannel) {
      await presenceChannel.track({
        ...this.currentUser,
        online_at: new Date().toISOString()
      });
    }
  }

  // Subscribe to customer updates
  subscribeToCustomerUpdates(customerId: string, callback: (data: any) => void) {
    const channel = supabase
      .channel(`customer-${customerId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'customers',
          filter: `id=eq.${customerId}`
        },
        (payload) => {
          callback(payload);
          this.broadcastEvent({
            type: 'customer_update',
            payload,
            userId: this.currentUser?.userId || 'system',
            timestamp: new Date()
          });
        }
      )
      .subscribe();

    this.channels.set(`customer-${customerId}`, channel);
    
    return () => {
      channel.unsubscribe();
      this.channels.delete(`customer-${customerId}`);
    };
  }

  // Subscribe to quote updates
  subscribeToQuoteUpdates(quoteId: string, callback: (data: any) => void) {
    const channel = supabase
      .channel(`quote-${quoteId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `id=eq.${quoteId}`
        },
        (payload) => {
          callback(payload);
          this.broadcastEvent({
            type: 'quote_update',
            payload,
            userId: this.currentUser?.userId || 'system',
            timestamp: new Date()
          });
        }
      )
      .subscribe();

    this.channels.set(`quote-${quoteId}`, channel);
    
    return () => {
      channel.unsubscribe();
      this.channels.delete(`quote-${quoteId}`);
    };
  }

  // Subscribe to team location updates
  subscribeToTeamLocations(callback: (locations: any[]) => void) {
    const channel = supabase.channel('team-locations', {
      config: {
        broadcast: {
          ack: true
        }
      }
    });

    channel
      .on('broadcast', { event: 'location-update' }, (payload) => {
        callback(payload.payload);
      })
      .subscribe();

    this.channels.set('team-locations', channel);
    
    return () => {
      channel.unsubscribe();
      this.channels.delete('team-locations');
    };
  }

  // Broadcast team location
  async broadcastTeamLocation(teamId: string, location: { lat: number; lng: number }) {
    const channel = this.channels.get('team-locations');
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'location-update',
        payload: {
          teamId,
          location,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Broadcast app event
  async broadcastEvent(event: RealtimeEvent) {
    const channel = this.channels.get('main');
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'app-event',
        payload: event
      });
    }

    // Call registered callbacks
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }

  // Send notification
  async sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
  }) {
    const channel = this.channels.get('notifications');
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          userId,
          notification,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Subscribe to events
  onEvent(eventType: string, callback: (event: RealtimeEvent) => void) {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    this.eventCallbacks.get(eventType)!.add(callback);
    
    return () => {
      this.eventCallbacks.get(eventType)?.delete(callback);
    };
  }

  // Subscribe to presence updates
  onPresenceUpdate(callback: (users: UserPresence[]) => void) {
    const key = `presence-${Date.now()}`;
    this.presenceCallbacks.set(key, callback);
    
    return () => {
      this.presenceCallbacks.delete(key);
    };
  }

  // Get online users
  async getOnlineUsers(): Promise<UserPresence[]> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
        .order('last_seen', { ascending: false });

      if (error) {
        console.log('⚠️ user_presence table not found, using presence channel data instead');
        return this.getUsersFromPresenceChannel();
      }

      return data.map(user => ({
        userId: user.user_id || 'unknown',
        userName: user.user_name || 'Unbekannter Nutzer',
        status: user.status as any || 'offline',
        currentPage: user.current_page,
        lastSeen: new Date(user.last_seen),
        deviceInfo: user.device_info,
        location: user.location
      }));
    } catch (error) {
      console.log('⚠️ Error accessing user_presence table, using fallback');
      return this.getUsersFromPresenceChannel();
    }
  }

  // Fallback method to get users from presence channel
  private getUsersFromPresenceChannel(): UserPresence[] {
    const presenceChannel = this.channels.get('presence');
    if (!presenceChannel) return [];

    const state = presenceChannel.presenceState();
    const users: UserPresence[] = [];
    
    Object.entries(state).forEach(([key, presences]) => {
      presences.forEach((presence: any) => {
        users.push({
          userId: presence.user_id || 'unknown',
          userName: presence.user_name || 'Unbekannter Nutzer',
          status: presence.status || 'online',
          lastSeen: new Date(presence.online_at || Date.now())
        });
      });
    });

    return users;
  }

  // Handle app events
  private handleAppEvent(payload: any) {
    const event = payload.payload as RealtimeEvent;
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }

  // Handle presence sync
  private handlePresenceSync(state: RealtimePresenceState<any>) {
    const users: UserPresence[] = [];
    
    Object.entries(state).forEach(([key, presences]) => {
      presences.forEach((presence: any) => {
        users.push({
          userId: presence.user_id || 'unknown',
          userName: presence.user_name || 'Unbekannter Nutzer',
          status: presence.status || 'online',
          lastSeen: new Date(presence.online_at)
        });
      });
    });

    this.presenceCallbacks.forEach(callback => callback(users));
  }

  // Handle notifications
  private handleNotification(payload: any) {
    const { userId, notification } = payload.payload;
    
    // Only show if it's for current user or broadcast
    if (!userId || userId === this.currentUser?.userId || userId === 'all') {
      // You can integrate with your notification system here
      console.log('📬 New notification:', notification);
      
      // Emit custom event
      window.dispatchEvent(new CustomEvent('app-notification', { 
        detail: notification 
      }));
    }
  }

  // Heartbeat to keep presence alive
  private startHeartbeat() {
    setInterval(async () => {
      if (this.currentUser) {
        await this.updatePresence({ lastSeen: new Date() });
      }
    }, 30000); // Every 30 seconds
  }

  // Track analytics event
  async trackEvent(eventType: string, properties?: any) {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      user_id: this.currentUser?.userId,
      properties,
      session_id: this.getSessionId()
    });
  }

  // Get or create session ID
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  // Cleanup
  disconnect() {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.presenceCallbacks.clear();
    this.eventCallbacks.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();