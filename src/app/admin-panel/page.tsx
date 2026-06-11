'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FiPlus, FiUserCheck } from 'react-icons/fi';
import ProjectList from './proje/ProjectList';
import ProjectForm from './proje/ProjectForm';
import ProjectFilters, { type ProjectFilter } from './proje/ProjectFilters';
import { fetchProjects, deleteProject } from '../lib/proje/projectService';
import type { Project } from '@/types/project';

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchProjects(filter, searchTerm);
      setProjects(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Projeler yüklenemedi';
      setLoadError(msg);
      console.error('Projeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDeleteProject = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) setDeleteTarget(target);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setDeleteTarget(null);
      await loadProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Proje silinemedi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Projeler</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Şantiyelerinizi oluşturun, düzenleyin ve yönetin
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin-panel/basvuru-onay"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium"
          >
            <FiUserCheck className="w-4 h-4" />
            Başvuru Onayı
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setIsFormVisible(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Yeni Proje
          </button>
        </div>
      </div>

      <ProjectFilters
        searchTerm={searchTerm}
        filter={filter}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilter}
      />

      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          {loadError}
          {loadError.includes('yönetici') && (
            <span className="block mt-1 text-red-600/80">
              Giriş yaptığınızdan ve profiles tablosunda admin kaydınızın olduğundan emin olun.
            </span>
          )}
        </div>
      )}

      {isFormVisible && (
        <ProjectForm
          editingId={editingId}
          onSuccess={() => {
            setIsFormVisible(false);
            setEditingId(null);
            loadProjects();
          }}
          onCancel={() => {
            setIsFormVisible(false);
            setEditingId(null);
          }}
        />
      )}

      <ProjectList
        projects={projects}
        loading={loading}
        onEdit={(id) => {
          setEditingId(id);
          setIsFormVisible(true);
        }}
        onDelete={handleDeleteProject}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Projeyi sil?</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <strong>{deleteTarget.name}</strong> ve bağlı tüm personel, yevmiye ve kesinti kayıtları kalıcı olarak silinir.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {deleting ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
