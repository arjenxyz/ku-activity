#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOGIN = {
  tr: {
    demoHeading: 'Giriş yapmadan dene',
    footerNote: 'Rolünüze uygun paneli seçin veya demoyu deneyin.',
    demos: {
      personel: { title: 'Personel demosu', description: 'Örnek yevmiye ve avans' },
      admin: { title: 'Yönetici demosu', description: 'Örnek proje ve personel' },
    },
  },
  en: {
    demoHeading: 'Try without signing in',
    footerNote: 'Pick your panel to sign in, or try the demo.',
    demos: {
      personel: { title: 'Personnel demo', description: 'Sample wages and advances' },
      admin: { title: 'Admin demo', description: 'Sample project and staff' },
    },
  },
  zh: {
    demoHeading: '无需登录即可试用',
    footerNote: '选择面板登录，或试用演示。',
    demos: {
      personel: { title: '员工演示', description: '示例日薪与预支' },
      admin: { title: '管理员演示', description: '示例项目与人员' },
    },
  },
  hi: {
    demoHeading: 'साइन इन के बिना आज़माएँ',
    footerNote: 'साइन इन के लिए पैनल चुनें, या डेमो आज़माएँ।',
    demos: {
      personel: { title: 'कर्मचारी डेमो', description: 'नमूना वेतन और अग्रिम' },
      admin: { title: 'एडमिन डेमो', description: 'नमूना प्रोजेक्ट और स्टाफ' },
    },
  },
  es: {
    demoHeading: 'Prueba sin iniciar sesión',
    footerNote: 'Elige tu panel para entrar, o prueba la demo.',
    demos: {
      personel: { title: 'Demo de personal', description: 'Jornales y anticipos de ejemplo' },
      admin: { title: 'Demo de administrador', description: 'Proyecto y personal de ejemplo' },
    },
  },
  fr: {
    demoHeading: 'Essayer sans connexion',
    footerNote: 'Choisissez votre panneau pour vous connecter, ou essayez la démo.',
    demos: {
      personel: { title: 'Démo personnel', description: 'Salaires et acomptes exemples' },
      admin: { title: 'Démo admin', description: 'Projet et équipe exemples' },
    },
  },
  ar: {
    demoHeading: 'جرّب بدون تسجيل الدخول',
    footerNote: 'اختر لوحتك لتسجيل الدخول، أو جرّب العرض التوضيحي.',
    demos: {
      personel: { title: 'عرض الموظف', description: 'أجور وسلف نموذجية' },
      admin: { title: 'عرض المدير', description: 'مشروع وموظفون نموذجيون' },
    },
  },
  bn: {
    demoHeading: 'সাইন ইন ছাড়াই চেষ্টা করুন',
    footerNote: 'সাইন ইনের জন্য প্যানেল বেছে নিন, অথবা ডেমো চেষ্টা করুন।',
    demos: {
      personel: { title: 'কর্মী ডেমো', description: 'নমুনা মজুরি ও অগ্রিম' },
      admin: { title: 'অ্যাডমিন ডেমো', description: 'নমুনা প্রজেক্ট ও স্টাফ' },
    },
  },
  pt: {
    demoHeading: 'Experimente sem entrar',
    footerNote: 'Escolha o painel para entrar, ou experimente a demo.',
    demos: {
      personel: { title: 'Demo de pessoal', description: 'Diárias e adiantamentos de exemplo' },
      admin: { title: 'Demo de administrador', description: 'Projeto e equipe de exemplo' },
    },
  },
  ru: {
    demoHeading: 'Попробуйте без входа',
    footerNote: 'Выберите панель для входа или попробуйте демо.',
    demos: {
      personel: { title: 'Демо персонала', description: 'Пример зарплаты и авансов' },
      admin: { title: 'Демо администратора', description: 'Пример проекта и сотрудников' },
    },
  },
  ur: {
    demoHeading: 'سائن ان کے بغیر آزمائیں',
    footerNote: 'سائن ان کے لیے پینل منتخب کریں، یا ڈیمو آزمائیں۔',
    demos: {
      personel: { title: 'عملہ ڈیمو', description: 'نمونہ یومیہ اور ایڈوانس' },
      admin: { title: 'ایڈمن ڈیمو', description: 'نمونہ پروجیکٹ اور عملہ' },
    },
  },
  id: {
    demoHeading: 'Coba tanpa masuk',
    footerNote: 'Pilih panel untuk masuk, atau coba demo.',
    demos: {
      personel: { title: 'Demo personel', description: 'Contoh upah dan uang muka' },
      admin: { title: 'Demo admin', description: 'Contoh proyek dan staf' },
    },
  },
  de: {
    demoHeading: 'Ohne Anmeldung testen',
    footerNote: 'Wählen Sie Ihr Panel zum Anmelden, oder testen Sie die Demo.',
    demos: {
      personel: { title: 'Personal-Demo', description: 'Beispiel-Löhne und Vorschüsse' },
      admin: { title: 'Admin-Demo', description: 'Beispielprojekt und Personal' },
    },
  },
  ja: {
    demoHeading: 'ログインせずに試す',
    footerNote: 'ログインするパネルを選ぶか、デモをお試しください。',
    demos: {
      personel: { title: 'スタッフデモ', description: 'サンプルの日当と前払い' },
      admin: { title: '管理者デモ', description: 'サンプルのプロジェクトとスタッフ' },
    },
  },
  hu: {
    demoHeading: 'Próbáld ki bejelentkezés nélkül',
    footerNote: 'Válassz panelt a belépéshez, vagy próbáld ki a demót.',
    demos: {
      personel: { title: 'Személyzeti demó', description: 'Minta bér és előleg' },
      admin: { title: 'Admin demó', description: 'Minta projekt és személyzet' },
    },
  },
};

