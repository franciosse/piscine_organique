'use client';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Icon, ChevronDown, Leaf, Droplet, Menu, X, Settings, User2, Sprout, TreePine, Contact, BookOpenCheck } from 'lucide-react';
import { flowerLotus } from "@lucide/lab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/lib/auth/signOut';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import LanguageSwitcher from '@/components/language/languageSwitcher';
import { useTranslations } from 'next-intl';
import logger from '@/lib/logger/logger';


const fetcher = async (url: string) => {
  try {
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data?.user || null;
    
  } catch (error) {
    logger.error('Error fetching user:'+ error);
    return null;
  }
};

function getUserInitials(user: { name?: string | null; email?: string | null }): string {
  if (user?.name && typeof user.name === 'string') {
    return user.name
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  
  if (user?.email && typeof user.email === 'string') {
    const emailPart = user.email.split('@')[0];
    if (emailPart.length >= 2) {
      return emailPart.slice(0, 2).toUpperCase();
    }
    return emailPart[0]?.toUpperCase() || 'U';
  }
  
  return 'U';
}

function getDisplayName(user: { name?: string | null; email?: string | null }): string {
  if (user?.name && typeof user.name === 'string') {
    return user.name.trim();
  }
  
  if (user?.email && typeof user.email === 'string') {
    return user.email.split('@')[0];
  }
  
  return 'Utilisateur';
}

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user, error } = useSWR<User>('/api/account/user', fetcher);
  const router = useRouter();
  const t = useTranslations('Menu');

  async function handleSignOut() {
    await signOut();
    mutate('/api/account/user');
    router.push('/');
  }

  if (error) {
    return (
      <>
        <Button asChild className="rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          <Link className="flex items-center text-white font-semibold px-6" href="/sign-in">
            <Sprout className="h-4 w-4 mr-2" />
            {t('signIn')}
          </Link>
        </Button>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Button asChild className="rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
          <Link className="flex items-center text-white font-semibold px-6" href="/sign-in">
            <Sprout className="h-4 w-4 mr-2" />
            {t('signIn')}
          </Link>
        </Button>
      </>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full">
        <div className="relative group">
          <Avatar className="cursor-pointer size-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl border-2 border-white">
            <AvatarImage alt={user?.name || ''} />
            <AvatarFallback className="text-white font-bold bg-gradient-to-br from-emerald-500 to-green-500">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-72 mt-2 bg-white/95 backdrop-blur-md border-0 shadow-2xl rounded-2xl overflow-hidden z-[9999]"
        style={{ zIndex: 9999 }}
      >
        {/* Header du menu avec info utilisateur */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 border-2 border-white shadow-lg">
              <AvatarImage alt={user?.name || ''} />
              <AvatarFallback className="text-white font-bold bg-gradient-to-br from-emerald-500 to-green-500">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {getDisplayName(user)}
              </p>
              <p className="text-sm text-emerald-600 truncate">
                {user.email}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-500">{t('online')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-2">
          <DropdownMenuItem className="cursor-pointer rounded-xl mb-1 hover:bg-emerald-50 transition-all duration-200 p-3">
            <Link href="/dashboard" className="flex w-full items-center">
              <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                <Home className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">{t('dashboard')}</span>
                <p className="text-xs text-gray-500">{t('mydashboard')}</p>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer rounded-xl mb-1 hover:bg-emerald-50 transition-all duration-200 p-3">
            <Link href="/dashboard/profile" className="flex w-full items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <User2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="font-medium text-gray-900">{t('profile')}</span>
                <p className="text-xs text-gray-500">{t('myprofile')}</p>
              </div>
            </Link>
          </DropdownMenuItem>
          
          {isAdmin && (
            <>
              <DropdownMenuSeparator className="my-2 bg-emerald-100" />
              <DropdownMenuItem className="cursor-pointer rounded-xl mb-1 hover:bg-purple-50 transition-all duration-200 p-3">
                <Link href="/admin" className="flex w-full items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Settings className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{t('admin')}</span>
                    <p className="text-xs text-gray-500">{t('myadmin')}</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </div>

        <DropdownMenuSeparator className="bg-emerald-100" />
        
        {/* Bouton de déconnexion */}
        <div className="p-2">
          <form action={handleSignOut} className="w-full">
            <button type="submit" className="flex w-full">
              <DropdownMenuItem className="w-full flex-1 cursor-pointer rounded-xl hover:bg-red-50 transition-all duration-200 p-3 text-red-600">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <LogOut className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-left">
                  <span className="font-medium">{t('logout')}</span>
                  <p className="text-xs text-red-500">{t('mylogout')}</p>
                </div>
              </DropdownMenuItem>
            </button>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/account/user', fetcher);
  const router = useRouter();
  const t = useTranslations('Menu');

  async function handleSignOut() {
    await signOut();
    mutate('/api/account/user');
    router.push('/');
    setIsMobileMenuOpen(false);
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2 rounded-xl hover:bg-emerald-50 transition-all duration-200"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </Button>

      {isMobileMenuOpen && (
        <div 
          className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-2xl z-[9999]"
          style={{ zIndex: 9999 }}
        >
          <div className="flex flex-col p-6 space-y-4 max-w-md mx-auto">
            {/* Navigation principale */}
            <div className="space-y-3">
              <Link 
                href="/about" 
                className="flex items-center py-3 px-4 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TreePine className="h-5 w-5 text-emerald-600 mr-3" />
                <span className="font-medium text-gray-700 group-hover:text-emerald-700">{t('about')}</span>
              </Link>
              
              <Link 
                href="/principles" 
                className="flex items-center py-3 px-4 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Leaf className="h-5 w-5 text-emerald-600 mr-3" />
                <span className="font-medium text-gray-700 group-hover:text-emerald-700">{t('principles')}</span>
              </Link>
              
              <Link 
                href="/services" 
                className="flex items-center py-3 px-4 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Droplet className="h-5 w-5 text-emerald-600 mr-3" />
                <span className="font-medium text-gray-700 group-hover:text-emerald-700">{t('services')}</span>
              </Link>
              
              <Link 
                href="/courses" 
                className="flex items-center py-3 px-4 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BookOpenCheck className="h-5 w-5 text-emerald-600 mr-3" />
                <span className="font-medium text-gray-700 group-hover:text-emerald-700">{t('courses')}</span>
              </Link>
              
              <Link 
                href="/contact" 
                className="flex items-center py-3 px-4 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Contact className="h-5 w-5 text-emerald-600 mr-3" />
                <span className="font-medium text-gray-700 group-hover:text-emerald-700">{t('contact')}</span>
              </Link>
            </div>
            
            {!user ? (
              <div className="pt-4 border-t border-emerald-100">
                <Button asChild className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link 
                    className="flex items-center justify-center text-white font-semibold py-3" 
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sprout className="h-5 w-5 mr-2" />
                    {t('signIn')}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="pt-4 border-t border-emerald-100 space-y-3">
                {/* Profil utilisateur */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                  <Avatar className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 border-2 border-white shadow-lg">
                    <AvatarImage alt={user.name || ''} />
                    <AvatarFallback className="text-white font-bold text-sm bg-gradient-to-br from-emerald-500 to-green-500">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{getDisplayName(user)}</p>
                    <p className="text-sm text-emerald-600">{user.email}</p>
                  </div>
                </div>

                {/* Menu utilisateur */}
                <Link 
                  href="/dashboard" 
                  className="flex items-center py-3 px-4 hover:bg-emerald-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5 text-emerald-600 mr-3" />
                  <span className="font-medium text-gray-700 group-hover:text-emerald-700">{t('dashboard')}</span>
                </Link>
                
                {isAdmin && (
                  <Link 
                    href="/admin" 
                    className="flex items-center py-3 px-4 hover:bg-purple-50 rounded-xl transition-all duration-200 group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">{t('admin')}</span>
                  </Link>
                )}
                
                <button 
                  onClick={handleSignOut}
                  className="flex items-center py-3 px-4 hover:bg-red-50 rounded-xl transition-all duration-200 text-left w-full group"
                >
                  <LogOut className="h-5 w-5 text-red-600 mr-3" />
                  <span className="font-medium text-gray-700 group-hover:text-red-700">{t('logout')}</span>
                </button>
              </div>
            )}
            
            <div className="pt-4 border-t border-emerald-100">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  const t = useTranslations('Menu');

  return (
    <header className="border-b border-emerald-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo amélioré */}
        <Link href="/" className="flex items-center flex-shrink-0 group">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <Icon iconNode={flowerLotus} className="text-white" />
          </div>
          <div className="ml-3">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent hidden sm:block">
              Piscine Organique
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent sm:hidden">
              PO
            </span>
            <p className="text-xs text-gray-500 hidden sm:block">Naturelle, économique et écologique</p>
          </div>
        </Link>

        {/* Menu desktop amélioré */}
        <div className="hidden md:flex items-center space-x-8">
          <Suspense fallback={<div className="h-9" />}>
            <Link 
              href="/about" 
              className="flex items-center hover:text-emerald-600 transition-all duration-300 font-medium relative group py-2"
            >
              {t('about')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/principles" 
              className="flex items-center hover:text-emerald-600 transition-all duration-300 font-medium relative group py-2"
            >
              {t('principles')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/services" 
              className="flex items-center hover:text-emerald-600 transition-all duration-300 font-medium relative group py-2"
            >
              {t('services')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/courses" 
              className="flex items-center hover:text-emerald-600 transition-all duration-300 font-medium relative group py-2"
            >
              {t('courses')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link 
              href="/contact" 
              className="flex items-center hover:text-emerald-600 transition-all duration-300 font-medium relative group py-2"
            >
              {t('contact')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <UserMenu />
            <LanguageSwitcher />
          </Suspense>
        </div>

        {/* Menu mobile */}
        <Suspense fallback={<div className="h-9 w-9" />}>
          <MobileMenu />
        </Suspense>
      </div>
    </header>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50/30 via-white to-green-50/30">
      <Header />
      {children}
    </section>
  );
}