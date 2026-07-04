import strings from '@json/src/app/admin-panel/arjen/avans/list.json';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { formatString } from '@/lib/strings/format';
import { FiTrash2 } from 'react-icons/fi';

interface Employee {
  id: string;
  name: string;
}

interface Deduction {
  id: string;
  employee_id: string;
  employee: Employee | null;
  date: string;
  type: string;
  amount: number;
  description: string | null;
}

type RawEmployee = { id: string | number; name: string } | null | undefined;
type RawDeduction = {
  id: string | number;
  employee_id: string | number;
  date: string;
  type: string;
  amount: number | string;
  description: string | null;
  employee: RawEmployee | RawEmployee[];
};

function extractEmployee(employeeField: RawEmployee | RawEmployee[]): Employee | null {
  if (Array.isArray(employeeField) && employeeField.length > 0) {
    const emp = employeeField[0];
    if (emp && typeof emp === 'object' && 'id' in emp && 'name' in emp) {
      return {
        id: String(emp.id),
        name: String(emp.name),
      };
    }
    return null;
  }
  if (employeeField && typeof employeeField === 'object' && 'id' in employeeField && 'name' in employeeField) {
    return {
      id: String(employeeField.id),
      name: String(employeeField.name),
    };
  }
  return null;
}

export default function DeductionsList() {
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeductions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('deductions')
      .select('id, employee_id, date, type, amount, description, employee:employee_id(id, name)')
      .order('date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      const normalized: Deduction[] = (data ?? []).map((d: RawDeduction): Deduction => ({
        id: String(d.id),
        employee_id: String(d.employee_id),
        date: String(d.date),
        type: String(d.type),
        amount: Number(d.amount),
        description: d.description !== undefined && d.description !== null ? String(d.description) : null,
        employee: extractEmployee(d.employee),
      }));
      setDeductions(normalized);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeductions();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm(strings.confirmDelete)) return;
    const { error } = await supabase.from('deductions').delete().eq('id', id);
    if (error) alert(formatString(strings.deleteError, { message: error.message }));
    else fetchDeductions();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-xl font-bold mb-4">{strings.title}</h2>
      {loading ? (
        <div>{strings.loading}</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 border">{strings.colEmployee}</th>
                <th className="px-2 py-1 border">{strings.colDate}</th>
                <th className="px-2 py-1 border">{strings.colType}</th>
                <th className="px-2 py-1 border">{strings.colAmount}</th>
                <th className="px-2 py-1 border">{strings.colDescription}</th>
                <th className="px-2 py-1 border">{strings.colDelete}</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map(ded => (
                <tr key={ded.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{ded.employee?.name || strings.emptyValue}</td>
                  <td className="border px-2 py-1">{ded.date}</td>
                  <td className="border px-2 py-1">
                    {ded.type === 'advance' ? strings.typeAdvance : strings.typeSubcontractorCut}
                  </td>
                  <td className="border px-2 py-1">{ded.amount} ₺</td>
                  <td className="border px-2 py-1">{ded.description || strings.emptyValue}</td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      className="text-red-600 hover:bg-red-50 rounded p-1"
                      onClick={() => handleDelete(ded.id)}
                      title={strings.deleteRecordTitle}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {deductions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    {strings.noRecords}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
