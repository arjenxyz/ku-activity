import { HomeHeader } from '@/components/home/HomeHeader';
import { StudentProfileForm } from '@/components/profile/StudentProfileForm';

export default function ProfilePage() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#e7f3fb] px-4 pb-12 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(45,106,246,0.12),_transparent_60%)]" />
      <HomeHeader />
      <div className="relative mx-auto w-full max-w-lg">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D6AF6]">
            Hesabım
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0E1548]">Profil</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            İletişim ve bölüm bilgilerini güncelle. E-posta ve öğrenci numarası kilitlidir.
          </p>
        </header>
        <div className="mt-8">
          <StudentProfileForm />
        </div>
      </div>
    </div>
  );
}
