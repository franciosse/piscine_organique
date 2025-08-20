// app/dashboard/layout.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Gauge, 
  Activity, 
  Menu, 
  NotebookPen, 
  X,
  Home,
  BookOpen,
  User,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Pour mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Pour desktop
  
  // Restaurer l'état du collapse depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder l'état du collapse dans localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Accueil', shortLabel: 'Accueil' },
    { href: '/dashboard/courses', icon: BookOpen, label: 'Mes cours', shortLabel: 'Cours' },
    { href: '/dashboard/activity', icon: BarChart3, label: 'Progression', shortLabel: 'Stats' },
    { href: '/dashboard/profile', icon: User, label: 'Profil', shortLabel: 'Profil' },
  ];

  return (
    <div className="flex min-h-[calc(100dvh-68px)] bg-gray-50">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-[calc(100dvh-68px)] z-50 lg:z-auto
          bg-white border-r border-gray-200 shadow-lg lg:shadow-none
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Menu</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex justify-end p-2 border-b border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.href} className="relative group">
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`
                      w-full h-12 relative overflow-hidden
                      transition-all duration-200 ease-in-out
                      ${isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-start gap-3'}
                      ${isActive 
                        ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm hover:bg-green-100' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 h-full w-1 bg-green-500 rounded-r" />
                    )}
                    
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-green-600' : ''}`} />
                    
                    {/* Label - visible seulement si pas collapsed sur desktop */}
                    <span className={`font-medium transition-opacity duration-200 ${
                      isCollapsed ? 'lg:hidden' : ''
                    }`}>
                      {item.label}
                    </span>
                  </Button>
                </Link>

                {/* Tooltip pour mode collapsed */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:block absolute left-full top-0 ml-2 z-50">
                    <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                      {item.label}
                      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className={`
            p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200
            transition-all duration-300
            ${isCollapsed ? 'lg:mx-2' : ''}
          `}>
            <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'gap-3'}`}>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : ''}`}>
                <p className="text-sm font-medium text-gray-900">Étudiant</p>
                <p className="text-xs text-gray-500">Version gratuite</p>
              </div>
            </div>
            
            {/* Tooltip pour l'utilisateur en mode collapsed */}
            {isCollapsed && (
              <div className="hidden lg:group-hover:block absolute left-full bottom-0 ml-2 z-50">
                <div className="bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                  Étudiant - Version gratuite
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-[68px] left-4 z-30">
        <Button
          onClick={() => setIsSidebarOpen(true)}
          size="sm"
          className="bg-white shadow-md border border-gray-200 text-gray-600 hover:text-gray-900"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content avec marge adaptative */}
      <main 
        className={`
          flex-1 overflow-hidden transition-all duration-300
          ${isCollapsed ? 'lg:ml-0' : 'lg:ml-0'}
        `}
      >
        {children}
      </main>
    </div>
  );
}