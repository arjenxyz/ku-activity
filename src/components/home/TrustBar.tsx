'use client';

import { motion } from 'framer-motion';

const items = [
  { value: '500+', label: 'Kayıtlı Personel Kapasitesi' },
  { value: '%99.9', label: 'Sistem Uptime Hedefi' },
  { value: '<1s', label: 'Ortalama Yanıt Süresi' },
  { value: '7/24', label: 'Bulut Erişimi' },
];

export function TrustBar() {
  return (
    <section className="py-10 sm:py-12 bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-px">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              className="text-center"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
