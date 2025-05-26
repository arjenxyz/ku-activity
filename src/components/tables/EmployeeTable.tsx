import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import type { Employee } from '@/types/adminTypes';
import { TableHeader, TableCell } from '@/components/ui/Table';

// src/components/tables/EmployeeTable.tsx içindeki Props interface'i
type Props = {
  employees: Employee[];
  loading: boolean;
  onVerify: (employeeId: string) => void;
  onYevmiyeOpen: (employeeId: string) => void;
};
export const EmployeeTable = ({
  employees,
  loading,
  onVerify,
  onYevmiyeOpen
}: Props) => {
  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader className="min-w-[150px]">Ad</TableHeader>
              <TableHeader className="min-w-[100px]">Çalışılan Gün</TableHeader>
              <TableHeader className="min-w-[120px]">Toplam Maaş</TableHeader>
              <TableHeader>Bugün</TableHeader>
              <TableHeader>İşlemler</TableHeader>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                  Kayıtlı personel bulunamadı
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-sm text-gray-500 md:hidden">
                      {emp.monthly_attendance?.filter(d => d > 0).length || 0} Gün
                    </div>
                  </TableCell>
                  
                  <TableCell className="md:table-cell hidden">
                    <div className="font-medium">{emp.total_days}</div>
                    <div className="text-xs text-gray-500">
                      {emp.monthly_attendance?.filter(d => d > 0).length || 0} / 
                      {emp.monthly_attendance?.length || 0} gün
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      ₺ {(emp.daily_wage * (emp.total_days || 0)).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 md:hidden">
                      {emp.total_days} Gün
                    </div>
                  </TableCell>

                  <TableCell>
                    {emp.today_verified ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <FiCheckCircle className="mr-1" /> Onaylı
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <FiXCircle className="mr-1" /> Onaysız
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {!emp.today_verified && (
                      <button
                        onClick={() => onVerify(emp.id)}
                        className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100"
                      >
                        Onayla
                      </button>
                    )}
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
