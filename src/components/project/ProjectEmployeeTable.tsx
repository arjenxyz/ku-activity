import Link from 'next/link';
import { FiCheckCircle, FiClock, FiUserPlus, FiUser } from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import { approvalStatusLabel } from '@/lib/work-log';
import type { Employee } from '@/types/adminTypes';

type Props = {
  employees: Employee[];
  loading: boolean;
  projectId: string;
  onVerify: (employeeId: string, employeeName: string) => void;
  verifyingId: string | null;
  onPhotoChange?: (employeeId: string, photoUrl: string | null) => void;
};

function StatusBadge({ status }: { status: Employee['today_attendance_status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
        <FiCheckCircle className="w-3.5 h-3.5" />
        Onaylı
      </span>
    );
  }
  if (status === 'pending_employee') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
        <FiUser className="w-3.5 h-3.5" />
        Personel bekliyor
      </span>
    );
  }
  if (status === 'pending_admin') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
        <FiClock className="w-3.5 h-3.5" />
        Sizin onayınız bekleniyor
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
      <FiClock className="w-3.5 h-3.5" />
      {approvalStatusLabel('none')}
    </span>
  );
}

export function ProjectEmployeeTable({
  employees,
  loading,
  projectId,
  onVerify,
  verifyingId,
  onPhotoChange,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Personel Listesi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Çift onay: yönetici + personel aynı günü onaylayınca yevmiye kesinleşir
          </p>
        </div>
        <Link
          href={`/admin-panel/proje/${projectId}/new`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-md transition-colors"
        >
          <FiUserPlus className="w-4 h-4" />
          Personel Ekle
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left font-semibold text-slate-600 px-4 py-3 w-14">Foto</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3">Ad Soyad</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3 hidden md:table-cell">Pozisyon</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3 hidden sm:table-cell">Günlük Ücret</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3 hidden lg:table-cell">Bu Ay</th>
              <th className="text-left font-semibold text-slate-600 px-6 py-3">Bugün</th>
              <th className="text-right font-semibold text-slate-600 px-6 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Yükleniyor…
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Bu projede henüz personel yok.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const monthDays = emp.monthly_attendance?.filter((d) => d > 0).length ?? 0;
                const status = emp.today_attendance_status ?? 'none';
                const canAdminAct = status !== 'confirmed';

                return (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      {onPhotoChange ? (
                        <EmployeePhotoUpload
                          projectId={projectId}
                          employeeId={emp.id}
                          name={emp.name}
                          photoUrl={emp.photo_url ?? null}
                          onChange={(url) => onPhotoChange(emp.id, url)}
                          compact
                        />
                      ) : (
                        <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-900">
                      {emp.name}
                      <span className="block md:hidden text-xs text-slate-500">{emp.position}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 hidden md:table-cell">
                      {emp.position || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-900 hidden sm:table-cell tabular-nums">
                      ₺{emp.daily_wage.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 hidden lg:table-cell">
                      {monthDays} gün
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {canAdminAct && (
                        <button
                          type="button"
                          disabled={verifyingId === emp.id}
                          onClick={() => onVerify(emp.id, emp.name)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {verifyingId === emp.id
                            ? '...'
                            : status === 'pending_employee'
                              ? 'Düzenle'
                              : 'Yoklama'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
