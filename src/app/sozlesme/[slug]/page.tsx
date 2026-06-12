'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';

type ContractView = {
  title: string;
  contentHtml: string;
  version: number;
  acceptedAt: string;
  fullName: string;
  email: string;
};

function ContractViewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const token = searchParams.get('t') ?? '';
  const fromPersonnel = searchParams.get('from') === 'personnel';
  const backHref = '/personnel-panel?tab=settings';

  const [contract, setContract] = useState<ContractView | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Geçersiz bağlantı.');
      return;
    }
    fetch(`/api/public/contracts/view?slug=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setContract(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Yüklenemedi'));
  }, [slug, token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-500">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 print-area">
      <div className="max-w-3xl mx-auto px-4 py-8 print:py-4">
        <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
          {fromPersonnel && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
            >
              <FiArrowLeft className="w-4 h-4" />
              Ayarlara dön
            </Link>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm"
          >
            <FiPrinter className="w-4 h-4" />
            Yazdır / PDF kaydet
          </button>
        </div>

        <header className="border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          <p className="text-sm text-slate-500 mt-2">
            Sürüm {contract.version} · Onaylayan: {contract.fullName} ({contract.email}) ·{' '}
            {new Date(contract.acceptedAt).toLocaleString('tr-TR')}
          </p>
        </header>

        <article
          className="prose prose-slate max-w-none contract-body"
          dangerouslySetInnerHTML={{ __html: contract.contentHtml }}
        />

        <footer className="mt-8 pt-4 border-t text-xs text-slate-500 print:mt-4">
          <p>Bu belge dijital onay kaydı ile ilişkilidir. Saklamanız önerilir.</p>
        </footer>
      </div>
    </div>
  );
}

export default function ContractPublicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor…</div>}>
      <ContractViewContent />
    </Suspense>
  );
}
