import strings from '@json/src/config/admin-register.json';

export const ADMIN_JOB_TITLES = strings.jobTitles as readonly string[];

export const ADMIN_TEAM_SIZES = strings.teamSizes as readonly {
  value: string;
  label: string;
}[];

export const ADMIN_PROJECT_COUNTS = strings.projectCounts as readonly {
  value: string;
  label: string;
}[];

export const ADMIN_REFERRAL_SOURCES = strings.referralSources as readonly {
  value: string;
  label: string;
}[];
