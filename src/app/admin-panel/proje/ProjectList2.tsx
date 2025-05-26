import { FiPlus, FiArrowRight } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { Project } from '../../lib/proje/types';

type CategoryConfig = {
  status: string;
  label: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
};

const categoryConfig: CategoryConfig[] = [
  { 
    status: 'active', 
    label: 'Aktif Projeler',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  { 
    status: 'planned', 
    label: 'Planlanan Projeler',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700'
  },
  { 
    status: 'completed', 
    label: 'Tamamlanan Projeler',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
  { 
    status: 'archived', 
    label: 'Arşivlenen Projeler',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700'
  }
];

export default function ProjectList({
  projects,
  loading,
  filter,
  onCreate,
   onEdit,
  onDelete
}: {
  projects: Project[];
  loading: boolean;
  filter: string;
  onCreate?: () => void;
  onEdit: (id: string) => void;
  onDelete: () => Promise<void>;
}) {
  const router = useRouter();

  const categorizedProjects = projects.reduce((acc, project) => {
    const category = categoryConfig.find(c => c.status === project.status) || {
      status: 'other',
      label: 'Diğer Projeler',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700'
    };

    if (!acc[category.status]) {
      acc[category.status] = {
        ...category,
        projects: []
      };
    }
    acc[category.status].projects.push(project);
    return acc;
  }, {} as Record<string, CategoryConfig & { projects: Project[] }>);

  const filteredCategories = categoryConfig
    .filter(category => 
      filter === 'all' || 
      category.status === filter ||
      (filter === 'archived' && category.status === 'archived')
    )
    .filter(category => categorizedProjects[category.status]?.projects?.length > 0);

  const handleProjectSelect = (projectId: string) => {
    router.push(`/admin-panel/proje/${projectId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Proje Listesi</h2>
          <p className="text-sm text-gray-500 mt-1">
            Toplam {projects.length} proje • {filteredCategories.length} kategori
          </p>
        </div>
        {onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FiPlus className="mr-2" />
            Yeni Proje
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            Henüz proje yok
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Yeni bir proje oluşturarak başlayın
          </p>
          {onCreate && (
            <button
              onClick={onCreate}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <FiPlus className="mr-2" />
              Yeni Proje Oluştur
            </button>
          )}
        </div>
      )}

      {/* Kategorize edilmiş proje listesi */}
      {!loading && projects.length > 0 && (
        <div className="divide-y divide-gray-200">
          {filteredCategories.map((category) => (
            <section 
              key={category.status}
              className={`${category.bgColor} border-b ${category.borderColor}`}
            >
              <div className="px-6 py-3">
                <h3 className={`text-sm font-semibold ${category.textColor}`}>
                  {category.label} ({categorizedProjects[category.status].projects.length})
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    {categorizedProjects[category.status].projects.map((project) => (
                      <tr 
                        key={project.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleProjectSelect(project.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${category.bgColor.replace('bg-', 'bg-opacity-20 ')}`}>
                              <span className={`${category.textColor} font-medium`}>
                                {project.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {project.name}
                              </div>
                              {project.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {project.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {project.location || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {format(parseISO(project.start_date), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProjectSelect(project.id);
                            }}
                            className={`inline-flex items-center px-3 py-1 rounded-md transition-colors ${category.bgColor} hover:opacity-90`}
                          >
                            <FiArrowRight className={`mr-1 ${category.textColor}`} />
                            <span className={category.textColor}>Yönet</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}