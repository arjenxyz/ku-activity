export type GuideStageId =
  | 'welcome'
  | 'menu'
  | 'events'
  | 'event-nav'
  | 'workspace'
  | 'participants'
  | 'reviews'
  | 'cash'
  | 'custody'
  | 'checkin'
  | 'reports'
  | 'edit'
  | 'team'
  | 'audit'
  | 'settings'
  | 'done';

export type GuideNavMode = 'root' | 'event';

export type GuideHighlight =
  | 'nav-home'
  | 'nav-events'
  | 'nav-team'
  | 'nav-guide'
  | 'nav-audit'
  | 'nav-settings'
  | 'nav-workspace'
  | 'nav-participants'
  | 'nav-reviews'
  | 'nav-cash'
  | 'nav-custody'
  | 'nav-checkin'
  | 'nav-reports'
  | 'nav-edit'
  | 'event-card'
  | 'event-edit-btn'
  | 'event-details'
  | 'workspace-hub'
  | 'participant-row'
  | 'review-approve'
  | 'cash-qr'
  | 'custody-row'
  | 'checkin-scan'
  | 'report-stat'
  | 'edit-title'
  | 'edit-dates'
  | 'team-opening'
  | 'team-applicant'
  | 'audit-row'
  | 'settings-pref'
  | 'settings-logout';

export type GuideStep = {
  id: string;
  chapter: string;
  botText: string;
  stage: GuideStageId;
  navMode?: GuideNavMode;
  highlight?: GuideHighlight;
  /** Show a brief ripple / press on the highlighted control */
  pulse?: boolean;
};

export const GUIDE_STORAGE_KEY = 'admin-live-guide-done';
