/**
 * Database Configuration
 * This file determines which database service to use throughout the application
 */

// Import both services
import { googleSheetsPublicService } from '../services/googleSheetsPublic';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService.optimized';

/**
 * Set to true to use Firebase as primary database
 * Set to false to use Google Sheets + localStorage
 */
export const USE_FIREBASE_PRIMARY = false;

/**
 * Export the service to use based on configuration
 * All components should import from here instead of importing services directly
 */
export const databaseService = USE_FIREBASE_PRIMARY 
  ? unifiedDatabaseService 
  : googleSheetsPublicService;

/**
 * Export type for the database service
 */
export type DatabaseService = typeof databaseService;