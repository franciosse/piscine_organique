// app/[locale]/unauthorized/page.tsx (si vous utilisez l'internationalisation)
import { AlertTriangle, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Props {
  params: {
    locale: string
  }
}

export default function LocalizedUnauthorizedPage({ params }: Props) {
  // Si vous avez des traductions
   const t = useTranslations('unauthorized')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-lg mx-auto text-center">
        {/* Icône principale */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-12 h-12 text-red-600" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('denied')}
          </h1>
          
          <div className="space-y-4 text-gray-600 mb-8">
            <p className="text-lg">
              {t('noPermissions')}
            </p>
            <p className="text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <strong>
                {t('adminOnly')}
              </strong>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/${params.locale}/dashboard`}
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('dashboard')}
            </Link>
            
            <Link 
              href={`/${params.locale}`}
              className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {t('home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}