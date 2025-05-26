import { FiPlus, FiArrowUpRight, FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { Project } from '../../lib/proje/types';

type CategoryKey = 'devam-ediyor' | 'tamamlandi' | 'iptal';
type ProjectStatus = 'active' | 'completed' | 'planned' | 'archived';

const statusCategoryMap: Record<ProjectStatus, CategoryKey> = {
  active: 'devam-ediyor',
  completed: 'tamamlandi',
  planned: 'devam-ediyor',
  archived: 'iptal'
};

const categoryConfig = {
  'devam-ediyor': {
    label: 'Devam Ediyor',
    gradient: 'from-amber-100 to-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700'
  },
  tamamlandi: {
    label: 'Tamamlandı',
    gradient: 'from-emerald-100 to-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700'
  },
  iptal: {
    label: 'İptal Edildi',
    gradient: 'from-rose-100 to-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700'
  }
} satisfies Record<CategoryKey, {
  label: string;
  gradient: string;
  border: string;
  text: string;
}>;

export default function ProjectList({
  projects,
  loading,
  onCreate,
  onEdit,
  onDelete
}: {
  projects: Project[];
  loading: boolean;
  onCreate?: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();

  // Proje kategorizasyonu
  const categorizedProjects = Object.entries(categoryConfig).reduce((acc, [key]) => {
    acc[key as CategoryKey] = [];
    return acc;
  }, {} as Record<CategoryKey, Project[]>);

  projects.forEach(project => {
    const status = project.status as ProjectStatus;
    const category = statusCategoryMap[status] || 'iptal';
    categorizedProjects[category].push(project);
  });

  // Filtreleme
  const filteredCategories = (Object.keys(categoryConfig) as CategoryKey[]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projeler</h1>
            <p className="text-sm text-gray-500 mt-1">
              {projects.length} aktif proje
            </p>
          </div>
          {onCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all"
            >
              <FiPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Yeni Proje</span>
            </button>
          )}
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="mx-auto h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <FiPlus className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz proje bulunmamaktadır
            </h3>
            <p className="text-gray-500 mb-6">
              Yeni bir proje oluşturarak başlayın
            </p>
            {onCreate && (
              <button
                onClick={onCreate}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                İlk Projeni Oluştur
              </button>
            )}
          </div>
        </div>
      )}

      {/* Project List */}
      {!loading && projects.length > 0 && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {filteredCategories.map(categoryKey => {
              const category = categoryConfig[categoryKey];
              const projects = categorizedProjects[categoryKey];

              return (
                <section key={categoryKey} className="space-y-4">
                  {/* Category Header */}
                  <div className={`bg-gradient-to-r ${category.gradient} ${category.border} border-l-4 p-4 rounded-lg`}>
                    <h2 className={`text-lg font-semibold ${category.text}`}>
                      {category.label} <span className="text-gray-500">({projects.length})</span>
                    </h2>
                  </div>

                  {/* Mobile Cards */}
                  <div className="sm:hidden space-y-3">
                    {projects.map(project => (
                      <article 
                        key={project.id}
                        className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${category.gradient}`}>
                            <span className={`text-xl font-medium ${category.text}`}>
                              {project.name[0].toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {project.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(parseISO(project.start_date), 'dd MMM yyyy', { locale: tr })}
                            </p>
                            {project.location && (
                              <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                                <FiMapPin className="w-4 h-4" />
                                <span>{project.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => router.push(`/admin-panel/proje/${project.id}`)}
                            className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                          >
                            Detayları Görüntüle
                            <FiArrowUpRight className="w-4 h-4" />
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(project.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(project.id);
                              }}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Proje Adı</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Başlangıç</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Lokasyon</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {projects.map(project => (
                          <tr 
                            key={project.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/admin-panel/proje/${project.id}`)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.gradient}`}>
                                  <span className={`font-medium ${category.text}`}>
                                    {project.name[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{project.name}</div>
                                  {project.description && (
                                    <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                                      {project.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {format(parseISO(project.start_date), 'dd MMM yyyy', { locale: tr })}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {project.location || '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(project.id);
                                  }}
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                                >
                                  <FiEdit2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(project.id);
                                  }}
                                  className="p-2 hover:bg-rose-50 rounded-lg text-gray-500 hover:text-rose-600"
                                >
                                  <FiTrash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}
