import { healthCheckService } from '../services/healthCheckService';

// Auto-start health monitoring when app loads
export const startHealthMonitoring = () => {
  // Check if monitoring should be enabled
  const monitoringEnabled = localStorage.getItem('healthMonitoringEnabled');
  const monitoringInterval = parseInt(localStorage.getItem('healthMonitoringInterval') || '5');
  
  if (monitoringEnabled === 'true') {
    console.log('🏥 Auto-starting health monitoring...');
    healthCheckService.startMonitoring(monitoringInterval);
  }
};

// Utility to enable/disable monitoring
export const setHealthMonitoring = (enabled: boolean, intervalMinutes: number = 5) => {
  localStorage.setItem('healthMonitoringEnabled', enabled.toString());
  localStorage.setItem('healthMonitoringInterval', intervalMinutes.toString());
  
  if (enabled) {
    healthCheckService.startMonitoring(intervalMinutes);
  } else {
    healthCheckService.stopMonitoring();
  }
};