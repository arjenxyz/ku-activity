// /pages/index.js
export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="min-h-screen relative bg-gradient-to-br from-indigo-900 via-blue-800 to-indigo-700 text-white px-6 md:px-20 py-28 flex flex-col md:flex-row items-center justify-between overflow-hidden">
        <div className="max-w-2xl space-y-6 z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indigo-50 to-blue-100 bg-clip-text text-transparent">
            Modern Personel Yönetimi <br />
            <span className="text-indigo-200">ArjenDev</span> ile <br />
            Artık Çok Daha Kolay
          </h1>
          <p className="text-lg text-indigo-200/90 max-w-xl">
            Maaş hesaplamaları, çalışma takibi ve raporlamalar tek platformda. 
            Zamandan tasarruf edin, verimliliği artırın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <a
              href="/admin-panel/login"
              className="bg-white/90 text-indigo-900 px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H3a1 1 0 100 2h7.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Yönetici Girişi
            </a>
            <a
              href="/personnel-panel"
              className="border-2 border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/10 hover:border-white/40 transition-all duration-300 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
              </svg>
              Personel Girişi
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

