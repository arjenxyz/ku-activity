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
