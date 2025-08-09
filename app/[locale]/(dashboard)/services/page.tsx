
"use client";
// app/[locale]/services/page.tsx
import { Brain, NotebookPen, Hammer } from 'lucide-react';
import { useTranslations } from 'next-intl';
// À placer à la fin de app/[locale]/services/page.tsx (après le contenu existant)
import { useState } from 'react';
import { Send } from 'lucide-react';

function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // TODO: envoyer vers API interne ou service externe
      await new Promise((resolve) => setTimeout(resolve, 1000)); // simulation envoi
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Contactez-nous
        </h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-8 space-y-6"
        >
          {/* Nom */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            ></textarea>
          </div>

          {/* Bouton */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center px-6 py-3 text-white bg-green-500 hover:bg-green-600 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {status === 'loading' ? 'Envoi...' : 'Envoyer'}
              <Send className="ml-2 h-5 w-5" />
            </button>
          </div>

          {/* Statut */}
          {status === 'success' && (
            <p className="text-center text-green-600 mt-4">Message envoyé avec succès ✅</p>
          )}
          {status === 'error' && (
            <p className="text-center text-red-600 mt-4">Erreur lors de l’envoi ❌</p>
          )}
        </form>
      </div>
    </section>
  );
}


export default function ServicesPage() {
  const t = useTranslations('ServicesPage'); // si tu veux traduire plus tard

  return (
    <main>
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl mb-12 text-center">
            {t('title')}
          </h1>

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
        {<ContactForm />}
      </section>
    </main>
  );
}
