'use client';

import React, { useEffect, useState } from 'react';
import { Leaf, Droplets, Recycle, Waves, Sun, DollarSign, Flower2, Fish, ArrowRightLeft, Sparkles, Heart, Dot } from 'lucide-react';
import Image from "next/image";
import { useTranslations } from "next-intl";


export default function PrincipesPage() {
      const t = useTranslations('PrinciplesPage'); // prêt pour i18n

  const FeatureCard = ({
    icon: Icon,
    title,
    children,
    id,
  }: {
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    title: string;
    children: React.ReactNode;
    id: string;
  }) => {
    return (
      <div
        id={id}
        data-section
        className={`rounded-2xl p-8 bg-gray-100 shadow-lg transform transition-all duration-700 opacity-100 translate-y-0'        }`}
      >
        <div className="flex items-center gap-4 mb-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="p-3 text-green rounded-xl">
            <Icon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl text-green font-bold">{title}</h2>
        </div>
        <div className="text-gray-600 leading-relaxed">{children}</div>
      </div>
    );
  };

  return (
    <main className="bg-white min-h-screen">
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

      <section className="py-1 text-center px-4">
          <div className="relative w-full h-68 mb-6 rounded-lg overflow-hidden">
                <Image
                  src="/images/piscine_organique_3d_filtration.png"
                  alt="Piscine Organique Principes"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-transparent"></div>
              </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20 space-y-8">
        <FeatureCard icon={Leaf} title={t('what')} id="definition">
          {t('whatDescription')}
        </FeatureCard>

        <FeatureCard icon={Recycle} title={t('how')} id="fonctionnement">
          {t('howDescription')}
          <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
            <li>{t('howDescription1')}</li>
            <li>{t('howDescription2')}</li>
          </ul>
          {t('howDescription3')}
        </FeatureCard>

        <FeatureCard icon={Droplets} title={t('filtration')} id="filtration">
          {t('filtrationDescription')}
          <br/>
          {t('filtrationDescription1')}
        </FeatureCard>

        <FeatureCard icon={Recycle} title={t('circulation')} id="circulation">
          {t('circulationDescription')}
          <br/>
          {t('circulationDescription1')}
        </FeatureCard>

        <FeatureCard icon={DollarSign} title={t('construction')} id="construction">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('constructioncosts')}</h3>
              {t('constructionCostDescription')}
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>{t('constructionStep1')}</li>
              <li>{t('constructionStep2')}</li>
              <li>{t('constructionStep3')}</li>
              <li>{t('constructionStep4')}</li>
              <li>{t('constructionStep5')}</li>
              <li>{t('constructionStep6')}</li>
              <li>{t('constructionStep7')}</li>
              <li>{t('constructionStep8')}</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">{t('operationalCosts')}</h3>
              {t('operationalCostsDescription')}
        </FeatureCard>

        <FeatureCard icon={Flower2} title="Les avantages" id="avantages">
          <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
            <li> {t('advantagesDescription1')}</li>
            <li> {t('advantagesDescription2')}</li>
            <li> {t('advantagesDescription3')}</li>
            <li> {t('advantagesDescription4')}</li>
            <li> {t('advantagesDescription5')}</li>
            <li> {t('advantagesDescription6')}</li>
            <li> {t('advantagesDescription7')}</li>
            <li> {t('advantagesDescription8')}</li>
          </ul>
        </FeatureCard>
      </section>
    </main>
  );
}
