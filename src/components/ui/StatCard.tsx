// src/components/ui/StatCard.tsx
import type { ReactNode } from 'react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string; // Bu prop zaten dark mode sınıflarını alabiliyor, değişmeyecek
};

export const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  return (
    // Kartın ana kapsayıcısı: bg-white -> dark:bg-gray-800, shadow -> dark:shadow-md
    <div className="bg-white rounded-xl shadow p-4 dark:bg-gray-800 dark:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          {/* Başlık metin rengi: text-gray-500 -> dark:text-gray-400 */}
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {/* Değer metin rengi: text-gray-900 -> dark:text-gray-100 */}
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        {/* İkonun arka planı ve metin rengi 'color' prop'undan geliyor ve page.tsx'te ayarlanmıştı,
            bu yüzden burada bir değişiklik yapmaya gerek yok. */}
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
