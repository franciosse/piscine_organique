'use client';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Icon, ChevronDown, Leaf, Droplet, Menu, X } from 'lucide-react';
import { flowerLotus } from "@lucide/lab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/lib/auth/signOut';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import LanguageSwitcher from '../components/languageSwitcher';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/account/user', fetcher);
  const router = useRouter();
  const t = useTranslations('Menu');

  console.log('UserMenu user:', user);
  async function handleSignOut() {
    await signOut();
    mutate('/api/account/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link href="/pricing" className="flex items-center hover:text-green-600 transition-colors">
          {t('pricing')}
        </Link>
        <Button asChild className="rounded-full bg-green-500 hover:bg-green-600">
          <Link className="flex items-center text-white" href="/sign-in">{t('signIn')}</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9 rounded-full bg-green-500 hover:bg-green-600">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback className="text-white">
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>{t('dashboard')}</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('logout')}</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Nouveau composant pour le menu mobile
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

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="p-2"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="flex flex-col p-4 space-y-3">
            <Link 
              href="/about" 
              className="flex items-center py-2 hover:text-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('about')}
            </Link>
            <Link 
              href="/principles" 
              className="flex items-center py-2 hover:text-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('principles')}
            </Link>
            <Link 
              href="/services" 
              className="flex items-center py-2 hover:text-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('services')}
            </Link>
            
            {!user ? (
              <>
                <Link 
                  href="/pricing" 
                  className="flex items-center py-2 hover:text-green-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t('pricing')}
                </Link>
                <Button asChild className="rounded-full bg-green-500 hover:bg-green-600 w-full">
                  <Link 
                    className="flex items-center justify-center text-white" 
                    href="/sign-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('signIn')}
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center py-2 hover:text-green-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>{t('dashboard')}</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="flex items-center py-2 hover:text-red-600 transition-colors text-left"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logout')}</span>
                </button>
                <div className="flex items-center py-2">
                  <Avatar className="size-8 rounded-full bg-green-500 mr-2">
                    <AvatarImage alt={user.name || ''} />
                    <AvatarFallback className="text-white text-sm">
                      {user.email
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
              </>
            )}
            
            <div className="pt-2 border-t border-gray-200">
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
    <header className="border-b border-gray-200 z-40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Icon iconNode={flowerLotus} />
          <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">
            Piscine Organique
          </span>
          <span className="ml-2 text-lg font-semibold text-gray-900 sm:hidden">
            PO
          </span>
        </Link>

        {/* Menu desktop */}
        <div className="hidden md:flex items-center space-x-6">
          <Suspense fallback={<div className="h-9" />}>
            <Link href="/about" className="flex items-center hover:text-green-600 transition-colors">
              {t('about')}
            </Link>
            <Link href="/principles" className="flex items-center hover:text-green-600 transition-colors">
              {t('principles')}
            </Link>
            <Link href="/services" className="flex items-center hover:text-green-600 transition-colors">
              {t('services')}
            </Link>
            <Link href="/contact" className="flex items-center hover:text-green-600 transition-colors">
              {t('contact')}
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
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}