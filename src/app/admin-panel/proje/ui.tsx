import { FiCalendar, FiMapPin, FiDollarSign } from 'react-icons/fi';

export const InputWithIcon = ({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) => (
  <div className="relative rounded-md shadow-sm">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      {icon}
    </div>
    <input
      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
      {...props}
    />
  </div>
);

export const DateInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <InputWithIcon icon={<FiCalendar className="h-5 w-5 text-gray-400" />} type="date" {...props} />
);

export const LocationInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <InputWithIcon icon={<FiMapPin className="h-5 w-5 text-gray-400" />} type="text" {...props} />
);

export const BudgetInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="relative rounded-md shadow-sm">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <span className="text-gray-500 sm:text-sm">₺</span>
    </div>
    <input
      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md border p-2"
      type="number"
      {...props}
    />
  </div>
);