#!/usr/bin/env node
/**
 * Overwrite InstallPrompt.json for every locale with curated translations.
 * EN was previously Turkish, so machine translation produced phonetic garbage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOCALES = {
  tr: {
    regionAriaLabel: 'Uygulamayı yükle',
    closeAriaLabel: 'Kapat',
    brandLabel: 'CREWLEDGER',
    title: 'Ana ekrana ekleyin',
    iosHintPrefix: "Safari'de",
    iosShare: 'Paylaş',
    iosHintSuffix: '→',
    iosAddToHome: 'Ana Ekrana Ekle',
    androidHint:
      'Yoklama ve yevmiye için uygulama gibi hızlı açılış — tek dokunuşla paneliniz hazır.',
    installButton: 'Ana ekrana ekle',
    iosSafariNote:
      'Kurulum yalnızca Safari üzerinden yapılır; Chrome veya başka tarayıcıda menü farklı olabilir.',
    dismiss: 'Daha sonra',
  },
  en: {
    regionAriaLabel: 'Install app',
    closeAriaLabel: 'Close',
    brandLabel: 'CREWLEDGER',
    title: 'Add to Home Screen',
    iosHintPrefix: 'In Safari, tap',
    iosShare: 'Share',
    iosHintSuffix: '→',
    iosAddToHome: 'Add to Home Screen',
    androidHint:
      'App-like quick launch for attendance and daily wages — your panel is ready with one tap.',
    installButton: 'Add to Home Screen',
    iosSafariNote:
      'Install works only in Safari; the menu may look different in Chrome or other browsers.',
    dismiss: 'Later',
  },
  zh: {
    regionAriaLabel: '安装应用',
    closeAriaLabel: '关闭',
    brandLabel: 'CREWLEDGER',
    title: '添加到主屏幕',
    iosHintPrefix: '在 Safari 中点击',
    iosShare: '共享',
    iosHintSuffix: '→',
    iosAddToHome: '添加到主屏幕',
    androidHint: '像原生应用一样快速打开考勤与日薪面板——一键即可就绪。',
    installButton: '添加到主屏幕',
    iosSafariNote: '仅可在 Safari 中安装；Chrome 或其他浏览器中的菜单可能不同。',
    dismiss: '稍后',
  },
  hi: {
    regionAriaLabel: 'ऐप इंस्टॉल करें',
    closeAriaLabel: 'बंद करें',
    brandLabel: 'CREWLEDGER',
    title: 'होम स्क्रीन पर जोड़ें',
    iosHintPrefix: 'Safari में टैप करें',
    iosShare: 'शेयर',
    iosHintSuffix: '→',
    iosAddToHome: 'होम स्क्रीन पर जोड़ें',
    androidHint:
      'हाज़िरी और दिहाड़ी के लिए ऐप जैसा तेज़ लॉन्च — एक टैप में आपका पैनल तैयार।',
    installButton: 'होम स्क्रीन पर जोड़ें',
    iosSafariNote:
      'इंस्टॉल केवल Safari में काम करता है; Chrome या अन्य ब्राउज़र में मेनू अलग हो सकता है।',
    dismiss: 'बाद में',
  },
  es: {
    regionAriaLabel: 'Instalar aplicación',
    closeAriaLabel: 'Cerrar',
    brandLabel: 'CREWLEDGER',
    title: 'Añadir a la pantalla de inicio',
    iosHintPrefix: 'En Safari, toca',
    iosShare: 'Compartir',
    iosHintSuffix: '→',
    iosAddToHome: 'Añadir a pantalla de inicio',
    androidHint:
      'Apertura rápida como una app para asistencia y jornales: tu panel listo con un toque.',
    installButton: 'Añadir a la pantalla de inicio',
    iosSafariNote:
      'La instalación solo funciona en Safari; el menú puede ser distinto en Chrome u otros navegadores.',
    dismiss: 'Más tarde',
  },
  fr: {
    regionAriaLabel: "Installer l'application",
    closeAriaLabel: 'Fermer',
    brandLabel: 'CREWLEDGER',
    title: "Ajouter à l'écran d'accueil",
    iosHintPrefix: 'Dans Safari, touchez',
    iosShare: 'Partager',
    iosHintSuffix: '→',
    iosAddToHome: "Ajouter à l'écran d'accueil",
    androidHint:
      'Ouverture rapide comme une appli pour la présence et le salaire journalier — votre panneau prêt en un tap.',
    installButton: "Ajouter à l'écran d'accueil",
    iosSafariNote:
      "L'installation ne fonctionne que dans Safari ; le menu peut différer dans Chrome ou d'autres navigateurs.",
    dismiss: 'Plus tard',
  },
  ar: {
    regionAriaLabel: 'تثبيت التطبيق',
    closeAriaLabel: 'إغلاق',
    brandLabel: 'CREWLEDGER',
    title: 'إضافة إلى الشاشة الرئيسية',
    iosHintPrefix: 'في Safari، اضغط',
    iosShare: 'مشاركة',
    iosHintSuffix: '→',
    iosAddToHome: 'إضافة إلى الشاشة الرئيسية',
    androidHint:
      'فتح سريع كتطبيق للحضور والأجر اليومي — لوحتك جاهزة بلمسة واحدة.',
    installButton: 'إضافة إلى الشاشة الرئيسية',
    iosSafariNote:
      'التثبيت يعمل فقط عبر Safari؛ قد يختلف القائمة في Chrome أو المتصفحات الأخرى.',
    dismiss: 'لاحقًا',
  },
  bn: {
    regionAriaLabel: 'অ্যাপ ইনস্টল করুন',
    closeAriaLabel: 'বন্ধ',
    brandLabel: 'CREWLEDGER',
    title: 'হোম স্ক্রিনে যোগ করুন',
    iosHintPrefix: 'Safari-তে ট্যাপ করুন',
    iosShare: 'শেয়ার',
    iosHintSuffix: '→',
    iosAddToHome: 'হোম স্ক্রিনে যোগ করুন',
    androidHint:
      'হাজিরা ও দৈনিক মজুরির জন্য অ্যাপের মতো দ্রুত খোলা — এক ট্যাপে আপনার প্যানেল প্রস্তুত।',
    installButton: 'হোম স্ক্রিনে যোগ করুন',
    iosSafariNote:
      'ইনস্টল শুধু Safari-তে কাজ করে; Chrome বা অন্য ব্রাউজারে মেনু আলাদা হতে পারে।',
    dismiss: 'পরে',
  },
  pt: {
    regionAriaLabel: 'Instalar aplicativo',
    closeAriaLabel: 'Fechar',
    brandLabel: 'CREWLEDGER',
    title: 'Adicionar à tela inicial',
    iosHintPrefix: 'No Safari, toque em',
    iosShare: 'Compartilhar',
    iosHintSuffix: '→',
    iosAddToHome: 'Adicionar à Tela de Início',
    androidHint:
      'Abertura rápida como um app para presença e diária — seu painel pronto com um toque.',
    installButton: 'Adicionar à tela inicial',
    iosSafariNote:
      'A instalação só funciona no Safari; o menu pode ser diferente no Chrome ou em outros navegadores.',
    dismiss: 'Mais tarde',
  },
  ru: {
    regionAriaLabel: 'Установить приложение',
    closeAriaLabel: 'Закрыть',
    brandLabel: 'CREWLEDGER',
    title: 'Добавить на домашний экран',
    iosHintPrefix: 'В Safari нажмите',
    iosShare: 'Поделиться',
    iosHintSuffix: '→',
    iosAddToHome: 'На экран «Домой»',
    androidHint:
      'Быстрый запуск как в приложении для учёта явки и подённой оплаты — панель готова одним касанием.',
    installButton: 'Добавить на домашний экран',
    iosSafariNote:
      'Установка работает только в Safari; в Chrome или других браузерах меню может отличаться.',
    dismiss: 'Позже',
  },
  ur: {
    regionAriaLabel: 'ایپ انسٹال کریں',
    closeAriaLabel: 'بند کریں',
    brandLabel: 'CREWLEDGER',
    title: 'ہوم اسکرین میں شامل کریں',
    iosHintPrefix: 'Safari میں تھپتھپائیں',
    iosShare: 'شیئر',
    iosHintSuffix: '→',
    iosAddToHome: 'ہوم اسکرین میں شامل کریں',
    androidHint:
      'حاضری اور یومیہ اجرت کے لیے ایپ جیسی تیز لانچ — ایک تھپکی میں آپ کا پینل تیار۔',
    installButton: 'ہوم اسکرین میں شامل کریں',
    iosSafariNote:
      'انسٹال صرف Safari میں کام کرتا ہے؛ Chrome یا دیگر براؤزرز میں مینو مختلف ہو سکتا ہے۔',
    dismiss: 'بعد میں',
  },
  id: {
    regionAriaLabel: 'Pasang aplikasi',
    closeAriaLabel: 'Tutup',
    brandLabel: 'CREWLEDGER',
    title: 'Tambahkan ke Layar Utama',
    iosHintPrefix: 'Di Safari, ketuk',
    iosShare: 'Bagikan',
    iosHintSuffix: '→',
    iosAddToHome: 'Tambah ke Layar Utama',
    androidHint:
      'Buka cepat seperti aplikasi untuk absensi dan upah harian — panel Anda siap dengan satu ketukan.',
    installButton: 'Tambahkan ke Layar Utama',
    iosSafariNote:
      'Pemasangan hanya berfungsi di Safari; menu mungkin berbeda di Chrome atau browser lain.',
    dismiss: 'Nanti',
  },
  de: {
    regionAriaLabel: 'App installieren',
    closeAriaLabel: 'Schließen',
    brandLabel: 'CREWLEDGER',
    title: 'Zum Home-Bildschirm hinzufügen',
    iosHintPrefix: 'Tippen Sie in Safari auf',
    iosShare: 'Teilen',
    iosHintSuffix: '→',
    iosAddToHome: 'Zum Home-Bildschirm',
    androidHint:
      'App-ähnlicher Schnellstart für Anwesenheit und Tagelohn — Ihr Panel ist mit einem Tipp bereit.',
    installButton: 'Zum Home-Bildschirm hinzufügen',
    iosSafariNote:
      'Die Installation funktioniert nur in Safari; in Chrome oder anderen Browsern kann das Menü anders aussehen.',
    dismiss: 'Später',
  },
  ja: {
    regionAriaLabel: 'アプリをインストール',
    closeAriaLabel: '閉じる',
    brandLabel: 'CREWLEDGER',
    title: 'ホーム画面に追加',
    iosHintPrefix: 'Safariで',
    iosShare: '共有',
    iosHintSuffix: '→',
    iosAddToHome: 'ホーム画面に追加',
    androidHint:
      '出勤と日当をアプリのようにすぐ開ける — タップひとつでパネルの準備完了。',
    installButton: 'ホーム画面に追加',
    iosSafariNote:
      'インストールはSafariのみ対応です。Chromeなどではメニューが異なる場合があります。',
    dismiss: '後で',
  },
  hu: {
    regionAriaLabel: 'Alkalmazás telepítése',
    closeAriaLabel: 'Bezárás',
    brandLabel: 'CREWLEDGER',
    title: 'Hozzáadás a kezdőképernyőhöz',
    iosHintPrefix: 'A Safariban koppintson',
    iosShare: 'Megosztás',
    iosHintSuffix: '→',
    iosAddToHome: 'Hozzáadás a kezdőképernyőhöz',
    androidHint:
      'Gyors indítás alkalmazásként a jelenléthez és a napidíjhoz — egy érintéssel készen áll a panel.',
    installButton: 'Hozzáadás a kezdőképernyőhöz',
    iosSafariNote:
      'A telepítés csak Safariban működik; Chrome-ban vagy más böngészőben a menü eltérhet.',
    dismiss: 'Később',
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

for (const [loc, strings] of Object.entries(LOCALES)) {
  const p =
    loc === 'tr'
      ? path.join(ROOT, 'json/src/components/pwa/InstallPrompt.json')
      : path.join(ROOT, `json/${loc}/src/components/pwa/InstallPrompt.json`);
  writeJson(p, strings);
  console.log('ok', loc);
}
