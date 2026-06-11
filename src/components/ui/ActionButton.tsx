import type { ReactNode } from 'react';

export type ActionButtonProps = {
  icon: ReactNode;
  text: string;
  onClick: () => void;
  color: string;
  className?: string;  // className opsiyonel olarak eklendi
};

export const ActionButton = ({ icon, text, onClick, color, className = '' }: ActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${color} w-full md:w-auto justify-center ${className}`}
    >
      {icon}
      <span>{text}</span>
    </button>
  );
};
