/** Google Play mağaza bağlantıları — yayınlandıktan sonra .env ile doldurun */

import { ADMIN_APP_ICON, PERSONNEL_APP_ICON } from '@/lib/brand';

export const PLAY_STORE_PERSONNEL_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_PERSONNEL_URL?.trim() || '';

export const PLAY_STORE_ADMIN_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_ADMIN_URL?.trim() || '';

export const PLAY_STORE_PERSONNEL_ICON = PERSONNEL_APP_ICON;

export const PLAY_STORE_ADMIN_ICON = ADMIN_APP_ICON;

export const PLAY_STORE_BADGE_TR =
  'https://play.google.com/intl/tr_tr/badges/static/images/badges/tr_badge_web_generic.png';

/** Footer vb. — Google Play sm rozeti render boyutu */
export const STORE_BADGE_SM_WIDTH = 114;
export const STORE_BADGE_SM_HEIGHT = 44;
export const STORE_BADGE_SM_CLASS = 'block h-[44px] w-[114px] shrink-0 object-contain';
export const STORE_BADGE_SM_LINK_CLASS =
  'inline-flex h-[44px] w-[114px] shrink-0 items-center overflow-hidden leading-none transition-transform hover:scale-[1.03] active:scale-[0.98] drop-shadow-lg';
