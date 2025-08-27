import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  type LucideIcon,
  Newspaper,
  PenTool,
  CreditCard,
  Check,
  CheckCheck,
  DollarSign,
  Trophy,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  Star,
  BarChart3,
  Activity as ActivityIcon,
  Globe,
  TreePine,
  Sprout
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_COURSE]: Newspaper,
  [ActivityType.PUBLISH_COURSE]: PenTool,
  [ActivityType.PURCHASE_COURSE]: CreditCard,
  [ActivityType.COMPLETE_LESSON]: CheckCheck,
  [ActivityType.COMPLETE_QUIZ]: Check,
  [ActivityType.CHANGE_PASSWORD]: Lock,
  [ActivityType.COURSE_PURCHASED]: DollarSign,
};

// Couleurs pour les différents types d'activité
const colorMap: Record<ActivityType, { bg: string; icon: string; border: string }> = {
  [ActivityType.SIGN_UP]: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
  [ActivityType.SIGN_IN]: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
  [ActivityType.SIGN_OUT]: { bg: 'bg-gray-50', icon: 'text-gray-600', border: 'border-gray-200' },
  [ActivityType.UPDATE_PASSWORD]: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  [ActivityType.DELETE_ACCOUNT]: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
  [ActivityType.UPDATE_ACCOUNT]: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200' },
  [ActivityType.CREATE_COURSE]: { bg: 'bg-teal-50', icon: 'text-teal-600', border: 'border-teal-200' },
  [ActivityType.PUBLISH_COURSE]: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
  [ActivityType.PURCHASE_COURSE]: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-200' },
  [ActivityType.COMPLETE_LESSON]: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
  [ActivityType.COMPLETE_QUIZ]: { bg: 'bg-lime-50', icon: 'text-lime-600', border: 'border-lime-200' },
  [ActivityType.CHANGE_PASSWORD]: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
  [ActivityType.COURSE_PURCHASED]: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'À l\'instant';
  if (diffInSeconds < 3600)
    return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400)
    return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800)
    return `Il y a ${Math.floor(diffInSeconds / 86400)} jours`;
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'Inscription sur la plateforme';
    case ActivityType.SIGN_IN:
      return 'Connexion';
    case ActivityType.SIGN_OUT:
      return 'Déconnexion';
    case ActivityType.UPDATE_PASSWORD:
      return 'Mot de passe modifié';
    case ActivityType.DELETE_ACCOUNT:
      return 'Compte supprimé';
    case ActivityType.UPDATE_ACCOUNT:
      return 'Profil mis à jour';
    case ActivityType.CREATE_COURSE:
      return 'Cours créé';
    case ActivityType.PUBLISH_COURSE:
      return 'Cours publié';
    case ActivityType.PURCHASE_COURSE:
      return 'Cours acheté';
    case ActivityType.COMPLETE_LESSON:
      return 'Leçon terminée';
    case ActivityType.COMPLETE_QUIZ:
      return 'Quiz réussi';
    case ActivityType.CHANGE_PASSWORD:
      return 'Mot de passe changé';
    case ActivityType.COURSE_PURCHASED:
      return 'Achat effectué';
    default:
      return 'Action inconnue';
  }
}

