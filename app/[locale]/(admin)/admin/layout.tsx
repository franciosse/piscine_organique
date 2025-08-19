'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Settings, 
  Shield, 
  Activity, 
  Menu, 
  X,
  Home,
  BookOpen,
  BarChart3,
  Crown
} from 'lucide-react';

export default function AdminDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { href: '/admin', icon: Home, label: 'Tableau de bord', shortLabel: 'Accueil' },
    { href: '/admin/courses', icon: BookOpen, label: 'Gestion des cours', shortLabel: 'Cours' },
    { href: '/admin/users', icon: Users, label: 'Gestion des utilisateurs', shortLabel: 'Users' },
    // { href: '/admin/analytics', icon: BarChart3, label: 'Analytiques', shortLabel: 'Stats' },
    // { href: '/admin/settings', icon: Settings, label: 'Paramètres', shortLabel: 'Config' },
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
          w-64 lg:w-20 xl:w-64
          bg-white border-r border-gray-200 shadow-lg lg:shadow-none
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-semibold text-gray-900">Administration</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`
                    w-full justify-start gap-3 h-12 relative overflow-hidden group
                    transition-all duration-200 ease-in-out
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm hover:bg-blue-100' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />
                  )}
                  
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                  
                  {/* Label with responsive visibility */}
                  <span className="lg:hidden xl:block font-medium">
                    {item.label}
                  </span>
                  <span className="hidden lg:block xl:hidden font-medium text-xs">
                    {item.shortLabel}
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Admin section at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="lg:hidden xl:block">
                <p className="text-sm font-medium text-gray-900">Administrateur</p>
                <p className="text-xs text-gray-500">Accès complet</p>
              </div>
            </div>
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

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}