import { StaffCheckInClient } from '@/components/checkin/StaffCheckInClient';

export default function AdminCheckInPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-[#0E1548]">Check-in</h1>
        <p className="mt-1 text-sm text-slate-600">Tüm etkinliklerde QR ile yoklama al.</p>
      </div>
      <StaffCheckInClient />
    </div>
  );
}
