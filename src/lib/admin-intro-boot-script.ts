import { ADMIN_INTRO_STORAGE_KEY } from '@/lib/admin-intro';
import { ADMIN_INTRO_IMAGE, ADMIN_PWA_SPLASH_BG, ADMIN_PWA_THEME } from '@/lib/admin-pwa-brand';
import { getRegistryStrings } from '@/lib/i18n/strings-registry';
import type { Locale } from '@/lib/i18n/locale';

/** Yönetici rotaları — JS yüklenmeden önce ilk kare (TWA ilk kurulum) */
export const ADMIN_ROUTE_HEADER = 'x-cl-admin-route';

export const ADMIN_CRITICAL_CSS = `@media (max-width:639px){html,body{background-color:${ADMIN_PWA_SPLASH_BG}!important;color-scheme:dark}}`;

export function getAdminIntroBootScript(locale: Locale = 'tr'): string {
  const bg = ADMIN_PWA_SPLASH_BG;
  const img = ADMIN_INTRO_IMAGE;
  const key = ADMIN_INTRO_STORAGE_KEY;
  const bootMessage = JSON.stringify(
    getRegistryStrings('lib/admin-intro-boot-script', locale).bootMessage
  );
  return `(function(){try{var p=location.pathname;if(p.indexOf('/admin-panel')!==0)return;if(p==='/admin-panel/login'||p==='/admin-panel/register')return;var bg='${bg}';document.documentElement.style.backgroundColor=bg;document.documentElement.style.colorScheme='dark';function paintBody(){if(!document.body)return;document.body.style.backgroundColor=bg;}paintBody();if(!document.body){document.addEventListener('DOMContentLoaded',paintBody,{once:true});}if(sessionStorage.getItem('${key}')==='1')return;if(!window.matchMedia('(max-width:639px)').matches)return;if(document.getElementById('cl-admin-intro-boot'))return;var boot=document.createElement('div');boot.id='cl-admin-intro-boot';boot.setAttribute('aria-busy','true');boot.style.cssText='position:fixed;inset:0;z-index:9998;background-color:'+bg+';background-image:url(${img});background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 1.5rem max(1.75rem,env(safe-area-inset-bottom));pointer-events:none';boot.innerHTML='<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(15,23,42,.65) 0%,transparent 45%)"></div><p style="position:relative;z-index:1;margin:0 0 1rem;font:500 15px system-ui,sans-serif;color:rgba(255,255,255,.9);letter-spacing:.02em">'+${bootMessage}+'</p><div style="position:relative;z-index:1;width:min(72vw,220px);height:4px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:.5rem"><div style="width:38%;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(99,102,241,.2),#6366f1,rgba(99,102,241,.2))"></div></div>';function mount(){if(!document.body)return;document.body.appendChild(boot);}mount();if(!document.body){document.addEventListener('DOMContentLoaded',mount,{once:true});}}catch(e){}})();`;
}

export const ADMIN_MOBILE_THEME_COLOR = ADMIN_PWA_THEME;
