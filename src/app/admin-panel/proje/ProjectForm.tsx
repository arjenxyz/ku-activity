'use client';

import { useState, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
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
        } catch (err) {
          console.error('Proje bilgileri yüklenirken hata:', err);
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
      let result;
      if (editingId) {
        result = await updateProject(editingId, formData);
      } else {
        result = await createProject(formData);
      }
      console.log('Başarılı:', result);
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Detaylı hata:', {
          message: err.message,
          // err.code veya err.details gibi varsa ekleyebilirsin
        });
        setError(err.message || 'Proje kaydedilemedi. Lütfen tekrar deneyin.');
      } else {
        console.error('Bilinmeyen hata:', err);
        setError('Proje kaydedilemedi. Lütfen tekrar deneyin.');
      }
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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-8 border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">
          {editingId ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-center">
            <FiX className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Proje Adı*
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Proje adını giriniz"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Konum
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Proje konumunu giriniz"
            />
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Başlangıç Tarihi*
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Durum*
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="active">Aktif</option>
              <option value="planned">Planlanan</option>
              <option value="completed">Tamamlanan</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Proje açıklamasını giriniz"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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
