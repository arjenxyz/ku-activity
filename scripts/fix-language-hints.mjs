#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['tr', 'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ru', 'ur', 'id', 'de', 'ja', 'hu'];

const HINTS = {
  tr: {
    appLanguage: '15 dil arasından seçin',
    settingsHint: '15 dil arasından seçebilirsiniz.',
    adminHint: '15 dil arasından seçin',
  },
  en: {
    appLanguage: 'Choose from 15 languages',
    settingsHint: 'Choose from 15 languages.',
    adminHint: 'Choose from 15 languages',
  },
  zh: { appLanguage: '从 15 种语言中选择', settingsHint: '可从 15 种语言中选择。', adminHint: '从 15 种语言中选择' },
  hi: { appLanguage: '15 भाषाओं में से चुनें', settingsHint: '15 भाषाओं में से चुन सकते हैं।', adminHint: '15 भाषाओं में से चुनें' },
  es: { appLanguage: 'Elija entre 15 idiomas', settingsHint: 'Puede elegir entre 15 idiomas.', adminHint: 'Elija entre 15 idiomas' },
  fr: { appLanguage: 'Choisissez parmi 15 langues', settingsHint: 'Vous pouvez choisir parmi 15 langues.', adminHint: 'Choisissez parmi 15 langues' },
  ar: { appLanguage: 'اختر من بين 15 لغة', settingsHint: 'يمكنك الاختيار من بين 15 لغة.', adminHint: 'اختر من بين 15 لغة' },
  bn: { appLanguage: '১৫টি ভাষার মধ্যে থেকে বেছে নিন', settingsHint: '১৫টি ভাষার মধ্যে থেকে বেছে নিতে পারেন।', adminHint: '১৫টি ভাষার মধ্যে থেকে বেছে নিন' },
  pt: { appLanguage: 'Escolha entre 15 idiomas', settingsHint: 'Você pode escolher entre 15 idiomas.', adminHint: 'Escolha entre 15 idiomas' },
  ru: { appLanguage: 'Выберите из 15 языков', settingsHint: 'Можно выбрать из 15 языков.', adminHint: 'Выберите из 15 языков' },
  ur: { appLanguage: '15 زبانوں میں سے منتخب کریں', settingsHint: 'آپ 15 زبانوں میں سے انتخاب کر سکتے ہیں۔', adminHint: '15 زبانوں میں سے منتخب کریں' },
  id: { appLanguage: 'Pilih dari 15 bahasa', settingsHint: 'Anda dapat memilih dari 15 bahasa.', adminHint: 'Pilih dari 15 bahasa' },
  de: { appLanguage: 'Wählen Sie aus 15 Sprachen', settingsHint: 'Sie können aus 15 Sprachen wählen.', adminHint: 'Wählen Sie aus 15 Sprachen' },
  ja: { appLanguage: '15言語から選択', settingsHint: '15言語から選択できます。', adminHint: '15言語から選択' },
  hu: { appLanguage: 'Válasszon 15 nyelv közül', settingsHint: '15 nyelv közül választhat.', adminHint: 'Válasszon 15 nyelv közül' },
};

function localeRoot(loc) {
  return loc === 'tr' ? path.join(ROOT, 'json', 'src') : path.join(ROOT, 'json', loc, 'src');
}

for (const loc of LOCALES) {
  const h = HINTS[loc];
  const base = localeRoot(loc);

  const appSettings = path.join(base, 'components/personnel/PersonnelAppSettings.json');
  if (fs.existsSync(appSettings)) {
    const j = JSON.parse(fs.readFileSync(appSettings, 'utf8').replace(/^\uFEFF/, ''));
    j.menuHints = j.menuHints || {};
    j.menuHints.language = h.appLanguage;
    j.languageHint = h.appLanguage;
    fs.writeFileSync(appSettings, JSON.stringify(j, null, 2) + '\n');
  }

  const settingsPage = path.join(base, 'components/personnel/PersonnelSettingsPage.json');
  if (fs.existsSync(settingsPage)) {
    const j = JSON.parse(fs.readFileSync(settingsPage, 'utf8').replace(/^\uFEFF/, ''));
    j.language = j.language || {};
    j.language.hint = h.settingsHint;
    fs.writeFileSync(settingsPage, JSON.stringify(j, null, 2) + '\n');
  }

  const adminSettings = path.join(base, 'components/admin/AdminAppSettings.json');
  if (fs.existsSync(adminSettings)) {
    const j = JSON.parse(fs.readFileSync(adminSettings, 'utf8').replace(/^\uFEFF/, ''));
    j.languageHint = h.adminHint;
    fs.writeFileSync(adminSettings, JSON.stringify(j, null, 2) + '\n');
  }

  console.log('updated', loc);
}
