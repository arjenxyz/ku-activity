#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HUB = {
  tr: { menuAriaLabel: 'Menü', close: 'Kapat', brand: 'CREWLEDGER', title: 'Tüm bölümler' },
  en: { menuAriaLabel: 'Menu', close: 'Close', brand: 'CREWLEDGER', title: 'All sections' },
  zh: { menuAriaLabel: '菜单', close: '关闭', brand: 'CREWLEDGER', title: '全部栏目' },
  hi: { menuAriaLabel: 'मेनू', close: 'बंद करें', brand: 'CREWLEDGER', title: 'सभी अनुभाग' },
  es: { menuAriaLabel: 'Menú', close: 'Cerrar', brand: 'CREWLEDGER', title: 'Todas las secciones' },
  fr: { menuAriaLabel: 'Menu', close: 'Fermer', brand: 'CREWLEDGER', title: 'Toutes les sections' },
  ar: { menuAriaLabel: 'القائمة', close: 'إغلاق', brand: 'CREWLEDGER', title: 'كل الأقسام' },
  bn: { menuAriaLabel: 'মেনু', close: 'বন্ধ', brand: 'CREWLEDGER', title: 'সব বিভাগ' },
  pt: { menuAriaLabel: 'Menu', close: 'Fechar', brand: 'CREWLEDGER', title: 'Todas as seções' },
  ru: { menuAriaLabel: 'Меню', close: 'Закрыть', brand: 'CREWLEDGER', title: 'Все разделы' },
  ur: { menuAriaLabel: 'مینو', close: 'بند کریں', brand: 'CREWLEDGER', title: 'تمام حصے' },
  id: { menuAriaLabel: 'Menu', close: 'Tutup', brand: 'CREWLEDGER', title: 'Semua bagian' },
  de: { menuAriaLabel: 'Menü', close: 'Schließen', brand: 'CREWLEDGER', title: 'Alle Bereiche' },
  ja: { menuAriaLabel: 'メニュー', close: '閉じる', brand: 'CREWLEDGER', title: 'すべての項目' },
  hu: { menuAriaLabel: 'Menü', close: 'Bezárás', brand: 'CREWLEDGER', title: 'Összes részleg' },
};

/** Fix obvious bad hub labels (phonetic / wrong Google Translate). */
const SETTINGS_LABEL = {
  tr: { label: 'Ayarlar', description: 'PIN ve profil' },
  en: { label: 'Settings', description: 'PIN and profile' },
  zh: { label: '设置', description: 'PIN 与个人资料' },
  hi: { label: 'सेटिंग्स', description: 'PIN और प्रोफ़ाइल' },
  es: { label: 'Ajustes', description: 'PIN y perfil' },
  fr: { label: 'Paramètres', description: 'PIN et profil' },
  ar: { label: 'الإعدادات', description: 'رمز PIN والملف الشخصي' },
  bn: { label: 'সেটিংস', description: 'PIN ও প্রোফাইল' },
  pt: { label: 'Configurações', description: 'PIN e perfil' },
  ru: { label: 'Настройки', description: 'PIN и профиль' },
  ur: { label: 'ترتیبات', description: 'PIN اور پروفائل' },
  id: { label: 'Pengaturan', description: 'PIN dan profil' },
  de: { label: 'Einstellungen', description: 'PIN und Profil' },
  ja: { label: '設定', description: 'PINとプロフィール' },
  hu: { label: 'Beállítások', description: 'PIN-kód és profil' },
};

function writeJson(p, data) {
  const payload = JSON.stringify(data, null, 2) + '\n';
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      fs.writeFileSync(p, payload);
      return;
    } catch (err) {
      if (attempt >= 10) throw err;
      const start = Date.now();
      while (Date.now() - start < 300 * attempt) {}
    }
  }
}

for (const [loc, strings] of Object.entries(HUB)) {
  const hubPath =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/components/personnel/PersonnelNavHub.json')
      : path.join(ROOT, `json/${loc}/src/components/personnel/PersonnelNavHub.json`);
  writeJson(hubPath, strings);

  const navPath =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/config/personnel-mobile-nav.json')
      : path.join(ROOT, `json/${loc}/src/config/personnel-mobile-nav.json`);
  const nav = JSON.parse(fs.readFileSync(navPath, 'utf8').replace(/^\uFEFF/, ''));
  const fix = SETTINGS_LABEL[loc];
  for (const section of nav.hubSections ?? []) {
    for (const item of section.items ?? []) {
      if (item.id === 'settings') {
        item.label = fix.label;
        item.description = fix.description;
      }
    }
  }
  if (nav.tabTitles) nav.tabTitles.settings = fix.label;
  writeJson(navPath, nav);
  console.log('ok', loc);
}
