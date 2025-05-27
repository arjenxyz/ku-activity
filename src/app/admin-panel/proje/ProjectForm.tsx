'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiChevronDown } from 'react-icons/fi'; // FiChevronDown eklendi
import { createProject, updateProject, fetchProjects } from '../../lib/proje/projectService';
import type { Project, ProjectFormData } from '../../lib/proje/types';

export default function ProjectForm({
  editingId,
  onSuccess,
  onCancel,
}: {
  editingId: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    location: '',
    start_date: new Date().toISOString().split('T')[0],
    description: '',
    status: 'active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Drop-down durum kontrolü

  useEffect(() => {
    const loadProjectData = async () => {
      if (editingId) {
        try {
          const projects = await fetchProjects();
          const project = projects.find((p: Project) => p.id === editingId);
          if (project) {
            setFormData({
              name: project.name,
              location: project.location || '',
              start_date: project.start_date,
              description: project.description || '',
              status: project.status,
            });
          }
        } catch {
          setError('Proje bilgileri yüklenemedi');
        }
      }
    };

    loadProjectData();
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateProject(editingId, formData);
      } else {
        await createProject(formData);
      }
      onSuccess();
    } catch {
      setError('Proje kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusSelect = (status: "active" | "planned" | "completed" | "archived") => {
    setFormData(prev => ({
      ...prev,
      status,
    }));
    setIsDropdownOpen(false); // Drop-down menüyü kapat
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-8 border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {editingId ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-md flex items-center">
            <FiX className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="space-y-6">
          {/* Proje Adı */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proje Adı*
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Proje adını giriniz"
            />
          </div>

          {/* Durum Drop-down */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Durum*
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center justify-between w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm text-gray-700 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {formData.status === 'active'
                  ? 'Aktif'
                  : formData.status === 'planned'
                  ? 'Planlanan'
                  : formData.status === 'completed'
                  ? 'Tamamlanan'
                  : 'Arşivlenmiş'}
                <FiChevronDown className="w-4 h-4" />
              </button>
              {isDropdownOpen && (
                <ul className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg">
                  <li
                    onClick={() => handleStatusSelect('active')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Aktif
                  </li>
                  <li
                    onClick={() => handleStatusSelect('planned')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Planlanan
                  </li>
                  <li
                    onClick={() => handleStatusSelect('completed')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Tamamlanan
                  </li>
                  <li
                    onClick={() => handleStatusSelect('archived')}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Arşivlenmiş
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Başlangıç Tarihi */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Başlangıç Tarihi*
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Açıklama
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-900 dark:text-gray-100"
              placeholder="Proje açıklamasını giriniz"
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <FiX className="mr-2 h-4 w-4" />
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <FiCheck className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
