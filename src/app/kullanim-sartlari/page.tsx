import Link from 'next/link';
import { APP_NAME } from '@/lib/brand';
import { cardClass } from '@/components/ui/styles';

export default function LegalPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 px-4 py-10">
      <div className={`mx-auto max-w-2xl ${cardClass} p-6`}>
        <h1 className="text-lg font-bold text-[#0E1548]">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Yasal metinler yeni ürün için güncellenecek. Bu sayfa geçici bir yer tutucudur.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#0E1548] hover:underline">
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
