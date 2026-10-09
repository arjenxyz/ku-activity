import type { TeamApplication, TeamOpening } from '@/lib/team/types';
import { countsFor } from '@/lib/team/types';

type Store = {
  openings: TeamOpening[];
  applications: TeamApplication[];
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function store(): Store {
  const g = globalThis as typeof globalThis & { __emsTeamStoreV1?: Store };
  if (!g.__emsTeamStoreV1) {
    const openingId = 'opening_demo_active';
    g.__emsTeamStoreV1 = {
      openings: [
        {
          id: openingId,
          title: '2026 Gönüllü Ekip',
          description:
            'Etkinlik günlerinde check-in, karşılama ve saha desteği için gönüllü arıyoruz. Haftada en az bir vardiya.',
          isOpen: true,
          createdAt: '2026-10-05T10:00:00.000Z',
        },
      ],
      applications: [
        {
          id: 'app_demo_1',
          openingId,
          profileId: 'demo-student-1',
          fullName: 'Ayşe Yılmaz',
          email: 'ornek.ayse@ogrenci.kastamonu.edu.tr',
          note: 'Abana’da daha önce görev aldım, check-in deneyimim var.',
          status: 'pending',
          createdAt: '2026-10-07T14:20:00.000Z',
        },
        {
          id: 'app_demo_2',
          openingId,
          profileId: 'demo-student-2',
          fullName: 'Mehmet Kaya',
          email: 'ornek.mehmet@ogrenci.kastamonu.edu.tr',
          note: 'Rehberlik bölümüyüm, misafir karşılama yapmak isterim.',
          status: 'pending',
          createdAt: '2026-10-08T09:15:00.000Z',
        },
        {
          id: 'app_demo_3',
          openingId,
          profileId: 'demo-student-3',
          fullName: 'Elif Demir',
          email: 'ornek.elif@ogrenci.kastamonu.edu.tr',
          note: null,
          status: 'accepted',
          createdAt: '2026-10-06T11:00:00.000Z',
        },
        {
          id: 'app_demo_4',
          openingId,
          profileId: 'demo-student-4',
          fullName: 'Can Öztürk',
          email: 'ornek.can@ogrenci.kastamonu.edu.tr',
          note: 'Sadece Cumartesi müsaitim.',
          status: 'rejected',
          createdAt: '2026-10-06T16:40:00.000Z',
        },
      ],
    };
  }
  return g.__emsTeamStoreV1;
}

export function getTeamSnapshot() {
  const openings = store().openings.map((row) => ({ ...row }));
  const active = openings.find((row) => row.isOpen) ?? null;
  const applications = store()
    .applications.filter((row) => (active ? row.openingId === active.id : false))
    .map((row) => ({ ...row }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    openings,
    activeOpening: active,
    applications,
    counts: countsFor(applications),
  };
}

export function createTeamOpening(input: { title: string; description?: string }) {
  const title = input.title.trim();
  if (!title) throw new Error('Başlık gerekli');

  for (const row of store().openings) {
    if (row.isOpen) row.isOpen = false;
  }

  const opening: TeamOpening = {
    id: uid('opening'),
    title,
    description: input.description?.trim() || null,
    isOpen: true,
    createdAt: new Date().toISOString(),
  };
  store().openings.unshift(opening);
  return getTeamSnapshot();
}

export function closeTeamOpening(openingId: string) {
  const row = store().openings.find((item) => item.id === openingId);
  if (!row) throw new Error('İlan bulunamadı');
  row.isOpen = false;
  return getTeamSnapshot();
}

export function reviewTeamApplication(
  applicationId: string,
  status: 'accepted' | 'rejected'
) {
  const row = store().applications.find((item) => item.id === applicationId);
  if (!row) throw new Error('Başvuru bulunamadı');
  row.status = status;
  return getTeamSnapshot();
}
