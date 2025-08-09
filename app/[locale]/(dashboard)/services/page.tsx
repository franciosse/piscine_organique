
// app/[locale]/services/page.tsx
import { Brain, NotebookPen, Hammer } from 'lucide-react';
import { useTranslations } from 'next-intl';
// À placer à la fin de app/[locale]/services/page.tsx (après le contenu existant)
import Image from "next/image";





export default function ServicesPage() {
  const t = useTranslations('ServicesPage'); // si tu veux traduire plus tard

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Conseils et Conception */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-md bg-green-500 text-white flex-shrink-0">
                  <Brain className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Conseils et Conception
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Nous vous accompagnons dans la définition de votre projet, 
                en vous proposant des conseils personnalisés sur le design, 
                le choix des matériaux et l’implantation optimale de votre 
                piscine naturelle organique. 
                <br />Notre objectif : allier esthétique, durabilité et 
                performance écologique.
              </p>
            </div>

            {/* Formation */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-md bg-green-500 text-white flex-shrink-0">
                  <NotebookPen className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Formation
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Participez à nos formations complètes sur les techniques de 
                construction et de filtration propres aux piscines naturelles 
                de type « organique ». 
                <br />Vous apprendrez à maîtriser chaque étape, de la 
                préparation du terrain à la mise en eau, en passant par la 
                création des zones de filtration.
              </p>
            </div>

            {/* Accompagnement à la construction */}
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center h-14 w-14 rounded-md bg-green-500 text-white flex-shrink-0">
                  <Hammer className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Accompagnement à la Construction
                </h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Profitez d’un suivi sur mesure pendant la réalisation de votre 
                piscine naturelle. 
                <br />Nous vous guidons dans les étapes clés : excavation, 
                mise en place des bassins, installation de la filtration, 
                plantation aquatique et finitions. 
                <br />Vous bénéficiez d’un regard expert pour éviter les erreurs 
                coûteuses et garantir un résultat optimal.
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
