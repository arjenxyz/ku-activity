#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOCALES = {
  tr: {
    contracts: { title: 'Sözleşmeler', subtitleMenu: 'Onayladığınız sözleşmeler', subtitleSection: 'Onayladığınız sözleşme kayıtları.' },
    security: { title: 'Güvenlik', subtitleMenu: 'PIN kodu, aktif cihazlar ve hesap güvenliği', subtitleSection: 'PIN, aktif cihazlar ve hesap güvenliği.' },
  },
  en: {
    contracts: { title: 'Contracts', subtitleMenu: 'Agreements you have accepted', subtitleSection: 'Records of agreements you have accepted.' },
    security: { title: 'Security', subtitleMenu: 'PIN, active devices, and account security', subtitleSection: 'PIN, active devices, and account security.' },
  },
  zh: {
    contracts: { title: '合同', subtitleMenu: '您已接受的协议', subtitleSection: '您已接受的协议记录。' },
    security: { title: '安全', subtitleMenu: 'PIN、活跃设备与账户安全', subtitleSection: 'PIN、活跃设备与账户安全。' },
  },
  hi: {
    contracts: { title: 'अनुबंध', subtitleMenu: 'आपके स्वीकृत समझौते', subtitleSection: 'आपके स्वीकृत समझौतों के रिकॉर्ड।' },
    security: { title: 'सुरक्षा', subtitleMenu: 'पिन, सक्रिय डिवाइस और खाता सुरक्षा', subtitleSection: 'पिन, सक्रिय डिवाइस और खाता सुरक्षा।' },
  },
  es: {
    contracts: { title: 'Contratos', subtitleMenu: 'Acuerdos que ha aceptado', subtitleSection: 'Registros de los acuerdos que ha aceptado.' },
    security: { title: 'Seguridad', subtitleMenu: 'PIN, dispositivos activos y seguridad de la cuenta', subtitleSection: 'PIN, dispositivos activos y seguridad de la cuenta.' },
  },
  fr: {
    contracts: { title: 'Contrats', subtitleMenu: 'Accords que vous avez acceptés', subtitleSection: 'Registres des accords que vous avez acceptés.' },
    security: { title: 'Sécurité', subtitleMenu: 'PIN, appareils actifs et sécurité du compte', subtitleSection: 'PIN, appareils actifs et sécurité du compte.' },
  },
  ar: {
    contracts: { title: 'العقود', subtitleMenu: 'الاتفاقيات التي وافقت عليها', subtitleSection: 'سجلات الاتفاقيات التي وافقت عليها.' },
    security: { title: 'الأمان', subtitleMenu: 'رمز PIN والأجهزة النشطة وأمان الحساب', subtitleSection: 'رمز PIN والأجهزة النشطة وأمان الحساب.' },
  },
  bn: {
    contracts: { title: 'চুক্তি', subtitleMenu: 'আপনার গৃহীত চুক্তি', subtitleSection: 'আপনার গৃহীত চুক্তির রেকর্ড।' },
    security: { title: 'নিরাপত্তা', subtitleMenu: 'পিন, সক্রিয় ডিভাইস ও অ্যাকাউন্ট নিরাপত্তা', subtitleSection: 'পিন, সক্রিয় ডিভাইস ও অ্যাকাউন্ট নিরাপত্তা।' },
  },
  pt: {
    contracts: { title: 'Contratos', subtitleMenu: 'Acordos que você aceitou', subtitleSection: 'Registros dos acordos que você aceitou.' },
    security: { title: 'Segurança', subtitleMenu: 'PIN, dispositivos ativos e segurança da conta', subtitleSection: 'PIN, dispositivos ativos e segurança da conta.' },
  },
  ru: {
    contracts: { title: 'Договоры', subtitleMenu: 'Принятые вами соглашения', subtitleSection: 'Записи принятых вами соглашений.' },
    security: { title: 'Безопасность', subtitleMenu: 'PIN, активные устройства и безопасность аккаунта', subtitleSection: 'PIN, активные устройства и безопасность аккаунта.' },
  },
  ur: {
    contracts: { title: 'معاہدے', subtitleMenu: 'آپ کے منظور شدہ معاہدے', subtitleSection: 'آپ کے منظور شدہ معاہدوں کے ریکارڈ۔' },
    security: { title: 'سیکیورٹی', subtitleMenu: 'PIN، فعال آلات اور اکاؤنٹ سیکیورٹی', subtitleSection: 'PIN، فعال آلات اور اکاؤنٹ سیکیورٹی۔' },
  },
  id: {
    contracts: { title: 'Kontrak', subtitleMenu: 'Perjanjian yang Anda terima', subtitleSection: 'Catatan perjanjian yang Anda terima.' },
    security: { title: 'Keamanan', subtitleMenu: 'PIN, perangkat aktif, dan keamanan akun', subtitleSection: 'PIN, perangkat aktif, dan keamanan akun.' },
  },
  de: {
    contracts: { title: 'Verträge', subtitleMenu: 'Von Ihnen akzeptierte Vereinbarungen', subtitleSection: 'Aufzeichnungen der von Ihnen akzeptierten Vereinbarungen.' },
    security: { title: 'Sicherheit', subtitleMenu: 'PIN, aktive Geräte und Kontosicherheit', subtitleSection: 'PIN, aktive Geräte und Kontosicherheit.' },
  },
  ja: {
    contracts: { title: '契約', subtitleMenu: '承認した契約', subtitleSection: '承認した契約の記録。' },
    security: { title: 'セキュリティ', subtitleMenu: 'PIN・利用中の端末・アカウント保護', subtitleSection: 'PIN・利用中の端末・アカウント保護。' },
  },
  hu: {
    contracts: { title: 'Szerződések', subtitleMenu: 'Az Ön által elfogadott megállapodások', subtitleSection: 'Az Ön által elfogadott megállapodások nyilvántartása.' },
    security: { title: 'Biztonság', subtitleMenu: 'PIN-kód, aktív eszközök és fiókbiztonság', subtitleSection: 'PIN-kód, aktív eszközök és fiókbiztonság.' },
  },
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

