#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TAGLINES = {
  tr: 'İnşaat Personel Yönetimi',
  en: 'Construction Workforce Platform',
  zh: '建筑劳动力管理平台',
  hi: 'निर्माण कार्यबल प्लेटफ़ॉर्म',
  es: 'Plataforma de personal de construcción',
  fr: 'Plateforme de gestion du personnel du BTP',
  ar: 'منصة إدارة القوى العاملة في البناء',
  bn: 'নির্মাণ কর্মী ব্যবস্থাপনা প্ল্যাটফর্ম',
  pt: 'Plataforma de mão de obra da construção',
  ru: 'Платформа управления строительным персоналом',
  ur: 'تعمیراتی افرادی قوت کا پلیٹ فارم',
  id: 'Platform manajemen tenaga kerja konstruksi',
  de: 'Plattform für Baupersonalverwaltung',
  ja: '建設人材管理プラットフォーム',
  hu: 'Építőipari személyzetkezelő platform',
};

const FILES = [
  'components/home/HomeFooter.json',
  'components/home/HomeHeader.json',
  'components/dashboard/AdminMenuChrome.json',
];

for (const [loc, tag] of Object.entries(TAGLINES)) {
  const base = loc === 'tr' ? path.join(ROOT, 'json', 'src') : path.join(ROOT, 'json', loc, 'src');
  for (const rel of FILES) {
    const p = path.join(base, rel);
    if (!fs.existsSync(p)) {
      console.log('missing', p);
      continue;
    }
    const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
    j.tagline = tag;
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
  }
  console.log('ok', loc);
}