// Composant pour les statistiques
function StatsCard({ icon: Icon, title, value, subtitle, gradient }: {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle: string;
  gradient: string;
}) {
  return (
    <Card className={`border-0 shadow-xl ${gradient} text-white rounded-2xl overflow-hidden transform hover:scale-105 transition-all duration-300`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
            <p className="text-white/70 text-xs mt-1">{subtitle}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant badge pour les achievements
function AchievementBadge({ icon: Icon, title, description, earned = false }: {
  icon: LucideIcon;
  title: string;
  description: string;
  earned?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
      earned 
        ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg' 
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          earned ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-500'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className={`font-semibold text-sm ${earned ? 'text-emerald-800' : 'text-gray-500'}`}>
            {title}
          </h4>
          <p className={`text-xs ${earned ? 'text-emerald-600' : 'text-gray-400'}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  // Calcul des statistiques (à adapter selon vos données réelles)
  const completedLessons = logs.filter(log => log.action === ActivityType.COMPLETE_LESSON).length;
  const completedQuizzes = logs.filter(log => log.action === ActivityType.COMPLETE_QUIZ).length;
  const purchasedCourses = logs.filter(log => log.action === ActivityType.PURCHASE_COURSE).length;
  const totalActivities = logs.length;

  // Calcul du temps d'apprentissage approximatif (15 min par leçon)
  const estimatedLearningTime = completedLessons * 15;

  // Grouper les activités par date
  const activitiesByDate = logs.reduce((acc, log) => {
    const date = new Date(log.timestamp).toDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivities = logs.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 rounded-xl">
              <ActivityIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Tableau de bord d&apos;activité
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl">
            Suivez votre progression, vos accomplissements et votre activité d&apos;apprentissage écologique.
          </p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <StatsCard
            icon={CheckCheck}
            title="Leçons terminées"
            value={completedLessons}
            subtitle="Formation écologique"
            gradient="bg-gradient-to-br from-emerald-500 to-green-500"
          />
          <StatsCard
            icon={Award}
            title="Quiz réussis"
            value={completedQuizzes}
            subtitle="Évaluations passées"
            gradient="bg-gradient-to-br from-teal-500 to-cyan-500"
          />
          <StatsCard
            icon={Clock}
            title="Temps d'apprentissage"
            value={`${estimatedLearningTime}min`}
            subtitle="Engagement total"
            gradient="bg-gradient-to-br from-lime-500 to-green-500"
          />
          <StatsCard
            icon={BookOpen}
            title="Cours suivis"
            value={purchasedCourses}
            subtitle="Formations actives"
            gradient="bg-gradient-to-br from-green-500 to-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Achievements */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Trophy className="h-5 w-5" />
                  Accomplissements écologiques
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <AchievementBadge
                    icon={Sprout}
                    title="Premier pas vert"
                    description="Première leçon terminée"
                    earned={completedLessons >= 1}
                  />
                  <AchievementBadge
                    icon={TreePine}
                    title="Apprenant eco-responsable"
                    description="5 leçons terminées"
                    earned={completedLessons >= 5}
                  />
                  <AchievementBadge
                    icon={Award}
                    title="Expert en quiz"
                    description="3 quiz réussis"
                    earned={completedQuizzes >= 3}
                  />
                  <AchievementBadge
                    icon={Globe}
                    title="Défenseur de la planète"
                    description="10 leçons terminées"
                    earned={completedLessons >= 10}
                  />
                  <AchievementBadge
                    icon={Star}
                    title="Ambassadeur écologique"
                    description="Cours complet terminé"
                    earned={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activité récente */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <BarChart3 className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {recentActivities.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivities.map((log) => {
                      const Icon = iconMap[log.action as ActivityType] || Settings;
                      const colors = colorMap[log.action as ActivityType] || colorMap[ActivityType.UPDATE_ACCOUNT];
                      const formattedAction = formatAction(log.action as ActivityType);

                      return (
                        <div key={log.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 ${colors.border} ${colors.bg} transition-all duration-200 hover:shadow-md`}>
                          <div className={`p-3 rounded-xl bg-white shadow-sm`}>
                            <Icon className={`w-5 h-5 ${colors.icon}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {formattedAction}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <Calendar className="h-3 w-3" />
                              {getRelativeTime(new Date(log.timestamp))}
                              {log.ipAddress && (
                                <>
                                  <span>•</span>
                                  <span>IP: {log.ipAddress}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune activité pour le moment
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Commencez votre parcours d&apos;apprentissage écologique ! 
                      Vos actions apparaîtront ici.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Résumé de la semaine */}
        {Object.keys(activitiesByDate).length > 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden mt-8">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <TrendingUp className="h-5 w-5" />
                Activité hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{totalActivities}</div>
                  <div className="text-sm text-emerald-700">Actions totales</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{Object.keys(activitiesByDate).length}</div>
                  <div className="text-sm text-green-700">Jours actifs</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-xl">
                  <div className="text-2xl font-bold text-teal-600">
                    {Math.round(totalActivities / Math.max(Object.keys(activitiesByDate).length, 1))}
                  </div>
                  <div className="text-sm text-teal-700">Actions/jour</div>
                </div>
                <div className="text-center p-4 bg-lime-50 rounded-xl">
                  <div className="text-2xl font-bold text-lime-600">
                    {completedLessons > 0 ? '🌱' : '🌿'}
                  </div>
                  <div className="text-sm text-lime-700">Impact écologique</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}