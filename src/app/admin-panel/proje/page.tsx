'use client';

import { useState, useEffect } from 'react';
import ProjectList from '../proje/ProjectList';
import ProjectForm from '../proje/ProjectForm';
import ProjectFilters from '../proje/ProjectFilters';
import { fetchProjects } from '../../lib/proje/projectService';
import type { Project } from '../../lib/proje/types';

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'planned'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await fetchProjects(filter, searchTerm);
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [filter, searchTerm]);

  const handleAddProject = () => {
    setEditingId(null);
    setIsFormVisible(true);
  };

  const handleEditProject = (id: string) => {
    setEditingId(id);
    setIsFormVisible(true);
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setEditingId(null);
    fetchProjects(filter, searchTerm).then(setProjects);
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setEditingId(null);
  };

  // id kullanılmadığında void id; satırı eklenir!
  const handleDeleteProject = async (id: string) => {
    void id; // <-- LINT HATASINI ENGELLER
    fetchProjects(filter, searchTerm).then(setProjects);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Header onAddProject={handleAddProject} />

        <ProjectFilters
          searchTerm={searchTerm}
          filter={filter}
          onSearchChange={setSearchTerm}
          onFilterChange={setFilter}
        />

        {isFormVisible && (
          <ProjectForm
            editingId={editingId}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

        <ProjectList
          projects={projects}
          loading={loading}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
        />
      </div>
    </div>
  );
}

const Header = ({ onAddProject }: { onAddProject: () => void }) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Proje Yönetimi</h1>
      <p className="mt-2 text-sm text-gray-600">Tüm projelerinizi tek bir yerden yönetin</p>
    </div>
    <button
      onClick={onAddProject}
      className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
    >
      Yeni Proje
    </button>
  </div>
);
