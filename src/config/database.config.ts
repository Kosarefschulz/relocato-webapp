/**
 * Database Configuration
 * This file determines which database service to use throughout the application
 */

// Import the database abstraction layer
import { databaseAbstraction } from '../services/databaseAbstraction';

// Legacy imports for backward compatibility
import { googleSheetsPublicService } from '../services/googleSheetsPublic';
import { unifiedDatabaseService } from '../services/unifiedDatabaseService';

/**
 * Database provider configuration
 * Only 'supabase' or 'sheets' are supported
 * Firebase is no longer supported
 */
export const DATABASE_PROVIDER = process.env.REACT_APP_DATABASE_PROVIDER || 'supabase';

/**
 * Legacy configuration for backward compatibility
 * Always false since Firebase is no longer supported
 */
export const USE_FIREBASE_PRIMARY = false;

/**
 * Export the service to use based on configuration
 * All components should import from here instead of importing services directly
 */
export const databaseService = databaseAbstraction;

// Legacy export for backward compatibility
export const legacyDatabaseService = USE_FIREBASE_PRIMARY 
  ? unifiedDatabaseService 
  : googleSheetsPublicService;

/**
 * Export type for the database service
 */
export type DatabaseService = typeof databaseService;