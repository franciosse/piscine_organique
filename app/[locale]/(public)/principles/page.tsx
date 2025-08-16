'use client';

import React from 'react';
import { Leaf, Droplets, Recycle, DollarSign, Flower2, Sparkles} from 'lucide-react';
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function PrincipesPage() {
  const t = useTranslations('PrinciplesPage');

  const FeatureCard = ({
    icon: Icon,
    title,
    children,
    id,
    imageSrc,
    imageAlt,
    imagePosition = 'right'
  }: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    children: React.ReactNode;
    id: string;
    imageSrc?: string;
    imageAlt?: string;
    imagePosition?: 'left' | 'right';
  }) => {
    return (
      <div
        id={id}
        data-section
        className="rounded-2xl p-8 bg-gray-100 shadow-lg transform transition-all duration-700 opacity-100 translate-y-0"
      >
        {/* Header avec icône et titre */}
        <div className="flex items-center gap-4 mb-6 bg-white rounded-xl p-4 shadow-sm">
          <div className="p-3 text-green rounded-xl">
            <Icon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl text-green font-bold">{title}</h2>
        </div>

        {/* Contenu avec image optionnelle */}
        {imageSrc ? (
          <div className={`flex flex-col lg:flex-row gap-6 items-start ${imagePosition === 'left' ? 'lg:flex-row-reverse' : ''}`}>
            {/* Texte */}
            <div className="flex-1 text-gray-600 leading-relaxed">
              {children}
            </div>
            
            {/* Image */}
            <div className="flex-shrink-0 w-full lg:w-80 xl:w-96">
              <div className="relative w-full h-48 lg:h-56 xl:h-64 rounded-lg overflow-hidden shadow-md">
                <Image
                  src={imageSrc}
                  alt={imageAlt || title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
            </div>
          </div>
        ) : (
          /* Texte seul si pas d'image */
          <div className="text-gray-600 leading-relaxed">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="py-20 text-center px-4">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-100 text-green-800 font-medium mb-6">
          <Sparkles className="h-5 w-5 text-green-600" />
          <span>{t('100%natural')}</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-green-700 mb-6">
          {t('title')}
        </h1>
        <p className="max-w-3xl mx-auto text-lg text-gray-700">
          {t('subtitle')}
        </p>
      </section>

      {/* Image principale */}
      <section className="py-8 text-center px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative w-full h-24 md:h-80 lg:h-48 mb-6 rounded-2xl overflow-hidden shadow-lg">
            <Image
              src="/images/Piscine_organique_coupe.png"
              alt="Piscine Organique Principes"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20 space-y-8">
        {/* Définition */}
        <FeatureCard 
          icon={Leaf} 
          title={t('what')} 
          id="definition"
        >
          {t('whatDescription')}
        </FeatureCard>

        {/* Fonctionnement */}
        <FeatureCard 
          icon={Recycle} 
          title={t('how')} 
          id="fonctionnement"
          imageSrc="/images/piscine_organique_vue_dessus.png"
          imageAlt="Piscine Organique Vue de dessus"
          imagePosition="right"
        >
          <div>
            {t('howDescription')}
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-4 mb-4 space-y-2">
              <li>{t('howDescription1')}</li>
              <li>{t('howDescription2')}</li>
            </ul>
            {t('howDescription3')}
          </div>
        </FeatureCard>

        {/* Filtration */}
        <FeatureCard 
          icon={Droplets} 
          title={t('filtration')} 
          id="filtration"
          imageSrc="/images/piscine_organique_nymphaea.jpg"
          imageAlt="Piscine Organique Filtration"
          imagePosition="left"
        >
          <div>
            {t('filtrationDescription')}
            <br/><br/>
            {t('filtrationDescription1')}
          </div>
        </FeatureCard>

        {/* Circulation */}
        <FeatureCard 
          icon={Recycle} 
          title={t('circulation')} 
          id="circulation"
          imageSrc="/images/piscine_organique_hibiscus.jpg"
          imageAlt="Piscine Organique Circulation"
          imagePosition="right"
        >
          <div>
            {t('circulationDescription')}
            <br/><br/>
            {t('circulationDescription1')}
          </div>
        </FeatureCard>

        {/* Construction */}
        <FeatureCard 
          icon={DollarSign} 
          title={t('construction')} 
          id="construction"
          imageSrc="/images/piscine_organique_construction.jpg"
          imageAlt="Piscine Organique Construction"
          imagePosition="left"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('constructioncosts')}</h3>
            <p className="mb-4">{t('constructionCostDescription')}</p>
            
            <ul className="list-disc list-inside text-gray-600 ml-4 mb-6 space-y-2">
              <li>{t('constructionStep1')}</li>
              <li>{t('constructionStep2')}</li>
              <li>{t('constructionStep3')}</li>
              <li>{t('constructionStep4')}</li>
              <li>{t('constructionStep5')}</li>
              <li>{t('constructionStep6')}</li>
              <li>{t('constructionStep7')}</li>
              <li>{t('constructionStep8')}</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('operationalCosts')}</h3>
            <p>{t('operationalCostsDescription')}</p>
          </div>
        </FeatureCard>

        {/* Avantages */}
        <FeatureCard 
          icon={Flower2} 
          title="Les avantages" 
          id="avantages"
          imageSrc="/images/piscine_organique_nenuphar.jpg"
          imageAlt="Piscine Organique Construction"
          imagePosition="right"
        >
          <ul className="list-disc list-inside text-gray-600 ml-4 space-y-2">
            <li>{t('advantagesDescription1')}</li>
            <li>{t('advantagesDescription2')}</li>
            <li>{t('advantagesDescription3')}</li>
            <li>{t('advantagesDescription4')}</li>
            <li>{t('advantagesDescription5')}</li>
            <li>{t('advantagesDescription6')}</li>
            <li>{t('advantagesDescription7')}</li>
            <li>{t('advantagesDescription8')}</li>
          </ul>
        </FeatureCard>
      </section>
    </main>
  );
}