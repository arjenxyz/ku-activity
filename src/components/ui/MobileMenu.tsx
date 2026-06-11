import { FiX } from 'react-icons/fi';
import { ActionButton, type ActionButtonProps } from './ActionButton';

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  buttons: ActionButtonProps[];
};

export const MobileMenu = ({ open, onClose, buttons }: MobileMenuProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <aside className="relative bg-white w-4/5 max-w-xs h-full ml-auto rounded-l-3xl shadow-xl p-6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Menü</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Menüyü kapat"
          >
            <FiX size={28} />
          </button>
        </div>

        {/* Button List */}
        <nav className="flex flex-col gap-4">
          {buttons.map((btn) => (
            <ActionButton
              key={btn.text}
              {...btn}
              className="w-full text-left px-4 py-3 rounded-lg"
              onClick={() => {
                btn.onClick();
                onClose();
              }}
            />
          ))}
        </nav>
      </aside>
    </div>
  );
};
