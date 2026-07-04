
import { FiTrash2, FiList } from 'react-icons/fi';
import type { Deduction } from '@/types/adminTypes';
import { TableHeader, TableCell } from '@/components/ui/Table';
import strings from '@json/src/components/tables/DeductionTable.json';

type Props = {
  deductions: Deduction[];
  loading: boolean;
  onDelete: (deductionId: string) => Promise<void>;
};

export const DeductionTable = ({
  deductions,
  loading,
  onDelete
}: Props) => {
  return (
    <div className="border rounded-xl mt-6">
      <h3 className="bg-gray-100 px-4 py-2 flex items-center gap-2 font-semibold">
        <FiList /> {strings.title}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-50">
              <TableHeader>{strings.workerHeader}</TableHeader>
              <TableHeader>{strings.dateHeader}</TableHeader>
              <TableHeader>{strings.typeHeader}</TableHeader>
              <TableHeader>{strings.amountHeader}</TableHeader>
              <TableHeader>{strings.descriptionHeader}</TableHeader>
              <TableHeader>{strings.deleteHeader}</TableHeader>
            </tr>
          </thead>
          
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-5">{strings.loading}</td>
              </tr>
            ) : deductions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-5 text-gray-400">
                  {strings.empty}
                </td>
              </tr>
            ) : (
              deductions.map(ded => (
                <tr key={ded.id} className="hover:bg-gray-50">
                  <TableCell>{ded.employee?.name || '-'}</TableCell>
                  <TableCell>{ded.date}</TableCell>
                  <TableCell>
                    <span className="capitalize">
                      {ded.type === 'advance' ? strings.advanceType : strings.deductionType}
                    </span>
                  </TableCell>
                  <TableCell>₺ {ded.amount.toLocaleString()}</TableCell>
                  <TableCell>{ded.description || '-'}</TableCell>
                  <TableCell>
                    <div className="text-center">
                      <button
                        onClick={() => onDelete(ded.id)}
                        className="text-red-600 hover:bg-red-50 rounded p-1"
                        title={strings.deleteTitle}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
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
