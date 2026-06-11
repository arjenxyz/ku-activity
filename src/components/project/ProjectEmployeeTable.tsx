import Link from 'next/link';
import { FiCheckCircle, FiXCircle, FiUserPlus } from 'react-icons/fi';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { EmployeePhotoUpload } from '@/components/employee/EmployeePhotoUpload';
import type { Employee } from '@/types/adminTypes';

type Props = {
  employees: Employee[];
  loading: boolean;
  projectId: string;
  onVerify: (employeeId: string) => void;
  verifyingId: string | null;
  onPhotoChange?: (employeeId: string, photoUrl: string | null) => void;
};

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
          <p className="text-xs text-slate-500 mt-0.5">Bu projeye kayıtlı personel</p>
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
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  Yükleniyor...
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-slate-600 font-medium">Henüz personel kaydı yok</p>
                  <Link
                    href={`/admin-panel/proje/${projectId}/new`}
                    className="inline-block mt-3 text-sm text-blue-700 hover:underline"
                  >
                    İlk personeli ekleyin
                  </Link>
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const monthDays = emp.monthly_attendance?.filter((d) => d > 0).length ?? 0;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      {onPhotoChange ? (
                        <EmployeePhotoUpload
                          projectId={projectId}
                          employeeId={emp.id}
                          name={emp.name}
                          photoUrl={emp.photo_url}
                          compact
                          onChange={(url) => onPhotoChange(emp.id, url)}
                        />
                      ) : (
                        <EmployeeAvatar name={emp.name} photoUrl={emp.photo_url} size="sm" />
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-slate-900">{emp.name}</span>
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
                      {emp.today_verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          Onaylı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                          <FiXCircle className="w-3.5 h-3.5" />
                          Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {!emp.today_verified && (
                        <button
                          type="button"
                          disabled={verifyingId === emp.id}
                          onClick={() => onVerify(emp.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          {verifyingId === emp.id ? '...' : 'Yevmiye Onayla'}
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
