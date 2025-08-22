import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, CreditCard, Database, HeartHandshake, NotebookPen } from 'lucide-react';
import {useTranslations} from 'next-intl';
import { YouTubeEmbed } from "@next/third-parties/google";

export default function HomePage() {
    const t = useTranslations('HomePage');
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                {t('title')} 
                <span className="block text-green-500">{t('subtitle')}</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                {t('description')}
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <a
                  href="/courses"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg rounded-full green-500 hover:bg-green-600"
                  >
                    {t('offer')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              </div>
            </div>
            <div className="mt-12 z-1 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <YouTubeEmbed videoid="KXrLD5hDTzA" height={400} width={720} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl pb-10">
            {t('services')}
          </h1>
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white flex-shrink-0">
                  <Brain className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  {t('consulting')}
                </h2>
              </div>
              <p className="mt-2 text-base text-gray-500">
                {t('consultingDescription')}
              </p>
            </div>
            
            <div className="mt-10 lg:mt-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white flex-shrink-0">
                  <NotebookPen className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  {t('training')}
                </h2>
              </div>
              <p className="mt-2 text-base text-gray-500">
                {t('trainingDescription')}
              </p>
            </div>
            
            <div className="mt-10 lg:mt-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white flex-shrink-0">
                  <HeartHandshake className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">
                  {t('support')}
                </h2>
              </div>
              <p className="mt-2 text-base text-gray-500">
                {t('supportDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                {t('ready')}
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                {t('readyDescription')}
              </p>
            </div>
            <div className="mt-8 lg:mt-0 flex justify-center lg:justify-end">
              <a href="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg rounded-full green-500 hover:bg-green-600"
                >
                  {t('offer')}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