for (const [loc, t] of Object.entries(LOCALES)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/components/personnel/PersonnelSettingsPage.json')
      : path.join(ROOT, `json/${loc}/src/components/personnel/PersonnelSettingsPage.json`);
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  if (j.sections?.contracts) {
    j.sections.contracts.title = t.contracts.title;
    j.sections.contracts.subtitle = t.contracts.subtitleSection;
  }
  if (j.sections?.security) {
    j.sections.security.title = t.security.title;
    j.sections.security.subtitle = t.security.subtitleSection;
  }
  if (j.menu?.contracts) {
    j.menu.contracts.title = t.contracts.title;
    j.menu.contracts.subtitle = t.contracts.subtitleMenu;
  }
  if (j.menu?.security) {
    j.menu.security.title = t.security.title;
    j.menu.security.subtitle = t.security.subtitleMenu;
  }
  writeJson(p, j);
  console.log('fixed', loc);
}

// Also repair EN leftovers that are still Turkish (contact/bank/work)
const enPath = path.join(ROOT, 'json/en/src/components/personnel/PersonnelSettingsPage.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8').replace(/^\uFEFF/, ''));
Object.assign(en.sections.contact, { title: 'Contact', subtitle: 'Your email and phone details.' });
Object.assign(en.sections.bank, { title: 'Bank details', subtitle: 'Your IBAN details.' });
Object.assign(en.sections.work, { title: 'Work details', subtitle: 'Your position, daily wage, and site details.' });
Object.assign(en.sections.personal, { title: 'Personal settings', subtitle: 'Your identity and personal information.' });
Object.assign(en.menu.contact, { title: 'Contact', subtitle: 'Email and phone number' });
Object.assign(en.menu.bank, { title: 'Bank', subtitle: 'IBAN details' });
Object.assign(en.menu.work, { title: 'Work details', subtitle: 'Position, daily wage, and project' });
writeJson(enPath, en);
console.log('repaired EN leftovers');
