'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function CTASection() {
  return (
    <section className="py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-800" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Personel yönetiminde dijital dönüşüme hazır mısınız?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Şantiye operasyonlarınızı optimize edin, manuel süreçlerden kurtulun ve zamandan tasarruf edin.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/admin-panel/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-blue-50 shadow-xl transition-all hover:-translate-y-0.5"
            >
              Ücretsiz Kayıt Ol
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center border-2 border-white/40 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              İletişime Geçin
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
