import { HomeHeader } from '@/components/home/HomeHeader';
import { StudentProfileForm } from '@/components/profile/StudentProfileForm';

export default function ProfilePage() {
  return (
    <div className="min-h-[100dvh] bg-[#e7f3fb] px-4 pb-10 pt-[calc(var(--home-chrome-h,4.5rem)+2rem)] text-slate-900 sm:px-8">
      <HomeHeader />
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-center text-2xl font-semibold text-[#0E1548]">Profil</h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500">
          İletişim ve bölüm bilgilerini güncelle. Öğrenci numarası kilitlidir.
        </p>
        <div className="mt-8">
          <StudentProfileForm />
        </div>
      </div>
    </div>
  );
}
