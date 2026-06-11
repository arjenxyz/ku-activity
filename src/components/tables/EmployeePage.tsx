import { useState, useEffect, useCallback } from 'react';
import type { Employee } from '@/types/adminTypes';
import { fetchEmployees } from '@/api/employees';
import { EmployeeTable } from './EmployeeTable';
import { AddWorkLogModal } from '../modals/AddWorkLogModal';

export const EmployeePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const projectId = localStorage.getItem('currentProjectId') || '';
  const today = new Date();
  const selectedMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  // loadEmployees fonksiyonunu useCallback ile sarmala, bağımlılıkları ekle
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const data = await fetchEmployees(projectId, selectedMonth);
    setEmployees(data.employees);
    setLoading(false);
  }, [projectId, selectedMonth]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleVerifyClick = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    setIsModalOpen(false);
    loadEmployees();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <EmployeeTable
        employees={employees}
        loading={loading}
        onVerify={handleVerifyClick}
        onYevmiyeOpen={() => setIsModalOpen(true)}
      />

      <AddWorkLogModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        employees={employees}
        onSubmit={handleModalSave}
        employeeId={selectedEmployeeId}
        projectId={projectId} // ← Bunu ekle!
      />
    </>
  );
};
