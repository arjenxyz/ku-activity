#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PERSONNEL = {
  tr: { bootMessage: 'Uygulama hazırlanıyor…', loadingText: 'Uygulama hazırlanıyor…', ariaLabel: 'Uygulama hazırlanıyor' },
  en: { bootMessage: 'Preparing the app…', loadingText: 'Preparing the app…', ariaLabel: 'Preparing the app' },
  zh: { bootMessage: '应用准备中…', loadingText: '应用准备中…', ariaLabel: '应用准备中' },
  hi: { bootMessage: 'ऐप तैयार हो रहा है…', loadingText: 'ऐप तैयार हो रहा है…', ariaLabel: 'ऐप तैयार हो रहा है' },
  es: { bootMessage: 'Preparando la aplicación…', loadingText: 'Preparando la aplicación…', ariaLabel: 'Preparando la aplicación' },
  fr: { bootMessage: "Préparation de l'application…", loadingText: "Préparation de l'application…", ariaLabel: "Préparation de l'application" },
  ar: { bootMessage: 'جاري تحضير التطبيق…', loadingText: 'جاري تحضير التطبيق…', ariaLabel: 'جاري تحضير التطبيق' },
  bn: { bootMessage: 'অ্যাপ প্রস্তুত হচ্ছে…', loadingText: 'অ্যাপ প্রস্তুত হচ্ছে…', ariaLabel: 'অ্যাপ প্রস্তুত হচ্ছে' },
  pt: { bootMessage: 'Preparando o aplicativo…', loadingText: 'Preparando o aplicativo…', ariaLabel: 'Preparando o aplicativo' },
  ru: { bootMessage: 'Приложение готовится…', loadingText: 'Приложение готовится…', ariaLabel: 'Приложение готовится' },
  ur: { bootMessage: 'ایپ تیار ہو رہی ہے…', loadingText: 'ایپ تیار ہو رہی ہے…', ariaLabel: 'ایپ تیار ہو رہی ہے' },
  id: { bootMessage: 'Aplikasi sedang disiapkan…', loadingText: 'Aplikasi sedang disiapkan…', ariaLabel: 'Aplikasi sedang disiapkan' },
  de: { bootMessage: 'App wird vorbereitet…', loadingText: 'App wird vorbereitet…', ariaLabel: 'App wird vorbereitet' },
  ja: { bootMessage: 'アプリを準備しています…', loadingText: 'アプリを準備しています…', ariaLabel: 'アプリを準備しています' },
  hu: { bootMessage: 'Az alkalmazás előkészítése…', loadingText: 'Az alkalmazás előkészítése…', ariaLabel: 'Az alkalmazás előkészítése' },
};

const ADMIN = {
  tr: { bootMessage: 'Yönetici uygulaması hazırlanıyor…', loadingText: 'Yönetici uygulaması hazırlanıyor…', ariaLabel: 'Yönetici uygulaması hazırlanıyor' },
  en: { bootMessage: 'Preparing the admin app…', loadingText: 'Preparing the admin app…', ariaLabel: 'Preparing the admin app' },
  zh: { bootMessage: '管理应用准备中…', loadingText: '管理应用准备中…', ariaLabel: '管理应用准备中' },
  hi: { bootMessage: 'एडमिन ऐप तैयार हो रहा है…', loadingText: 'एडमिन ऐप तैयार हो रहा है…', ariaLabel: 'एडमिन ऐप तैयार हो रहा है' },
  es: { bootMessage: 'Preparando la app de administración…', loadingText: 'Preparando la app de administración…', ariaLabel: 'Preparando la app de administración' },
  fr: { bootMessage: "Préparation de l'application admin…", loadingText: "Préparation de l'application admin…", ariaLabel: "Préparation de l'application admin" },
  ar: { bootMessage: 'جاري تحضير تطبيق الإدارة…', loadingText: 'جاري تحضير تطبيق الإدارة…', ariaLabel: 'جاري تحضير تطبيق الإدارة' },
  bn: { bootMessage: 'অ্যাডমিন অ্যাপ প্রস্তুত হচ্ছে…', loadingText: 'অ্যাডমিন অ্যাপ প্রস্তুত হচ্ছে…', ariaLabel: 'অ্যাডমিন অ্যাপ প্রস্তুত হচ্ছে' },
  pt: { bootMessage: 'Preparando o app admin…', loadingText: 'Preparando o app admin…', ariaLabel: 'Preparando o app admin' },
  ru: { bootMessage: 'Подготовка приложения администратора…', loadingText: 'Подготовка приложения администратора…', ariaLabel: 'Подготовка приложения администратора' },
  ur: { bootMessage: 'ایڈمن ایپ تیار ہو رہی ہے…', loadingText: 'ایڈمن ایپ تیار ہو رہی ہے…', ariaLabel: 'ایڈمن ایپ تیار ہو رہی ہے' },
  id: { bootMessage: 'Aplikasi admin sedang disiapkan…', loadingText: 'Aplikasi admin sedang disiapkan…', ariaLabel: 'Aplikasi admin sedang disiapkan' },
  de: { bootMessage: 'Admin-App wird vorbereitet…', loadingText: 'Admin-App wird vorbereitet…', ariaLabel: 'Admin-App wird vorbereitet' },
  ja: { bootMessage: '管理アプリを準備しています…', loadingText: '管理アプリを準備しています…', ariaLabel: '管理アプリを準備しています' },
  hu: { bootMessage: 'Az admin alkalmazás előkészítése…', loadingText: 'Az admin alkalmazás előkészítése…', ariaLabel: 'Az admin alkalmazás előkészítése' },
};

function writeJson(rel, data) {
  const dir = path.dirname(rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(rel, JSON.stringify(data, null, 2) + '\n');
}

for (const [loc, p] of Object.entries(PERSONNEL)) {
  const base = loc === 'tr' ? path.join(ROOT, 'json', 'src') : path.join(ROOT, 'json', loc, 'src');
  writeJson(path.join(base, 'lib/personnel-intro-boot-script.json'), { bootMessage: p.bootMessage });
  writeJson(path.join(base, 'components/personnel/PersonnelAppIntro.json'), {
    loadingText: p.loadingText,
    ariaLabel: p.ariaLabel,
  });
}

for (const [loc, a] of Object.entries(ADMIN)) {
  const base = loc === 'tr' ? path.join(ROOT, 'json', 'src') : path.join(ROOT, 'json', loc, 'src');
  writeJson(path.join(base, 'lib/admin-intro-boot-script.json'), { bootMessage: a.bootMessage });
  writeJson(path.join(base, 'components/admin/AdminAppIntro.json'), {
    loadingText: a.loadingText,
    ariaLabel: a.ariaLabel,
  });
}

console.log('boot/intro strings updated for all locales');
