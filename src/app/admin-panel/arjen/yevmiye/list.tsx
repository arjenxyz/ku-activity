'use client';

import strings from '@json/src/app/admin-panel/arjen/yevmiye/list.json';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { formatString } from '@/lib/strings/format';
import { FiTrash2 } from 'react-icons/fi';

interface Employee {
  id: string;
  name: string;
}

interface WorkLog {
  id: string;
  employee_id: string;
  employee: Employee | null;
  date: string;
  amount: number;
  description: string | null;
}

type RawEmployee = { id: string; name: string } | null | undefined;
type RawWorkLog = {
  id: string;
  employee_id: string;
  date: string;
  amount: number;
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

export default function WorkLogsList() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('work_logs')
      .select('id, employee_id, date, amount, description, employee:employee_id(id, name)')
      .order('date', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setLogs(
        (data ?? []).map((log: RawWorkLog): WorkLog => ({
          id: String(log.id),
          employee_id: String(log.employee_id),
          date: String(log.date),
          amount: Number(log.amount),
          description: log.description !== undefined && log.description !== null ? String(log.description) : null,
          employee: extractEmployee(log.employee),
        }))
      );
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm(strings.confirmDelete)) return;
    const { error } = await supabase.from('work_logs').delete().eq('id', id);
    if (error) alert(formatString(strings.deleteError, { message: error.message }));
    else fetchLogs();
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
                <th className="px-2 py-1 border">{strings.colDescription}</th>
                <th className="px-2 py-1 border">{strings.colDelete}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{log.employee?.name || strings.emptyValue}</td>
                  <td className="border px-2 py-1">{log.date}</td>
                  <td className="border px-2 py-1">{log.amount === 1 ? strings.fullDay : strings.halfDay}</td>
                  <td className="border px-2 py-1">{log.description || strings.emptyValue}</td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      className="text-red-600 hover:bg-red-50 rounded p-1"
                      onClick={() => handleDelete(log.id)}
                      title={strings.deleteRecordTitle}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">
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
