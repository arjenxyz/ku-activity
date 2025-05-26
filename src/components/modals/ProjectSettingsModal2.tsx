import { useState, useEffect } from 'react';
import type { Project } from '@/types/adminTypes';
import { FiX } from 'react-icons/fi';

type Props = {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProject: Project) => void;
};

export const ProjectSettingsModal = ({ project, isOpen, onClose, onUpdate }: Props) => {
  const [formData, setFormData] = useState<Project>(project);

  // Proje değiştiğinde formu güncelle
  useEffect(() => {
    setFormData(project);
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
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

        <h2 className="font-bold text-lg mb-4">Proje Ayarları</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1" htmlFor="project-name">
              Proje Adı
            </label>
            <input
              id="project-name"
              type="text"
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="project-description">
              Açıklama
            </label>
            <textarea
              id="project-description"
              className="border rounded-lg px-3 py-2 w-full"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex-1"
            >
              Kaydet
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
