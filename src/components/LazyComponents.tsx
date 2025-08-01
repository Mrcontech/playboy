import { lazy } from 'react';

// Lazy load heavy components
export const HubScreen = lazy(() => import('./HubScreen'));
export const RosterScreen = lazy(() => import('./RosterScreen'));
export const PlaybookScreen = lazy(() => import('./PlaybookScreen'));
export const SettingsScreen = lazy(() => import('./SettingsScreen'));
export const PlayerProfile = lazy(() => import('./PlayerProfile'));

// Lazy load modals
export const AddPlayerModal = lazy(() => import('./AddPlayerModal'));
export const AddMeetingModal = lazy(() => import('./AddMeetingModal'));
export const AddExpenseModal = lazy(() => import('./AddExpenseModal'));
export const EditPlayerModal = lazy(() => import('./EditPlayerModal'));
export const AIRecapModal = lazy(() => import('./AIRecapModal'));
export const ChatAnalysisModal = lazy(() => import('./ChatAnalysisModal'));
export const AddDateModal = lazy(() => import('./AddDateModal'));
export const UpcomingDateModal = lazy(() => import('./UpcomingDateModal'));