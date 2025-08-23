
// app/[locale]/services/page.tsx
import { Brain, NotebookPen, Hammer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from "next/image";


export default function ServicesPage() {
  const t = useTranslations('ServicesPage'); 

  return (
    <main>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl mb-12 text-center">
            {t('title')}
          </h1>
            <div className="relative w-full h-92 mb-6 rounded-lg overflow-hidden">
                    <Image
                      src="/images/lotus_piscine_organique.jpg"
                      alt="Piscine Organique"
                      fill
                      className="object-cover"
                      unoptimized
                    />
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent"></div>
            </div>
            <div className="bg-green-50 rounded-xl p-8 mb-12 shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('onlineTrainingTitle')}
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                {t('onlineTrainingDescription')}
              </p>
              <a
                href="/courses"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition-colors"
              >
                {t('discoverOnlineTraining')}
              </a>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Conseils et Conception */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-md bg-green-500 text-white flex-shrink-0">
                  <Brain className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('consulting')}
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t.rich('consultingDescription', {
                    br: () => <br></br>,
                  })}
              </p>
            </div>

            {/* Formation */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-md bg-green-500 text-white flex-shrink-0">
                  <NotebookPen className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('training')}
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t.rich('trainingDescription', {
                    br: () => <br></br>,
                  })}
              </p>
            </div>

            {/* Accompagnement à la construction */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-md bg-green-500 text-white flex-shrink-0">
                  <Hammer className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('support')}
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {t.rich('supportDescription', {
                  br: () => <br />,
                  })}
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
