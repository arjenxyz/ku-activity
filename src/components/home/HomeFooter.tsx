'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { SkyTwinkleStars } from '@/components/home/SkyTwinkleStars';
import { APP_NAME, APP_TAGLINE_TR, DEFAULT_DEVELOPER_NAME } from '@/lib/brand';
import { SUPPORT_EMAIL, verificationCodeMailto } from '@/lib/support-email';

export function HomeFooter() {
  return (
    <footer id="contact" className="bg-[#0E1548] text-white">
      <div className="relative w-full overflow-hidden">
        <Image
          src="/footer.png"
          alt="CrewLedger şantiye ekibi"
          width={1842}
          height={854}
          className="block h-auto w-full object-cover object-bottom"
          sizes="100vw"
        />
        <SkyTwinkleStars maskSolidEnd={24} maskFadeEnd={38} maxTopPercent={30} density={44} />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#0E1548] sm:h-16"
          aria-hidden
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center space-x-3">
              <BrandMark size="lg" />
              <div>
                <h3 className="text-xl font-bold">{APP_NAME}</h3>
                <p className="text-slate-400 text-sm">{APP_TAGLINE_TR}</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md">
              {APP_NAME}, <strong className="text-white">{DEFAULT_DEVELOPER_NAME}</strong> tarafından geliştirilen
              gönüllülük esaslı personel takip platformudur. Herhangi bir şirkete bağlı değildir;
              kullanım zorunlu değildir.
            </p>
            <div className="flex gap-3">
              {['twitter', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-700 hover:border-slate-600 transition-colors"
                  aria-label={social}
                >
                  <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    {social === 'twitter' ? (
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    ) : (
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    )}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">İletişim</h4>
            <div className="space-y-3 text-sm">
              <a href={verificationCodeMailto()} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {SUPPORT_EMAIL} — doğrulama kodu
              </a>
              <p className="flex items-center gap-2 text-slate-300">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +90 212 555 01 02
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maslak Mahallesi, İstanbul
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">© 2026 {APP_NAME} · {DEFAULT_DEVELOPER_NAME}</p>
          <div className="flex flex-wrap justify-center gap-5 text-sm">
            <Link href="/gizlilik" className="text-slate-400 hover:text-white transition-colors">Gizlilik</Link>
            <Link href="/kullanim-sartlari" className="text-slate-400 hover:text-white transition-colors">Kullanım Şartları</Link>
            <Link href="/kvkk" className="text-slate-400 hover:text-white transition-colors">KVKK</Link>
            <a href="#proje-hakkinda" className="text-slate-400 hover:text-white transition-colors">Gönüllülük Projesi</a>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
    </footer>
  );
}
