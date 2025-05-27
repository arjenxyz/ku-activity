import { FiPlus, FiMapPin, FiArrowUpRight, FiClock, FiCheckCircle } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { Project } from '../../lib/proje/types';
import { motion } from 'framer-motion';

export default function ProjectList({
  projects,
  loading,
  onCreate
}: {
  projects: Project[];
  loading: boolean;
  onCreate?: () => void;
}) {
  const router = useRouter();

  const statusIcons = {
    active: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />,
    planned: <FiClock className="w-4 h-4 text-yellow-600" />,
    completed: <FiCheckCircle className="w-4 h-4 text-indigo-600" />,
    archived: <FiMapPin className="w-4 h-4 text-gray-400" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4 flex justify-end">
          {onCreate && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCreate}
              className="flex items-center gap-2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-indigo-100"
            >
              <FiPlus className="w-5 h-5" />
              <span className="font-medium">Yeni Proje</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white rounded-md border border-gray-200" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-100/50">
            <div className="mx-auto h-32 w-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
              <FiPlus className="w-16 h-16 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Proje Bulunamadı
            </h3>
            {onCreate && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCreate}
                className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                İlk Projeni Oluştur
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Project List */}
      {!loading && projects.length > 0 && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ scale: 1.02 }}
                className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/admin-panel/proje/${project.id}`)}
              >
                {/* Mobile Layout */}
                <div className="md:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    {statusIcons[project.status]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(parseISO(project.start_date), 'dd MMM yyyy', { locale: tr })}
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiMapPin className="w-4 h-4" />
                      <span>{project.location}</span>
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold truncate">{project.name}</h3>
                      {statusIcons[project.status]}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-gray-500">
                        {format(parseISO(project.start_date), 'dd MMM yyyy', { locale: tr })}
                      </span>
                      {project.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiMapPin className="w-4 h-4" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <FiArrowUpRight className="w-6 h-6 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.main>
      )}
    </div>
  );
}
