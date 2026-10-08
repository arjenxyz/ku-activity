import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { cardClass } from '@/components/ui/styles';

export default function TeamPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10">
      <div className={`mx-auto max-w-lg ${cardClass} p-6 sm:p-8`}>
        <Link href="/" className="mb-6 flex items-center gap-2">
          <BrandMark size="sm" />
          <span className="text-sm font-bold text-[#0E1548]">{APP_NAME}</span>
        </Link>
        <h1 className="text-xl font-bold text-[#0E1548]">Ekip</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Şifre sıfırlama ve kayıt onayı için ekiple görüş. Yanında öğrenci kimlik kartın olsun.
        </p>
        <ol className="mt-6 space-y-3 text-sm text-slate-700">
          <li>Kim olduğunu ve e-postanı ekibe söyle.</li>
          <li>Ekip sana bir kod veya QR verir.</li>
          <li>Kodu şifre sıfırlama ekranına yazıp yeni şifreni oluştur.</li>
        </ol>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-[#2D6AF6] hover:underline">
          Şifre sıfırlamaya dön
        </Link>
      </div>
    </div>
  );
}
