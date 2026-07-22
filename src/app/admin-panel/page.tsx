'use client';


import { useState, useEffect, useCallback } from 'react';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { FiPlus } from 'react-icons/fi';
import ProjectList from './proje/ProjectList';
import ProjectForm from './proje/ProjectForm';
import ProjectFilters, { type ProjectFilter } from './proje/ProjectFilters';
import {
  fetchProjects,
  purgeExpiredProjectsInBackground,
  startProjectClosure,
} from '../lib/proje/projectService';
import type { Project } from '@/types/project';

export default function ProjectPage() {

  const strings = useRegistryStrings('app/admin-panel/page');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectQuota, setProjectQuota] = useState<{ canCreate: boolean } | null>(null);
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
      const { projects: data, quota } = await fetchProjects(filter, searchTerm);
      setProjects(data);
      setProjectQuota(quota);
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

  // Sayfa açılınca bir kez: süresi dolmuş kapanışları arka planda temizle
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { projectsPurged } = await purgeExpiredProjectsInBackground();
      if (cancelled || projectsPurged <= 0) return;
      try {
        const { projects: data, quota } = await fetchProjects(filter, searchTerm);
        if (cancelled) return;
        setProjects(data);
        setProjectQuota(quota);
      } catch {
        /* liste zaten yüklü; sessiz geç */
      }
    })();
    return () => {
      cancelled = true;
    };
    // Yalnızca mount — filtre değişiminde tekrar purge etme
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="space-y-4">
      <div className="rounded-2xl bg-white px-4 py-5 shadow-sm ring-1 ring-black/[0.04] sm:px-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0E1548] sm:text-2xl">{strings.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{strings.subtitle}</p>
          </div>
          <button
            type="button"
            disabled={projectQuota != null && !projectQuota.canCreate}
            onClick={() => {
              setEditingId(null);
              setIsFormVisible(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0E1548] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#152060] disabled:cursor-not-allowed disabled:opacity-50"
            title={projectQuota != null && !projectQuota.canCreate ? strings.newProjectLimitTitle : undefined}
          >
            <FiPlus className="h-4 w-4" />
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
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0E1548]">{strings.closureTitle}</h3>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{closureTarget.name}</strong>
              {strings.closureBody}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={closing}
                onClick={() => setClosureTarget(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-medium"
              >
                {strings.cancel}
              </button>
              <button
                type="button"
                disabled={closing}
                onClick={confirmClosure}
                className="flex-1 rounded-2xl bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
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
