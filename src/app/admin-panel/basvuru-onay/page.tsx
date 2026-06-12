'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiArrowRight, FiGrid } from 'react-icons/fi';
import { cardClass } from '@/components/project/ui';

type Project = { id: string; name: string };

function BasvuruOnayProjectPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kod = searchParams.get('kod')?.trim() ?? '';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/projects?filter=active')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || projects.length !== 1) return;
    const target = `/admin-panel/proje/${projects[0].id}/basvuru-onay${
      kod ? `?kod=${encodeURIComponent(kod)}` : ''
    }`;
    router.replace(target);
  }, [loading, projects, kod, router]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Projeler yükleniyor…
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Başvuru onayı</h1>
        <p className="text-sm text-slate-600">Önce aktif bir proje oluşturmalısınız.</p>
        <Link
          href="/admin-panel"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
        >
          <FiGrid className="w-4 h-4" />
          Projelere git
        </Link>
      </div>
    );
  }

  if (projects.length === 1) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Yönlendiriliyor…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Başvuru onayı</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Başvuruyu hangi projeye ekleyeceğinizi seçin
          {kod ? (
            <>
              {' '}
              (<span className="font-mono text-slate-800">{kod}</span> kodu taşınacak)
            </>
          ) : (
            '.'
          )}
        </p>
      </div>

      <ul className={`${cardClass} divide-y divide-slate-100`}>
        {projects.map((p) => {
          const href = `/admin-panel/proje/${p.id}/basvuru-onay${
            kod ? `?kod=${encodeURIComponent(kod)}` : ''
          }`;
          return (
            <li key={p.id}>
              <Link
                href={href}
                className="flex items-center justify-between gap-3 px-4 py-4 min-h-[56px] text-sm font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <span className="truncate">{p.name}</span>
                <FiArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-center">
        <Link href="/admin-panel" className="text-sm text-blue-700 hover:underline">
          ← Tüm projeler
        </Link>
      </p>
    </div>
  );
}

/** Eski QR linkleri — proje seçimine yönlendirir */
export default function BasvuruOnayRedirectPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Yükleniyor…</div>}>
      <BasvuruOnayProjectPicker />
    </Suspense>
  );
}
