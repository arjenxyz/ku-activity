import type { GuideStep } from './types';

/** Scripted live guide — Devam advances one step at a time. */
export const GUIDE_STEPS: GuideStep[] = [
  // 1. Karşılama
  {
    id: 'welcome-1',
    chapter: 'Karşılama',
    botText: 'Merhaba! Ben panel rehberin. Birlikte menüleri ve araçları canlı taklitte gezeceğiz.',
    stage: 'welcome',
    navMode: 'root',
  },
  {
    id: 'welcome-2',
    chapter: 'Karşılama',
    botText: 'Gerçek verilere dokunmayacağız — her şey örnek. Hazırsan Devam’a bas.',
    stage: 'welcome',
    navMode: 'root',
  },

  // 2. Menü mantığı
  {
    id: 'menu-1',
    chapter: 'Menü',
    botText: 'Soldaki (veya mobil menüdeki) ana öğeler her zaman durur: etkinlikler, ekip, eğitim, denetim, ayarlar.',
    stage: 'menu',
    navMode: 'root',
    highlight: 'nav-events',
  },
  {
    id: 'menu-2',
    chapter: 'Menü',
    botText: 'Önemli kural: katılımcı, ödeme ve check-in araçları yalnızca bir etkinlik seçildikten sonra menüde görünür.',
    stage: 'menu',
    navMode: 'root',
    highlight: 'nav-events',
  },
  {
    id: 'menu-3',
    chapter: 'Menü',
    botText: 'Şimdi Etkinlikler’e geçiyorum — listeyi taklitte açıyorum.',
    stage: 'menu',
    navMode: 'root',
    highlight: 'nav-events',
    pulse: true,
  },

  // 3. Etkinlikler
  {
    id: 'events-1',
    chapter: 'Etkinlikler',
    botText: 'Etkinlik listesi burada. Kartlarda konum, tarih ve durum görünür.',
    stage: 'events',
    navMode: 'root',
    highlight: 'event-card',
  },
  {
    id: 'events-2',
    chapter: 'Etkinlikler',
    botText: 'Sağ üstteki Düzenle ile forma gidersin; Etkinlik Detayları çalışma alanını açar.',
    stage: 'events',
    navMode: 'root',
    highlight: 'event-edit-btn',
  },
  {
    id: 'events-3',
    chapter: 'Etkinlikler',
    botText: 'Örnek etkinliğe tıklıyorum — menü etkinlik araçlarına dönüşecek.',
    stage: 'events',
    navMode: 'root',
    highlight: 'event-details',
    pulse: true,
  },

  // 4. Etkinlik seçimi → menü
  {
    id: 'event-nav-1',
    chapter: 'Etkinlik menüsü',
    botText: 'Gördün mü? Menü artık bu etkinliğe özel: çalışma alanı, katılımcılar, ödemeler…',
    stage: 'event-nav',
    navMode: 'event',
    highlight: 'nav-workspace',
  },
  {
    id: 'event-nav-2',
    chapter: 'Etkinlik menüsü',
    botText: 'Üstteki “Ana menü” ile her zaman küresel menüye dönebilirsin.',
    stage: 'event-nav',
    navMode: 'event',
    highlight: 'nav-workspace',
  },

  // 5. Çalışma alanı
  {
    id: 'workspace-1',
    chapter: 'Çalışma alanı',
    botText: 'Çalışma alanı, seçili etkinliğin hub’ı. Araçlara buradan veya menüden ulaşırsın.',
    stage: 'workspace',
    navMode: 'event',
    highlight: 'workspace-hub',
  },
  {
    id: 'workspace-2',
    chapter: 'Çalışma alanı',
    botText: 'Sırada katılımcılar — kayıtlı öğrencileri göreceğiz.',
    stage: 'workspace',
    navMode: 'event',
    highlight: 'nav-participants',
    pulse: true,
  },

  // 6. Katılımcılar
  {
    id: 'participants-1',
    chapter: 'Katılımcılar',
    botText: 'Liste kayıt no, ad ve ödeme durumunu gösterir.',
    stage: 'participants',
    navMode: 'event',
    highlight: 'participant-row',
  },
  {
    id: 'participants-2',
    chapter: 'Katılımcılar',
    botText: 'Bir satıra basınca detay açılır: ödeme, yoklama ve iletişim.',
    stage: 'participants',
    navMode: 'event',
    highlight: 'participant-row',
    pulse: true,
  },

  // 7. Havale
  {
    id: 'reviews-1',
    chapter: 'Havale',
    botText: 'Havale incelemelerinde bekleyen dekontlar kuyrukta durur.',
    stage: 'reviews',
    navMode: 'event',
    highlight: 'nav-reviews',
  },
  {
    id: 'reviews-2',
    chapter: 'Havale',
    botText: 'Dekontu kontrol edip onayla veya reddet — örnek satırda Onay’ı işaretliyorum.',
    stage: 'reviews',
    navMode: 'event',
    highlight: 'review-approve',
    pulse: true,
  },

  // 8. Elden
  {
    id: 'cash-1',
    chapter: 'Elden teslim',
    botText: 'Elden ödemede katılımcı QR’ını okutursun; tutar anında ödendi sayılır.',
    stage: 'cash',
    navMode: 'event',
    highlight: 'cash-qr',
  },
  {
    id: 'cash-2',
    chapter: 'Elden teslim',
    botText: 'Nakit sende kalır; kasa yetkilisi değişince devir ekranını kullanırsın.',
    stage: 'cash',
    navMode: 'event',
    highlight: 'nav-custody',
    pulse: true,
  },

  // 9. Kasa
  {
    id: 'custody-1',
    chapter: 'Kasa / devir',
    botText: 'Kasa / yetkili devir: kimden kime, tutar ve not kaydı.',
    stage: 'custody',
    navMode: 'event',
    highlight: 'custody-row',
  },
  {
    id: 'custody-2',
    chapter: 'Kasa / devir',
    botText: 'QR ile devir de alabilirsin — iz denetimde kalır.',
    stage: 'custody',
    navMode: 'event',
    highlight: 'custody-row',
    pulse: true,
  },

  // 10. Check-in
  {
    id: 'checkin-1',
    chapter: 'Check-in',
    botText: 'Etkinlik günü QR veya kayıt no ile yoklama alırsın.',
    stage: 'checkin',
    navMode: 'event',
    highlight: 'checkin-scan',
  },
  {
    id: 'checkin-2',
    chapter: 'Check-in',
    botText: 'Başarılı tarama satırı yeşile döner — örnek taramayı gösteriyorum.',
    stage: 'checkin',
    navMode: 'event',
    highlight: 'checkin-scan',
    pulse: true,
  },

  // 11. Raporlar
  {
    id: 'reports-1',
    chapter: 'Raporlar',
    botText: 'Raporlar kayıt, ödeme ve check-in özetini bir arada gösterir.',
    stage: 'reports',
    navMode: 'event',
    highlight: 'report-stat',
  },
  {
    id: 'reports-2',
    chapter: 'Raporlar',
    botText: 'Filtrelerle güne veya duruma göre daraltabilirsin.',
    stage: 'reports',
    navMode: 'event',
    highlight: 'report-stat',
  },

  // 12. Düzenle
  {
    id: 'edit-1',
    chapter: 'Düzenle',
    botText: 'Düzenle formunda başlık, konum ve kapasiteyi güncellersin.',
    stage: 'edit',
    navMode: 'event',
    highlight: 'edit-title',
  },
  {
    id: 'edit-2',
    chapter: 'Düzenle',
    botText: 'Tarih ve kayıt penceresi buradan ayarlanır.',
    stage: 'edit',
    navMode: 'event',
    highlight: 'edit-dates',
    pulse: true,
  },

  // 13. Ekip (root nav again)
  {
    id: 'team-1',
    chapter: 'Ekip ilanı',
    botText: 'Ana menüye dönüp Ekip ilanı’na geçiyorum — görevli aramak için.',
    stage: 'team',
    navMode: 'root',
    highlight: 'nav-team',
  },
  {
    id: 'team-2',
    chapter: 'Ekip ilanı',
    botText: 'Açık ilan burada; başvurular sağda veya altta kuyruklanır.',
    stage: 'team',
    navMode: 'root',
    highlight: 'team-opening',
  },
  {
    id: 'team-3',
    chapter: 'Ekip ilanı',
    botText: 'Başvuruyu onayla veya reddet — örnek satırı işaretliyorum.',
    stage: 'team',
    navMode: 'root',
    highlight: 'team-applicant',
    pulse: true,
  },

  // 14. Denetim
  {
    id: 'audit-1',
    chapter: 'Denetim',
    botText: 'Denetim kayıtları: kim, ne zaman, hangi işlem.',
    stage: 'audit',
    navMode: 'root',
    highlight: 'nav-audit',
  },
  {
    id: 'audit-2',
    chapter: 'Denetim',
    botText: 'Ödeme onayı veya check-in gibi kritik izler burada satır satır durur.',
    stage: 'audit',
    navMode: 'root',
    highlight: 'audit-row',
    pulse: true,
  },

  // 15. Ayarlar
  {
    id: 'settings-1',
    chapter: 'Ayarlar',
    botText: 'Ayarlar’da panel tercihlerini görürsün. Dil için üstteki bayrağı da kullanabilirsin.',
    stage: 'settings',
    navMode: 'root',
    highlight: 'settings-pref',
  },
  {
    id: 'settings-2',
    chapter: 'Ayarlar',
    botText: 'Çıkış menünün altında, Ayarlar’ın hemen yanında kırmızı satır olarak durur.',
    stage: 'settings',
    navMode: 'root',
    highlight: 'settings-logout',
  },

  // 16. Bitiş
  {
    id: 'done-1',
    chapter: 'Bitiş',
    botText: 'Rehber bitti! Gerçek menüden Etkinlikler’e giderek paneli kullanmaya başlayabilirsin.',
    stage: 'done',
    navMode: 'root',
  },
];

export function getGuideProgress(stepIndex: number) {
  const total = GUIDE_STEPS.length;
  const clamped = Math.min(Math.max(stepIndex, 0), total - 1);
  return {
    current: clamped + 1,
    total,
    percent: Math.round(((clamped + 1) / total) * 100),
    step: GUIDE_STEPS[clamped],
  };
}
