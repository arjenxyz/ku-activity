import { PERSONNEL_INTRO_STORAGE_KEY } from '@/lib/personnel-intro';
import {
  PERSONNEL_INTRO_IMAGE,
  PERSONNEL_PWA_SPLASH_BG,
  PERSONNEL_PWA_THEME,
} from '@/lib/personnel-pwa-brand';
import strings from '@json/src/lib/personnel-intro-boot-script.json';

/** Personel rotaları — JS yüklenmeden önce ilk kare (TWA ilk kurulum) */
export const PERSONNEL_ROUTE_HEADER = 'x-cl-personnel-route';

export const PERSONNEL_CRITICAL_CSS = `@media (max-width:639px){html,body{background-color:${PERSONNEL_PWA_SPLASH_BG}!important;color-scheme:dark}}`;

/** beforeInteractive: root layout'tan en erken çalışır */
export function getPersonnelIntroBootScript(): string {
  const bg = PERSONNEL_PWA_SPLASH_BG;
  const img = PERSONNEL_INTRO_IMAGE;
  const key = PERSONNEL_INTRO_STORAGE_KEY;
  const bootMessage = strings.bootMessage;
  return `(function(){try{var p=location.pathname;if(p.indexOf('/personnel-panel')!==0)return;var bg='${bg}';document.documentElement.style.backgroundColor=bg;document.documentElement.style.colorScheme='dark';function paintBody(){if(!document.body)return;document.body.style.backgroundColor=bg;}paintBody();if(!document.body){document.addEventListener('DOMContentLoaded',paintBody,{once:true});}if(p.indexOf('/personnel-panel/basvuru')===0)return;if(sessionStorage.getItem('${key}')==='1')return;if(!window.matchMedia('(max-width:639px)').matches)return;if(document.getElementById('cl-intro-boot'))return;var boot=document.createElement('div');boot.id='cl-intro-boot';boot.setAttribute('aria-busy','true');boot.style.cssText='position:fixed;inset:0;z-index:9998;background-color:'+bg+';background-image:url(${img});background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 1.5rem max(1.75rem,env(safe-area-inset-bottom));pointer-events:none';boot.innerHTML='<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(6,13,20,.55) 0%,transparent 45%)"></div><p style="position:relative;z-index:1;margin:0 0 1rem;font:500 15px system-ui,sans-serif;color:rgba(255,255,255,.9);letter-spacing:.02em">${bootMessage}</p><div style="position:relative;z-index:1;width:min(72vw,220px);height:4px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:.5rem"><div style="width:38%;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(56,189,248,.2),#38bdf8,rgba(56,189,248,.2))"></div></div>';function mount(){if(!document.body)return;document.body.appendChild(boot);}mount();if(!document.body){document.addEventListener('DOMContentLoaded',mount,{once:true});}}catch(e){}})();`;
}

export const PERSONNEL_MOBILE_THEME_COLOR = PERSONNEL_PWA_THEME;
