import { useEffect, useState } from 'react';
import { FiX, FiList } from 'react-icons/fi';
import type { Employee } from '@/types/adminTypes';
import { createWorkLog } from '@/api/workLogs';

type Props = {
  employeeId?: string;  // opsiyonel olabilir
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  employees: Employee[];
  projectId: string;   // zorunlu
};

export const AddWorkLogModal = ({
  isOpen,
  onClose,
  employees,
  onSubmit,
  employeeId,
  projectId,
}: Props) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    amount: 1,
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employeeId) {
      setFormData((prev) => ({ ...prev, employee_id: employeeId }));
    }
  }, [employeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await createWorkLog({
      employee_id: formData.employee_id,
      date: formData.date,
      amount: formData.amount,
      description: formData.description,
      project_id: projectId,
    });

    if (!error) {
      onSubmit();
      onClose();
      setFormData({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: 1,
        description: '',
      });
    } else {
      alert('Kayıt sırasında bir hata oluştu.');
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-700"
        >
          <FiX />
        </button>

        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FiList /> Yevmiye Kaydı Ekle
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Çalışan</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
              required
            >
              <option value="">Seçiniz</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Tarih</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Çalışma Tipi</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: Number(e.target.value) })
              }
            >
              <option value={1}>Tam Gün</option>
              <option value={0.5}>Yarım Gün</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Açıklama</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg flex-1"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
