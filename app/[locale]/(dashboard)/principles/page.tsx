// app/[locale]/principes/page.tsx
import { Leaf, Droplets, Recycle, Waves, Sun, Wrench, DollarSign, Flower2, Fish, ArrowRightLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PrincipesPage() {
  const t = useTranslations('PrinciplesPage'); // prêt pour i18n

  return (
    <main>
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl text-center mb-12">
            {t('title', { defaultValue: "Principes et avantages d'une piscine naturelle 'organique'" })}
          </h1>

          {/* Qu'est-ce qu'une piscine organique ? */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <Leaf className="h-8 w-8 text-green-500" />
              <h2 className="text-2xl font-semibold text-gray-900">Qu'est-ce qu'une piscine organique ?</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Les piscines naturelles « organiques » sont une alternative écologique aux piscines traditionnelles. 
              Elles fonctionnent grâce à un équilibre naturel entre la zone de baignade et une zone de filtration 
              composée de plantes aquatiques, sans aucun produit chimique.
            </p>
          </div>

          {/* Filtration de l'eau */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <Droplets className="h-8 w-8 text-blue-500" />
              <h2 className="text-2xl font-semibold text-gray-900">La filtration de l'eau</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Une piscine naturelle se divise en deux zones de surface équivalente :
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>La zone de baignade</li>
              <li>La zone de filtration</li>
            </ul>
            <p className="mt-4 text-gray-600 leading-relaxed">
              La zone de filtration agit comme un gigantesque filtre biologique composé de graviers roulés et de plantes (iris, papyrus, nénuphars, lotus…). 
              Ces plantes consomment les nutriments (issus par exemple des feuilles mortes) et empêchent la prolifération d’algues.
              <br />Il est recommandé d’alimenter la piscine en eau de pluie (pauvre en nutriments) et d’empêcher l’eau de ruissellement d’y entrer pour conserver une eau claire… et potable !
            </p>
          </div>

          {/* Fonctionnement global */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <Recycle className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Comment cela fonctionne ?</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Pour rester propre, une piscine naturelle doit répondre à deux besoins fondamentaux :
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>La circulation de l’eau</li>
              <li>La filtration biologique</li>
            </ul>
          </div>

          {/* Avantages */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <Flower2 className="h-8 w-8 text-pink-500" />
              <h2 className="text-2xl font-semibold text-gray-900">Les avantages d'une piscine organique</h2>
            </div>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-2">
              <li>0 produit chimique (ni chlore, ni sel)</li>
              <li>Un écosystème vivant : plantes, fleurs, insectes, grenouilles et oiseaux</li>
              <li>Eau claire et potable grâce aux plantes filtrantes</li>
              <li>Pas de moustiques : la faune naturelle régule les larves</li>
            </ul>
          </div>

          {/* Circulation de l'eau */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <ArrowRightLeft className="h-8 w-8 text-indigo-500" />
              <h2 className="text-2xl font-semibold text-gray-900">La circulation de l’eau</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Contrairement aux piscines traditionnelles (pompes à eau énergivores et fragiles), les piscines organiques utilisent des <strong>pompes à air</strong>.
              Ces pompes propulsent de l’air en profondeur, créant un courant doux qui traverse le filtre biologique.
              <br />Elles consomment environ 50W, sont compatibles avec une alimentation solaire, et sont sans danger pour la faune aquatique.
            </p>
          </div>

          {/* Coût */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-4">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <h2 className="text-2xl font-semibold text-gray-900">Quel est le coût ?</h2>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Coût de construction</h3>
            <p className="text-gray-600 leading-relaxed">
              Inférieur à une piscine traditionnelle. La principale dépense est le liner (plusieurs milliers d’euros), le reste consiste à :
            </p>
            <ul className="list-disc list-inside text-gray-600 ml-4 mt-2 space-y-1">
              <li>Creuser et préparer le terrain</li>
              <li>Poser géotextile + liner + géotextile</li>
              <li>Installer le système PVC et la pompe à air</li>
              <li>Déposer graviers roulés et plantes aquatiques</li>
              <li>Remplir avec eau de pluie et alimenter en solaire</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Coût de fonctionnement</h3>
            <p className="text-gray-600 leading-relaxed">
              Pratiquement nul : pompe à air alimentée par énergie solaire, filtration naturelle assurée par les plantes.  
              Un entretien léger à l’automne (retrait des feuilles mortes) suffit.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