const HERO = {
  tr: {
    demoHint: 'Giriş yapmadan:',
    ctaDemoPersonnel: 'Personel demosu',
    ctaDemoAdmin: 'Yönetici demosu',
  },
  en: {
    demoHint: 'Without signing in:',
    ctaDemoPersonnel: 'Personnel demo',
    ctaDemoAdmin: 'Admin demo',
  },
  zh: {
    demoHint: '无需登录：',
    ctaDemoPersonnel: '员工演示',
    ctaDemoAdmin: '管理员演示',
  },
  hi: {
    demoHint: 'साइन इन के बिना:',
    ctaDemoPersonnel: 'कर्मचारी डेमो',
    ctaDemoAdmin: 'एडमिन डेमो',
  },
  es: {
    demoHint: 'Sin iniciar sesión:',
    ctaDemoPersonnel: 'Demo de personal',
    ctaDemoAdmin: 'Demo de administrador',
  },
  fr: {
    demoHint: 'Sans connexion :',
    ctaDemoPersonnel: 'Démo personnel',
    ctaDemoAdmin: 'Démo admin',
  },
  ar: {
    demoHint: 'بدون تسجيل الدخول:',
    ctaDemoPersonnel: 'عرض الموظف',
    ctaDemoAdmin: 'عرض المدير',
  },
  bn: {
    demoHint: 'সাইন ইন ছাড়া:',
    ctaDemoPersonnel: 'কর্মী ডেমো',
    ctaDemoAdmin: 'অ্যাডমিন ডেমো',
  },
  pt: {
    demoHint: 'Sem entrar:',
    ctaDemoPersonnel: 'Demo de pessoal',
    ctaDemoAdmin: 'Demo de administrador',
  },
  ru: {
    demoHint: 'Без входа:',
    ctaDemoPersonnel: 'Демо персонала',
    ctaDemoAdmin: 'Демо администратора',
  },
  ur: {
    demoHint: 'سائن ان کے بغیر:',
    ctaDemoPersonnel: 'عملہ ڈیمو',
    ctaDemoAdmin: 'ایڈمن ڈیمو',
  },
  id: {
    demoHint: 'Tanpa masuk:',
    ctaDemoPersonnel: 'Demo personel',
    ctaDemoAdmin: 'Demo admin',
  },
  de: {
    demoHint: 'Ohne Anmeldung:',
    ctaDemoPersonnel: 'Personal-Demo',
    ctaDemoAdmin: 'Admin-Demo',
  },
  ja: {
    demoHint: 'ログインなし：',
    ctaDemoPersonnel: 'スタッフデモ',
    ctaDemoAdmin: '管理者デモ',
  },
  hu: {
    demoHint: 'Bejelentkezés nélkül:',
    ctaDemoPersonnel: 'Személyzeti demó',
    ctaDemoAdmin: 'Admin demó',
  },
};

function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
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

for (const [loc, patch] of Object.entries(HERO)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/components/home/HeroSection.json')
      : path.join(ROOT, `json/${loc}/src/components/home/HeroSection.json`);
  if (!fs.existsSync(p)) continue;
  const j = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  Object.assign(j, patch);
  writeJson(p, j);
  console.log('hero', loc);
}
