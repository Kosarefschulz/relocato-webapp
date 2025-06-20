import { lazy } from 'react';

// Lazy load heavy components
export const EmailClient = lazy(() => import('./EmailClientProfessional'));
export const PhotoGallery = lazy(() => import('./PhotoGallery'));
export const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
export const MigrationTool = lazy(() => import('./MigrationTool'));
export const AdminImport = lazy(() => import('./AdminImport'));
export const QuoteTemplateManager = lazy(() => import('./QuoteTemplateManager'));
export const EmailTemplateManager = lazy(() => import('./EmailTemplateManager'));
export const FollowUpManager = lazy(() => import('./FollowUpManager'));
export const EmailImportMonitor = lazy(() => import('./EmailImportMonitor'));
export const EmailImportSettings = lazy(() => import('./EmailImportSettings'));
export const FailedEmailRecovery = lazy(() => import('./FailedEmailRecovery'));
// export const EmailCompose = lazy(() => import('./EmailCompose'));

// Lazy load pages
export const SalesPage = lazy(() => import('../pages/SalesPage'));
export const DispositionPage = lazy(() => import('../pages/DispositionPage'));
export const SharePage = lazy(() => import('../pages/SharePage'));
export const AdminToolsPage = lazy(() => import('../pages/AdminToolsPage'));