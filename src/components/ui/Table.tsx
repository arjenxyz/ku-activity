// components/ui/Table.tsx
import { HTMLAttributes, ThHTMLAttributes } from 'react';

// TableHeader için güncellenmiş props
type TableHeaderProps = {
  children: React.ReactNode;
} & ThHTMLAttributes<HTMLTableCellElement>;

export const TableHeader = ({ children, className, ...props }: TableHeaderProps) => (
  <th 
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} 
    {...props}
  >
    {children}
  </th>
);

// TableCell için güncellenmiş props
type TableCellProps = {
  children: React.ReactNode;
} & HTMLAttributes<HTMLTableCellElement>;

export const TableCell = ({ children, className, ...props }: TableCellProps) => (
  <td 
    className={`px-6 py-4 whitespace-nowrap ${className}`} 
    {...props}
  >
    {children}
  </td>
);