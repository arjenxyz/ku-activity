/** Google Play mağaza bağlantıları — yayınlandıktan sonra .env ile doldurun */

export const PLAY_STORE_PERSONNEL_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_PERSONNEL_URL?.trim() || '';

export const PLAY_STORE_ADMIN_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_ADMIN_URL?.trim() || '';

export const PLAY_STORE_BADGE_TR =
  'https://play.google.com/intl/tr_tr/badges/static/images/badges/tr_badge_web_generic.png';
