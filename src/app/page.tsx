import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME, APP_TAGLINE_TR } from '@/lib/brand';
import { btnPrimary, btnSecondary, cardClass } from '@/components/ui/styles';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-10">
        <div className={`${cardClass} p-8 text-center`}>
          <div className="mx-auto mb-5 flex justify-center">
            <BrandMark size="lg" className="ring-2 ring-[#0E1548]/10" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#0E1548]">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-slate-600">{APP_TAGLINE_TR}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className={btnPrimary}>
              Giriş yap
            </Link>
            <Link href="/student" className={btnSecondary}>
              Öğrenci paneli
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
