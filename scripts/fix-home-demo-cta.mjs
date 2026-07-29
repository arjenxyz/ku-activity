#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const HERO = {
  tr: { ctaDemo: 'Demoyu dene' },
  en: { ctaDemo: 'Try the demo' },
  zh: { ctaDemo: '试用演示' },
  hi: { ctaDemo: 'डेमो आज़माएँ' },
  es: { ctaDemo: 'Probar la demo' },
  fr: { ctaDemo: 'Essayer la démo' },
  ar: { ctaDemo: 'جرّب العرض' },
  bn: { ctaDemo: 'ডেমো চেষ্টা করুন' },
  pt: { ctaDemo: 'Experimentar a demo' },
  ru: { ctaDemo: 'Попробовать демо' },
  ur: { ctaDemo: 'ڈیمو آزمائیں' },
  id: { ctaDemo: 'Coba demo' },
  de: { ctaDemo: 'Demo ausprobieren' },
  ja: { ctaDemo: 'デモを試す' },
  hu: { ctaDemo: 'Demó kipróbálása' },
};

const LOGIN = {
  tr: {
    footerNote: 'Rolünüze uygun paneli seçerek giriş yapın.',
    demoModalTitle: 'Demo seçin',
    demoFooterNote: 'Giriş gerekmez — örnek verilerle gezin.',
    demoHeading: 'Giriş yapmadan dene',
  },
  en: {
    footerNote: 'Choose the panel that matches your role to sign in.',
    demoModalTitle: 'Choose a demo',
    demoFooterNote: 'No sign-in needed — browse with sample data.',
    demoHeading: 'Try without signing in',
  },
  zh: {
    footerNote: '选择与您角色匹配的面板登录。',
    demoModalTitle: '选择演示',
    demoFooterNote: '无需登录 — 使用示例数据浏览。',
    demoHeading: '无需登录即可试用',
  },
  hi: {
    footerNote: 'साइन इन करने के लिए अपनी भूमिका के अनुसार पैनल चुनें।',
    demoModalTitle: 'डेमो चुनें',
    demoFooterNote: 'साइन इन की आवश्यकता नहीं — नमूना डेटा से देखें।',
    demoHeading: 'साइन इन के बिना आज़माएँ',
  },
  es: {
    footerNote: 'Elige el panel que corresponda a tu rol para iniciar sesión.',
    demoModalTitle: 'Elige una demo',
    demoFooterNote: 'Sin inicio de sesión — explora con datos de ejemplo.',
    demoHeading: 'Prueba sin iniciar sesión',
  },
  fr: {
    footerNote: 'Choisissez le panneau correspondant à votre rôle pour vous connecter.',
    demoModalTitle: 'Choisissez une démo',
    demoFooterNote: 'Sans connexion — parcourez avec des données exemples.',
    demoHeading: 'Essayer sans connexion',
  },
  ar: {
    footerNote: 'اختر اللوحة المناسبة لدورك لتسجيل الدخول.',
    demoModalTitle: 'اختر عرضًا توضيحيًا',
    demoFooterNote: 'لا يلزم تسجيل الدخول — تصفح ببيانات نموذجية.',
    demoHeading: 'جرّب بدون تسجيل الدخول',
  },
  bn: {
    footerNote: 'সাইন ইন করতে আপনার ভূমির সাথে মিল রেখে প্যানেল বেছে নিন।',
    demoModalTitle: 'ডেমো বেছে নিন',
    demoFooterNote: 'সাইন ইন লাগবে না — নমুনা ডেটা দিয়ে ঘুরুন।',
    demoHeading: 'সাইন ইন ছাড়াই চেষ্টা করুন',
  },
  pt: {
    footerNote: 'Escolha o painel adequado ao seu perfil para entrar.',
    demoModalTitle: 'Escolha uma demo',
    demoFooterNote: 'Sem login — explore com dados de exemplo.',
    demoHeading: 'Experimente sem entrar',
  },
  ru: {
    footerNote: 'Выберите панель, соответствующую вашей роли, для входа.',
    demoModalTitle: 'Выберите демо',
    demoFooterNote: 'Вход не нужен — смотрите на примерах данных.',
    demoHeading: 'Попробуйте без входа',
  },
  ur: {
    footerNote: 'سائن ان کے لیے اپنے کردار کے مطابق پینل منتخب کریں۔',
    demoModalTitle: 'ڈیمو منتخب کریں',
    demoFooterNote: 'سائن ان کی ضرورت نہیں — نمونہ ڈیٹا سے دیکھیں۔',
    demoHeading: 'سائن ان کے بغیر آزمائیں',
  },
  id: {
    footerNote: 'Pilih panel sesuai peran Anda untuk masuk.',
    demoModalTitle: 'Pilih demo',
    demoFooterNote: 'Tanpa masuk — jelajahi dengan data contoh.',
    demoHeading: 'Coba tanpa masuk',
  },
  de: {
    footerNote: 'Wählen Sie das zu Ihrer Rolle passende Panel zum Anmelden.',
    demoModalTitle: 'Demo wählen',
    demoFooterNote: 'Keine Anmeldung nötig — mit Beispieldaten stöbern.',
    demoHeading: 'Ohne Anmeldung testen',
  },
  ja: {
    footerNote: '役割に合ったパネルを選んでログインしてください。',
    demoModalTitle: 'デモを選択',
    demoFooterNote: 'ログイン不要 — サンプルデータで閲覧。',
    demoHeading: 'ログインせずに試す',
  },
  hu: {
    footerNote: 'Válassza ki a szerepének megfelelő panelt a belépéshez.',
    demoModalTitle: 'Válassz demót',
    demoFooterNote: 'Nincs szükség belépésre — mintaadatokkal böngéssz.',
    demoHeading: 'Próbáld ki bejelentkezés nélkül',
  },
};

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

for (const [loc, patch] of Object.entries(HERO)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/components/home/HeroSection.json')
      : path.join(ROOT, `json/${loc}/src/components/home/HeroSection.json`);
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  delete j.demoHint;
  delete j.ctaDemoPersonnel;
  delete j.ctaDemoAdmin;
  // keep ctaExplore for #features elsewhere if needed; hero uses ctaDemo now
  Object.assign(j, patch);
  writeJson(p, j);
  console.log('hero', loc);
}

for (const [loc, patch] of Object.entries(LOGIN)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/components/home/LoginRolePicker.json')
      : path.join(ROOT, `json/${loc}/src/components/home/LoginRolePicker.json`);
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  Object.assign(j, patch);
  writeJson(p, j);
  console.log('login', loc);
}
