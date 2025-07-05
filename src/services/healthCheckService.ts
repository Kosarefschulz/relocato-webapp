import { supabase } from '../config/supabase';

export interface HealthCheckResult {
  service: string;
  status: 'online' | 'offline' | 'error';
  message: string;
  timestamp: Date;
  responseTime?: number;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'offline';
  lastCheck: Date;
  services: HealthCheckResult[];
  uptime: number;
}

class HealthCheckService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastResults: HealthCheckResult[] = [];
  private startTime = new Date();
  private callbacks: ((health: SystemHealth) => void)[] = [];

  // Startet automatische Überwachung
  startMonitoring(intervalMinutes: number = 5) {
    console.log(`🏥 Starting health monitoring (every ${intervalMinutes} minutes)`);
    
    // Initial check
    this.runHealthChecks();
    
    // Set up interval
    this.checkInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMinutes * 60 * 1000);
  }

  // Stoppt die Überwachung
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🏥 Health monitoring stopped');
    }
  }

  // Registriert einen Callback für Health Updates
  onHealthUpdate(callback: (health: SystemHealth) => void) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Führt alle Health Checks durch
  async runHealthChecks(): Promise<SystemHealth> {
    console.log('🏥 Running health checks...');
    const results: HealthCheckResult[] = [];

    // 1. Supabase Datenbank Check
    results.push(await this.checkSupabaseDatabase());

    // 2. Supabase Auth Check
    results.push(await this.checkSupabaseAuth());

    // 3. Email Service Check
    results.push(await this.checkEmailService());

    // 4. Storage Check
    results.push(await this.checkStorage());

    // 5. Edge Functions Check
    results.push(await this.checkEdgeFunctions());

    // 6. Realtime Check
    results.push(await this.checkRealtime());

    this.lastResults = results;
    
    const health = this.getSystemHealth();
    
    // Notify callbacks
    this.callbacks.forEach(cb => cb(health));
    
    // Log to console
    this.logHealthStatus(health);
    
    // Store in database for history
    await this.storeHealthCheck(health);
    
    return health;
  }

  // Einzelne Service Checks
  private async checkSupabaseDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      
      return {
        service: 'Supabase Database',
        status: 'online',
        message: 'Database is responsive',
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        service: 'Supabase Database',
        status: 'error',
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkSupabaseAuth(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      return {
        service: 'Supabase Auth',
        status: 'online',
        message: session ? 'Authenticated' : 'Anonymous',
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        service: 'Supabase Auth',
        status: 'error',
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkEmailService(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Test email list function
      const { data, error } = await supabase.functions.invoke('email-list', {
        body: { folder: 'INBOX', limit: 1 }
      });
      
      if (error) throw error;
      
      return {
        service: 'Email Service (IONOS)',
        status: data.success ? 'online' : 'error',
        message: data.success ? `${data.total || 0} emails in inbox` : 'Email service degraded',
        timestamp: new Date(),
        responseTime: Date.now() - start,
        details: {
          total: data.total,
          hasError: !!data.error
        }
      };
    } catch (error: any) {
      return {
        service: 'Email Service (IONOS)',
        status: 'offline',
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkStorage(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const { data, error } = await supabase.storage
        .from('customer-photos')
        .list('', { limit: 1 });
      
      if (error) throw error;
      
      return {
        service: 'Supabase Storage',
        status: 'online',
        message: 'Storage is accessible',
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        service: 'Supabase Storage',
        status: 'error',
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkEdgeFunctions(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Test a simple edge function
      const { data, error } = await supabase.functions.invoke('email-folders', {
        body: {}
      });
      
      if (error) throw error;
      
      return {
        service: 'Edge Functions',
        status: 'online',
        message: 'Edge functions are responsive',
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        service: 'Edge Functions',
        status: 'error',
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  private async checkRealtime(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Create a test channel
      const channel = supabase.channel('health-check-' + Date.now());
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          channel.unsubscribe();
          reject(new Error('Realtime connection timeout'));
        }, 5000);
        
        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.track({ online: true });
            }
          });
      });
      
      return {
        service: 'Realtime',
        status: 'online',
        message: 'Realtime connections working',
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        service: 'Realtime',
        status: 'error',
        message: error.message,
        timestamp: new Date(),
        responseTime: Date.now() - start,
      };
    }
  }

  // System Health berechnen
  private getSystemHealth(): SystemHealth {
    const now = new Date();
    const uptime = (now.getTime() - this.startTime.getTime()) / 1000 / 60; // in minutes
    
    const offlineCount = this.lastResults.filter(r => r.status === 'offline').length;
    const errorCount = this.lastResults.filter(r => r.status === 'error').length;
    
    let overall: 'healthy' | 'degraded' | 'offline' = 'healthy';
    if (offlineCount > 0) overall = 'offline';
    else if (errorCount > 0) overall = 'degraded';
    
    return {
      overall,
      lastCheck: now,
      services: this.lastResults,
      uptime: Math.round(uptime)
    };
  }

  // Health Status im Log ausgeben
  private logHealthStatus(health: SystemHealth) {
    const emoji = health.overall === 'healthy' ? '✅' : health.overall === 'degraded' ? '⚠️' : '❌';
    console.log(`${emoji} System Health: ${health.overall.toUpperCase()}`);
    
    health.services.forEach(service => {
      const statusEmoji = service.status === 'online' ? '🟢' : service.status === 'error' ? '🟡' : '🔴';
      console.log(`  ${statusEmoji} ${service.service}: ${service.message} (${service.responseTime}ms)`);
    });
  }

  // Health Check in Datenbank speichern
  private async storeHealthCheck(health: SystemHealth) {
    try {
      await supabase
        .from('health_checks')
        .insert({
          overall_status: health.overall,
          services: health.services,
          uptime_minutes: health.uptime,
          checked_at: health.lastCheck.toISOString()
        });
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  // Manuelle Checks
  async checkService(serviceName: string): Promise<HealthCheckResult> {
    switch (serviceName) {
      case 'database':
        return this.checkSupabaseDatabase();
      case 'auth':
        return this.checkSupabaseAuth();
      case 'email':
        return this.checkEmailService();
      case 'storage':
        return this.checkStorage();
      case 'edge-functions':
        return this.checkEdgeFunctions();
      case 'realtime':
        return this.checkRealtime();
      default:
        return {
          service: serviceName,
          status: 'error',
          message: 'Unknown service',
          timestamp: new Date()
        };
    }
  }

  // Get last results
  getLastResults(): SystemHealth | null {
    if (this.lastResults.length === 0) return null;
    return this.getSystemHealth();
  }

  // Check if monitoring is active
  isMonitoring(): boolean {
    return this.checkInterval !== null;
  }
}

export const healthCheckService = new HealthCheckService();