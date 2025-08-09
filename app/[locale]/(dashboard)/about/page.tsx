// /app/about/page.tsx
import { Briefcase, Leaf, MapPin, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function AboutPage() {
    const t = useTranslations('AboutPage'); // prêt pour i18n

  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <p className="text-lg text-gray-600">
          {t('description')}
        </p>
      </div>

      {/* Présentation personnelle */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-green-200">
          <Image
            src="/images/francois_boulart.png"
            alt="François Boulart"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="text-green-600" /> François Boulart
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {t('activities')}
          </p>
          <p className="text-gray-700 leading-relaxed">
            {t.rich('paganButler', {
            link: (chunks) => (
              <a
                href="http://www.organicpools.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline hover:text-green-800"
              >
                {chunks}
              </a>
            )
          })}
          </p>
        </div>
      </div>

      <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
        <Image
          src="/images/eau_piscine.jpg"
          alt="Piscine Organique"
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent"></div>
      </div>

      {/* Mission */}
      <div className="bg-green-50 rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
          <Leaf className="text-green-600" /> {t('mission')}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {t.rich('missionDescription', {
            strong: (chunks) => <strong>{chunks}</strong>,
      })}
        </p>
      </div>

      {/* Engagements */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <Briefcase className="text-green-600 w-8 h-8 mb-3" />
          <h3 className="font-semibold mb-2">{t('expertise')}</h3>
          <p className="text-sm text-gray-600">
            {t('expertiseDescription')}
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <Leaf className="text-green-600 w-8 h-8 mb-3" />
          <h3 className="font-semibold mb-2">{t('nature')}</h3>
          <p className="text-sm text-gray-600">
            {t('natureDescription')}
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition">
          <Users className="text-green-600 w-8 h-8 mb-3" />
          <h3 className="font-semibold mb-2">{t('community')}</h3>
          <p className="text-sm text-gray-600">
            {t('communityDescription')}
          </p>
        </div>
      </div>
    </section>
  );
}
