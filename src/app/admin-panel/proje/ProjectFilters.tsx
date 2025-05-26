import { FiSearch } from 'react-icons/fi';

type ProjectFilter = 'all' | 'active' | 'completed' | 'planned';

export default function ProjectFilters({
  searchTerm,
  filter,
  onSearchChange,
  onFilterChange,
}: {
  searchTerm: string;
  filter: ProjectFilter;
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: ProjectFilter) => void;
}) {
  return (
    <div className="bg-white shadow rounded-lg p-4 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Proje Ara
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="search"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 py-2 sm:text-sm border-gray-300 rounded-md border"
              placeholder="Proje adına göre ara..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
            Duruma Göre Filtrele
          </label>
          <select
            id="filter"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm rounded-md border"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as ProjectFilter)}
          >
            <option value="all">Tüm Projeler</option>
            <option value="active">Aktif Projeler</option>
            <option value="planned">Planlanan Projeler</option>
            <option value="completed">Tamamlanan Projeler</option>
          </select>
        </div>
      </div>
    </div>
  );
}
