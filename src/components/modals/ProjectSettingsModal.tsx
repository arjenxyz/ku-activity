'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Project } from '@/types/adminTypes';
import { FiX, FiTrash2, FiSettings, FiAlertTriangle } from 'react-icons/fi';
import { updateProject, deleteProject } from '@/api/projects';

type Props = {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
  onDelete: () => void;
};

export const ProjectSettingsModal = ({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: Props) => {
  const router = useRouter();

  const [formData, setFormData] = useState<Project>(project);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectStatuses = [
    { value: 'active', label: 'Aktif' },
    { value: 'paused', label: 'Durduruldu' },
    { value: 'completed', label: 'Tamamlandı' },
    { value: 'archived', label: 'Arşivlendi' },
  ] as const;

  useEffect(() => {
    setFormData(project);
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await updateProject(project.id, formData);
      if (!error) {
        onUpdate(formData);
        onClose();
      } else {
        alert('Proje güncellenirken hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleDelete = async () => {
  setIsSubmitting(true);
  try {
    const { error } = await deleteProject(project.id);
    if (!error) {
      onDelete();       // Üst komponentteki temizleme işlemleri yapılır
      onClose();        // Modal kapatılır
      router.replace('/admin-panel/');  // Geri gelmeyi engelleyecek şekilde yönlendirme yapılır
    } else {
      alert('Projeyi silerken hata oluştu.');
    }
  } finally {
    setIsSubmitting(false);
  }
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-700"
          aria-label="Kapat"
        >
          <FiX />
        </button>

        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <FiSettings className="text-xl" />
          Proje Ayarları
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Proje Adı</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Açıklama</label>
            <textarea
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Proje Durumu</label>
            <select
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.status || 'active'}
              onChange={(e) => {
                const value = e.target.value;
                if (
                  projectStatuses.some((status) => status.value === value)
                ) {
                  setFormData({
                    ...formData,
                    status: value as typeof projectStatuses[number]['value'],
                  });
                }
              }}
            >
              {projectStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg flex-1"
            >
              Vazgeç
            </button>
          </div>
        </form>

        <div className="mt-8 border-t pt-4">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2 rounded-lg"
            >
              <FiTrash2 /> Projeyi Sil
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600">
                <FiAlertTriangle /> Bu işlem geri alınamaz!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
                >
                  {isSubmitting ? 'Siliniyor...' : 'Evet, Sil'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg flex-1"
                >
                  İptal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

  
