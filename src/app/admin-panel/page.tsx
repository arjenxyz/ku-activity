'use client';


import { useState, useEffect, useCallback } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiPlus } from 'react-icons/fi';
import ProjectList from './proje/ProjectList';
import ProjectForm from './proje/ProjectForm';
import ProjectFilters, { type ProjectFilter } from './proje/ProjectFilters';
import { fetchProjects, startProjectClosure } from '../lib/proje/projectService';
import type { Project } from '@/types/project';

export default function ProjectPage() {

  const strings = useRegistryStrings('app/admin-panel/page');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [closureTarget, setClosureTarget] = useState<Project | null>(null);
  const [closing, setClosing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchProjects(filter, searchTerm);
      setProjects(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : strings.loadFailed;
      setLoadError(msg);
      console.error('Projeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleStartClosure = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) setClosureTarget(target);
  };

  const confirmClosure = async () => {
    if (!closureTarget) return;
    setClosing(true);
    try {
      await startProjectClosure(closureTarget.id);
      setClosureTarget(null);
      await loadProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : strings.closureFailed);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{strings.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{strings.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setIsFormVisible(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            {strings.newProject}
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
            <span className="block mt-1 text-red-600/80">{strings.adminHint}</span>
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
        onDelete={handleStartClosure}
      />

      {closureTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{strings.closureTitle}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <strong>{closureTarget.name}</strong>
              {strings.closureBody}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={closing}
                onClick={() => setClosureTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium"
              >
                {strings.cancel}
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={confirmClosure}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {closing ? strings.closing : strings.confirmClosure}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
